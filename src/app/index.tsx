import "../../global.css";
import { router, useLocalSearchParams } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AppState,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native/provider";
import { Button } from "heroui-native/button";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Uniwind } from "uniwind";
import { AirPodsArt } from "../components/AirPods";
import { android, readAndroid, Snapshot } from "../lib/android";
import { getPalette, Palette } from "../lib/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type Tab = "Listen" | "Controls" | "Settings";
type Theme = "system" | "light" | "dark";
const modes: { name: string; icon: IconName; description: string }[] = [
  {
    name: "Off",
    icon: "ellipse-outline",
    description: "Noise control is off. Hear audio without active processing.",
  },
  {
    name: "Transparency",
    icon: "ear-outline",
    description: "Stay in touch with the sounds around you.",
  },
  {
    name: "Adaptive",
    icon: "sparkles-outline",
    description:
      "A balance of quiet and awareness that adapts to your surroundings.",
  },
  {
    name: "Noise cancellation",
    icon: "volume-mute-outline",
    description: "Less outside noise. More of what you love.",
  },
];
const support: {
  name: string;
  status: string;
  detail: string;
  icon: IconName;
}[] = [
  {
    name: "Audio & calls",
    status: "Android",
    icon: "musical-notes-outline",
    detail:
      "Pair in Android Bluetooth settings to listen and take calls. Stem playback controls are handled by the earbuds and Android.",
  },
  {
    name: "Media volume",
    status: "Android",
    icon: "volume-high-outline",
    detail:
      "The volume slider controls Android media volume in a development build. It affects the current audio output.",
  },
  {
    name: "Battery levels",
    status: "Integration needed",
    icon: "battery-half-outline",
    detail:
      "Separate left, right, and case readings need a verified AirPods Pro 3 Bluetooth implementation. This build does not read them yet.",
  },
  {
    name: "Listening modes & gestures",
    status: "Integration needed",
    icon: "ear-outline",
    detail:
      "Changing these settings from the app needs a verified AirPods control protocol. You can switch available listening modes by holding a stem. Preview changes only affect this app.",
  },
  {
    name: "Automatic ear detection",
    status: "Integration needed",
    icon: "pause-circle-outline",
    detail:
      "Ear detection events and Android media-session control need native integration. The preview switch does not pause other apps.",
  },
  {
    name: "Find My & precision finding",
    status: "Apple service",
    icon: "locate-outline",
    detail:
      "This app has no access to Apple’s Find My network or precision finding. It cannot locate or ring a lost case.",
  },
  {
    name: "Siri & automatic switching",
    status: "Apple service",
    icon: "chatbubble-outline",
    detail:
      "Siri is unavailable on Android. Apple’s account-based device switching is not implemented here.",
  },
  {
    name: "Spatial audio & head tracking",
    status: "Unverified",
    icon: "compass-outline",
    detail:
      "Personalized Spatial Audio and head tracking are not implemented. Android spatial audio depends on your phone and playback app.",
  },
  {
    name: "Hearing health & heart rate",
    status: "Unverified",
    icon: "heart-outline",
    detail:
      "Hearing tests, hearing aid setup, hearing protection status, and heart-rate data are not available in this build. No health measurements are shown.",
  },
  {
    name: "Live Translation & firmware",
    status: "Apple service",
    icon: "language-outline",
    detail:
      "Apple Live Translation and AirPods firmware updates are not provided by this app. Use a supported Apple device for Apple’s setup and update flow.",
  },
];

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HeroUINativeProvider>
          <Dashboard />
        </HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Dashboard() {
  const system = useColorScheme();
  const [theme, setTheme] = useState<Theme>("system");
  const [dynamic, setDynamic] = useState(true);
  const [ready, setReady] = useState(false);
  const { tab: currentTab } = useLocalSearchParams<{ tab?: string }>();
  const tab: Tab =
    currentTab === "Controls" || currentTab === "Settings"
      ? currentTab
      : "Listen";
  const setTab = (next: Tab) => router.setParams({ tab: next });
  const [preview, setPreview] = useState(true);
  const [mode, setMode] = useState(3);
  const [volume, setVolume] = useState(0.45);
  const [earDetection, setEarDetection] = useState(true);
  const [conversation, setConversation] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(
    null,
  );
  const dark = theme === "system" ? system === "dark" : theme === "dark";
  const c = getPalette(dark, dynamic);
  const styles = makeStyles(c);

  useEffect(() => {
    AsyncStorage.getItem("pod-settings")
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw);
          if (["system", "light", "dark"].includes(saved.theme))
            setTheme(saved.theme);
          if (typeof saved.dynamic === "boolean") setDynamic(saved.dynamic);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    Uniwind.setTheme(theme);
  }, [theme]);
  useEffect(() => {
    if (ready)
      AsyncStorage.setItem(
        "pod-settings",
        JSON.stringify({ theme, dynamic }),
      ).catch(() => {});
  }, [theme, dynamic, ready]);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active" && !preview && android)
        android
          .getSnapshot()
          .then((s) => {
            setSnapshot(s);
            setVolume(s.volume);
          })
          .catch(() => setSnapshot(null));
    });
    return () => listener.remove();
  }, [preview]);

  async function connect() {
    setBusy(true);
    try {
      const s = await readAndroid();
      setSnapshot(s);
      setVolume(s.volume);
      setPreview(false);
    } catch (e) {
      setNotice({
        title: "Connect your AirPods",
        body:
          e instanceof Error
            ? e.message
            : "Could not read Bluetooth devices. Try again.",
      });
    } finally {
      setBusy(false);
    }
  }
  async function bluetoothSettings() {
    try {
      if (!android)
        throw new Error(
          "Open your phone’s Bluetooth settings, then pair your AirPods. Live access in this app needs an Android development build.",
        );
      await android.openBluetoothSettings();
    } catch (e) {
      setNotice({
        title: "Pair AirPods Pro 3",
        body:
          e instanceof Error ? e.message : "Could not open Bluetooth settings.",
      });
    }
  }
  function info(index: number) {
    setNotice({ title: support[index].name, body: support[index].detail });
  }
  const outputs =
    snapshot?.outputs.filter((name) => /airpods/i.test(name)) ?? [];
  const connected = !preview && outputs.length > 0;
  const deviceName = connected ? outputs[0] : "AirPods Pro 3";

  return (
    <PaletteContext.Provider value={c}>
      <SafeAreaView
        style={styles.page}
        edges={["top", "left", "right", "bottom"]}
      >
        <StatusBar style={dark ? "light" : "dark"} />
        <View style={styles.topbar}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Icon name="headset-outline" size={20} color={c.onContainer} />
            </View>
            <Text style={styles.brandText}>Pods</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View feature support"
            onPress={() => setTab("Settings")}
            style={styles.iconButton}
          >
            <Icon name="options-outline" />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>YOUR SOUND, YOUR WAY</Text>
            <Text style={styles.title}>
              {tab === "Listen"
                ? "A little more quiet."
                : tab === "Controls"
                  ? "Make them yours."
                  : "Just your style."}
            </Text>
            <Text style={styles.subtitle}>
              {tab === "Listen"
                ? "A home for your AirPods on Android."
                : tab === "Controls"
                  ? "Familiar gestures. Your preferences."
                  : "Your theme, connection, and feature support."}
            </Text>
          </View>
          <View style={styles.previewBanner}>
            <Icon
              name={preview ? "flask-outline" : "bluetooth-outline"}
              size={17}
              color={c.onContainer}
            />
            <Text style={styles.bannerText}>
              {preview
                ? "Preview · sample data"
                : connected
                  ? "AirPods audio output detected"
                  : "Live · no AirPods audio output"}
            </Text>
            <Pressable
              accessibilityRole="button"
              style={{ padding: 8 }}
              onPress={preview ? connect : () => setPreview(true)}
              disabled={busy}
            >
              <Text style={styles.bannerAction}>
                {busy ? "Checking…" : preview ? "Connect" : "Preview"}
              </Text>
            </Pressable>
          </View>

          {tab === "Listen" && (
            <>
              <View style={styles.hero}>
                <View style={styles.heroTop}>
                  <Text style={styles.deviceName}>{deviceName}</Text>
                  <View style={styles.status}>
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            preview || connected ? c.primary : c.muted,
                        },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {preview
                        ? "Sample device"
                        : connected
                          ? "Audio available"
                          : "Not connected"}
                    </Text>
                  </View>
                </View>
                <AirPodsArt />
                <View style={styles.batteries}>
                  {["Left", "Right", "Case"].map((name, i) => (
                    <Pressable
                      key={name}
                      accessibilityRole="button"
                      accessibilityLabel={`${name} battery ${preview ? [85, 82, 64][i] + " percent, sample" : "unavailable"}`}
                      onPress={() => info(2)}
                      style={styles.battery}
                    >
                      <Text style={styles.batteryLabel}>{name}</Text>
                      <View style={styles.batteryValue}>
                        <Icon
                          name={
                            i === 2
                              ? "battery-charging-outline"
                              : "battery-half-outline"
                          }
                          size={19}
                          color={c.onContainer}
                        />
                        <Text style={styles.batteryNumber}>
                          {preview ? [85, 82, 64][i] + "%" : "—"}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.sectionHeading}>
                <Label>Listening mode</Label>
                <Text style={styles.smallNote}>
                  {preview ? "Try a mode" : "Hardware integration needed"}
                </Text>
              </View>
              <View style={styles.modes}>
                {modes.map((item, i) => (
                  <Button
                    key={item.name}
                    accessibilityLabel={item.name}
                    accessibilityState={{ selected: preview && mode === i }}
                    onPress={() => (preview ? setMode(i) : info(3))}
                    variant="ghost"
                    style={[
                      styles.mode,
                      {
                        backgroundColor:
                          preview && mode === i ? c.primary : c.surface,
                      },
                    ]}
                  >
                    <Icon
                      name={item.icon}
                      size={25}
                      color={preview && mode === i ? c.onPrimary : c.muted}
                    />
                    <Text
                      style={[
                        styles.modeLabel,
                        { color: preview && mode === i ? c.onPrimary : c.text },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </Button>
                ))}
              </View>
              <Text style={styles.modeDescription}>
                {preview
                  ? modes[mode].description
                  : "Use the stem to change modes. App control is not connected yet."}
              </Text>
              <View style={styles.volumeCard}>
                <View style={styles.volumeHeader}>
                  <View style={styles.inline}>
                    <Icon name="volume-medium-outline" size={21} />
                    <Text style={styles.rowTitle}>Media volume</Text>
                  </View>
                  <Text style={styles.volumeNumber}>
                    {Math.round(volume * 100)}%
                  </Text>
                </View>
                <Slider
                  accessibilityLabel={
                    preview ? "Preview media volume" : "Android media volume"
                  }
                  style={{ width: "100%", height: 44 }}
                  minimumValue={0}
                  maximumValue={1}
                  value={volume}
                  minimumTrackTintColor={c.primary}
                  maximumTrackTintColor={c.outline}
                  thumbTintColor={c.primary}
                  onValueChange={setVolume}
                  onSlidingComplete={async (value) => {
                    if (!preview && android) {
                      try {
                        setVolume(await android.setVolume(value));
                      } catch {
                        setNotice({
                          title: "Volume unavailable",
                          body: "Could not change Android media volume. Try the volume buttons on your phone.",
                        });
                      }
                    }
                  }}
                />
                <Text style={styles.smallNote}>
                  {preview
                    ? "Preview only. Your phone volume stays the same."
                    : "Controls the current Android media output."}
                </Text>
              </View>
              <Label>Made for everyday</Label>
              <View style={styles.card}>
                <Row
                  icon="chatbubbles-outline"
                  title="Conversation awareness"
                  subtitle={
                    preview
                      ? "Lower audio when you start talking"
                      : "Not connected to your AirPods"
                  }
                  right={
                    <Toggle
                      label="Preview conversation awareness"
                      value={preview && conversation}
                      onChange={(v) => (preview ? setConversation(v) : info(3))}
                    />
                  }
                />
                <View style={styles.divider} />
                <Row
                  icon="pause-circle-outline"
                  title="Automatic ear detection"
                  subtitle={
                    preview
                      ? "Pause when an AirPod comes out"
                      : "Hardware integration needed"
                  }
                  right={
                    <Toggle
                      label="Preview automatic ear detection"
                      value={preview && earDetection}
                      onChange={(v) => (preview ? setEarDetection(v) : info(4))}
                    />
                  }
                />
              </View>
              <Pressable
                onPress={() => setTab("Settings")}
                accessibilityRole="button"
                style={styles.footerLink}
              >
                <Icon
                  name="information-circle-outline"
                  size={17}
                  color={c.muted}
                />
                <Text style={styles.footerText}>See what works on Android</Text>
                <Icon name="arrow-forward" size={16} color={c.muted} />
              </Pressable>
            </>
          )}

          {tab === "Controls" && (
            <>
              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Icon
                    name="hand-left-outline"
                    size={32}
                    color={c.onContainer}
                  />
                </View>
                <Text style={styles.cardTitle}>A familiar touch.</Text>
                <Text style={styles.body}>
                  Your AirPods&apos; built-in stem controls work through Bluetooth.
                  Try them while listening.
                </Text>
              </View>
              <Label>On the stem</Label>
              <View style={styles.card}>
                {[
                  {
                    icon: "play-outline" as IconName,
                    title: "Press once",
                    subtitle: "Play, pause, or answer a call",
                  },
                  {
                    icon: "play-skip-forward-outline" as IconName,
                    title: "Press twice",
                    subtitle: "Skip to the next track",
                  },
                  {
                    icon: "play-skip-back-outline" as IconName,
                    title: "Press three times",
                    subtitle: "Go back to the previous track",
                  },
                  {
                    icon: "volume-high-outline" as IconName,
                    title: "Swipe up or down",
                    subtitle: "Adjust listening volume",
                  },
                ].map((item, i) => (
                  <View key={item.title}>
                    {i > 0 && <View style={styles.divider} />}
                    <Row
                      {...item}
                      right={
                        <Icon name="checkmark" size={18} color={c.primary} />
                      }
                    />
                  </View>
                ))}
              </View>
              <Label>Press and hold</Label>
              <View style={styles.card}>
                <Row
                  icon="ear-outline"
                  title="Left AirPod"
                  subtitle="Listening mode settings"
                  onPress={() => info(3)}
                />
                <View style={styles.divider} />
                <Row
                  icon="ear-outline"
                  title="Right AirPod"
                  subtitle="Listening mode settings"
                  onPress={() => info(3)}
                />
              </View>
              <View style={styles.note}>
                <Icon name="information-circle-outline" color={c.muted} />
                <Text style={[styles.body, { flex: 1 }]}>
                  Gesture remapping needs a verified native control connection.
                  This build shows the standard gestures.
                </Text>
              </View>
              <Label>More from your AirPods</Label>
              <View style={styles.card}>
                <Row
                  icon="compass-outline"
                  title="Spatial audio"
                  subtitle="Check Android support"
                  onPress={() => info(7)}
                />
                <View style={styles.divider} />
                <Row
                  icon="locate-outline"
                  title="Find your AirPods"
                  subtitle="About Find My support"
                  onPress={() => info(5)}
                />
                <View style={styles.divider} />
                <Row
                  icon="heart-outline"
                  title="Hearing & fitness"
                  subtitle="Feature availability"
                  onPress={() => info(8)}
                />
              </View>
            </>
          )}

          {tab === "Settings" && (
            <>
              <Label>Appearance</Label>
              <View style={styles.card}>
                <View style={styles.settingBlock}>
                  <Text style={styles.rowTitle}>Theme</Text>
                  <View style={styles.segments}>
                    {(["system", "light", "dark"] as Theme[]).map((item) => (
                      <Button
                        key={item}
                        variant="ghost"
                        accessibilityState={{ selected: theme === item }}
                        onPress={() => setTheme(item)}
                        style={[
                          styles.segment,
                          {
                            backgroundColor:
                              theme === item ? c.container : "transparent",
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: theme === item ? c.onContainer : c.muted,
                            fontWeight: "600",
                            textTransform: "capitalize",
                          }}
                        >
                          {item}
                        </Text>
                      </Button>
                    ))}
                  </View>
                </View>
                <View style={styles.divider} />
                <Row
                  icon="color-palette-outline"
                  title="Wallpaper colors"
                  subtitle="Material You on Android 12 and later"
                  right={
                    <Toggle
                      label="Use wallpaper colors"
                      value={dynamic}
                      onChange={setDynamic}
                    />
                  }
                />
              </View>
              <Label>Your connection</Label>
              <View style={styles.card}>
                <Row
                  icon="bluetooth-outline"
                  title="Bluetooth settings"
                  subtitle="Pair or manage your AirPods"
                  onPress={bluetoothSettings}
                />
                <View style={styles.divider} />
                <Row
                  icon="refresh-outline"
                  title={busy ? "Checking devices…" : "Check paired devices"}
                  subtitle={
                    android
                      ? "Requires Nearby devices access"
                      : "Requires an Android development build"
                  }
                  onPress={connect}
                />
              </View>
              {snapshot && (
                <View style={styles.note}>
                  <Icon name="bluetooth-outline" color={c.muted} />
                  <Text style={[styles.body, { flex: 1 }]}>
                    {!snapshot.enabled
                      ? "Bluetooth is off. Turn it on in Android settings."
                      : snapshot.paired.length
                        ? `Paired devices: ${snapshot.paired.map((d) => d.name).join(", ")}. Audio outputs: ${snapshot.outputs.join(", ") || "none"}.`
                        : "No paired devices. Open the case with your AirPods inside, double-tap the front until the light flashes white, then pair in Bluetooth settings."}
                  </Text>
                </View>
              )}
              <Label>AirPods Pro 3 support</Label>
              <View style={styles.card}>
                {support.map((item, i) => (
                  <View key={item.name}>
                    {i > 0 && <View style={styles.divider} />}
                    <Row
                      icon={item.icon}
                      title={item.name}
                      subtitle={item.status}
                      onPress={() => info(i)}
                    />
                  </View>
                ))}
              </View>
              <Text style={styles.legal}>
                Pods · 0.1.0{"\n"}An independent app. Not affiliated with Apple.
                {"\n"}Preferences stay on this device.
              </Text>
            </>
          )}
        </ScrollView>
        <View style={styles.navigation}>
          {(
            [
              { name: "Listen", icon: "headset-outline" },
              { name: "Controls", icon: "finger-print-outline" },
              { name: "Settings", icon: "settings-outline" },
            ] as { name: Tab; icon: IconName }[]
          ).map((item) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item.name }}
              key={item.name}
              onPress={() => setTab(item.name)}
              style={styles.navItem}
            >
              <View
                style={[
                  styles.navPill,
                  {
                    backgroundColor:
                      tab === item.name ? c.container : "transparent",
                  },
                ]}
              >
                <Icon
                  name={item.icon}
                  color={tab === item.name ? c.onContainer : c.muted}
                />
              </View>
              <Text
                style={[
                  styles.navLabel,
                  { color: tab === item.name ? c.text : c.muted },
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <Modal
          visible={notice !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setNotice(null)}
        >
          <View style={styles.overlay}>
            <View accessibilityViewIsModal style={styles.dialog}>
              <View style={styles.dialogIcon}>
                <Icon
                  name="information-circle-outline"
                  size={28}
                  color={c.onContainer}
                />
              </View>
              <Text accessibilityRole="header" style={styles.cardTitle}>
                {notice?.title}
              </Text>
              <Text style={styles.dialogBody}>{notice?.body}</Text>
              <Button
                style={{ backgroundColor: c.primary, borderRadius: 99 }}
                onPress={() => setNotice(null)}
              >
                <Button.Label style={{ color: c.onPrimary }}>
                  Got it
                </Button.Label>
              </Button>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </PaletteContext.Provider>
  );
}

const PaletteContext = createContext<Palette>(getPalette(false, false));
const Icon = ({
  name,
  size = 22,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) => {
  const c = useContext(PaletteContext);
  return <Ionicons name={name} size={size} color={color ?? c.text} />;
};
const Label = ({ children }: { children: React.ReactNode }) => {
  const c = useContext(PaletteContext);
  const styles = makeStyles(c);
  return <Text style={styles.sectionLabel}>{children}</Text>;
};
const Row = ({
  icon,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) => {
  const c = useContext(PaletteContext);
  const styles = makeStyles(c);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.65 : 1 }]}
    >
      <View style={styles.rowIcon}>
        <Icon name={icon} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {right || <Icon name="chevron-forward" size={18} color={c.muted} />}
    </Pressable>
  );
};
const Toggle = ({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) => {
  const c = useContext(PaletteContext);
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={onChange}
      trackColor={{ false: c.outline, true: c.primary }}
      thumbColor={value ? c.onPrimary : c.muted}
    />
  );
};

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: c.background },
    topbar: {
      width: "100%",
      maxWidth: 600,
      alignSelf: "center",
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    brand: { flexDirection: "row", alignItems: "center", gap: 9 },
    brandIcon: {
      backgroundColor: c.container,
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    brandText: {
      color: c.text,
      fontSize: 23,
      fontWeight: "700",
      letterSpacing: -0.7,
    },
    iconButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      padding: 24,
      paddingTop: 18,
      paddingBottom: 30,
      width: "100%",
      maxWidth: 600,
      alignSelf: "center",
      gap: 16,
    },
    heading: { marginBottom: 6, gap: 8 },
    eyebrow: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 2.5,
      color: c.primary,
    },
    title: {
      fontSize: 35,
      fontWeight: "500",
      color: c.text,
      letterSpacing: -1.5,
      lineHeight: 43,
    },
    subtitle: { color: c.muted, fontSize: 14, lineHeight: 21 },
    previewBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.container,
      borderRadius: 24,
      paddingVertical: 3,
      paddingLeft: 15,
      paddingRight: 8,
      gap: 7,
    },
    bannerText: { color: c.onContainer, fontSize: 12, flex: 1 },
    bannerAction: { color: c.onContainer, fontWeight: "700", fontSize: 12 },
    hero: {
      padding: 20,
      backgroundColor: c.container,
      borderRadius: 32,
      overflow: "hidden",
    },
    heroTop: { gap: 6 },
    deviceName: {
      color: c.onContainer,
      fontSize: 22,
      fontWeight: "600",
      letterSpacing: -0.7,
    },
    status: { flexDirection: "row", alignItems: "center", gap: 5 },
    dot: { width: 5, height: 5, borderRadius: 3 },
    statusText: { color: c.onContainer, fontSize: 11 },
    batteries: { flexDirection: "row", gap: 8 },
    battery: {
      backgroundColor: c.surface,
      borderRadius: 20,
      paddingVertical: 12,
      alignItems: "center",
      flex: 1,
      gap: 5,
    },
    batteryLabel: { color: c.muted, fontSize: 11 },
    batteryValue: { flexDirection: "row", gap: 5, alignItems: "center" },
    batteryNumber: { color: c.text, fontSize: 18, fontWeight: "600" },
    sectionHeading: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 5,
      flexWrap: "wrap",
      gap: 5,
    },
    sectionLabel: {
      color: c.text,
      fontSize: 17,
      fontWeight: "600",
      letterSpacing: -0.3,
      marginTop: 4,
    },
    smallNote: { fontSize: 11, color: c.muted, lineHeight: 16 },
    modes: { flexDirection: "row", gap: 7 },
    mode: {
      flex: 1,
      minWidth: 0,
      height: 98,
      borderRadius: 26,
      flexDirection: "column",
      gap: 10,
      paddingHorizontal: 4,
    },
    modeLabel: { fontSize: 10, textAlign: "center", fontWeight: "500" },
    modeDescription: {
      color: c.muted,
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
      marginTop: -5,
    },
    volumeCard: {
      backgroundColor: c.surface,
      padding: 20,
      borderRadius: 28,
      gap: 4,
    },
    volumeHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    inline: { flexDirection: "row", alignItems: "center", gap: 10 },
    volumeNumber: { color: c.primary, fontWeight: "600", fontSize: 14 },
    card: { backgroundColor: c.surface, borderRadius: 28, overflow: "hidden" },
    row: {
      flexDirection: "row",
      padding: 18,
      alignItems: "center",
      gap: 12,
      minHeight: 78,
    },
    rowIcon: { width: 26, alignItems: "center" },
    rowTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: c.text,
      lineHeight: 20,
    },
    rowSubtitle: { fontSize: 11, color: c.muted, marginTop: 3, lineHeight: 16 },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.outline,
      marginLeft: 56,
      marginRight: 18,
    },
    footerLink: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 7,
      padding: 12,
    },
    footerText: { color: c.muted, fontSize: 12 },
    navigation: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.outline,
      flexDirection: "row",
      justifyContent: "space-around",
      paddingTop: 10,
      paddingBottom: 8,
      backgroundColor: c.background,
    },
    navItem: { alignItems: "center", gap: 4, minWidth: 90, minHeight: 58 },
    navPill: {
      borderRadius: 28,
      width: 64,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    navLabel: { fontSize: 11, fontWeight: "600" },
    featureCard: {
      padding: 26,
      borderRadius: 32,
      backgroundColor: c.container,
      gap: 12,
    },
    featureIcon: { marginBottom: 10 },
    cardTitle: {
      color: c.text,
      fontSize: 25,
      fontWeight: "500",
      letterSpacing: -0.6,
    },
    body: { color: c.muted, fontSize: 13, lineHeight: 21 },
    note: { flexDirection: "row", gap: 12, padding: 12 },
    settingBlock: { padding: 20, gap: 16 },
    segments: {
      flexDirection: "row",
      backgroundColor: c.background,
      padding: 4,
      borderRadius: 99,
      gap: 4,
    },
    segment: { flex: 1, borderRadius: 99, minWidth: 0 },
    legal: {
      color: c.muted,
      fontSize: 11,
      lineHeight: 20,
      textAlign: "center",
      paddingVertical: 12,
    },
    overlay: {
      flex: 1,
      backgroundColor: "#00000077",
      justifyContent: "center",
      padding: 28,
    },
    dialog: {
      backgroundColor: c.surface,
      borderRadius: 32,
      padding: 28,
      gap: 20,
      maxWidth: 440,
      width: "100%",
      alignSelf: "center",
    },
    dialogBody: { color: c.muted, fontSize: 15, lineHeight: 24 },
    dialogIcon: {
      backgroundColor: c.container,
      borderRadius: 25,
      width: 50,
      height: 50,
      alignItems: "center",
      justifyContent: "center",
    },
  });
