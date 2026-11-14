import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Switch,
  Text,
  View,
} from "react-native";
import Slider from "@react-native-community/slider";
import { AirPodsArt } from "../components/AirPods";
import {
  Action,
  Card,
  Copy,
  Icon,
  IconButton,
  IconName,
  Screen,
  styles as s,
} from "../components/ui";
import { android, DeviceControl } from "../lib/android";
import { message, usePods } from "../lib/app-state";
import {
  modelName,
  supportsAdaptive,
  supportsNoiseControl,
} from "../lib/models";

const modes: { value: number; name: string; icon: IconName }[] = [
  { value: 1, name: "Off", icon: "ellipse-outline" },
  { value: 3, name: "Transparency", icon: "ear-outline" },
  { value: 2, name: "Noise cancellation", icon: "volume-mute-outline" },
  { value: 4, name: "Adaptive", icon: "sparkles-outline" },
];
export default function Home() {
  const {
    palette: c,
    snapshot,
    error,
    setError,
    refresh,
    connect,
    disconnect,
    bluetoothSettings,
  } = usePods();
  const [choosing, setChoosing] = useState(false);
  const [searching, setSearching] = useState(false);
  const device = snapshot?.control;
  const connected = device?.status === "connected";
  const connecting = device?.status === "connecting";
  const choose = async () => {
    setSearching(true);
    const result = await refresh(true);
    setSearching(false);
    if (result) setChoosing(true);
  };
  const pick = async (id: string) => {
    setChoosing(false);
    await connect(id);
  };
  return (
    <Screen>
      <View style={s.spread}>
        <View style={s.row}>
          <View
            style={{
              width: 44,
              height: 44,
              backgroundColor: c.container,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="headset-outline" color={c.onContainer} />
          </View>
          <Text style={{ fontSize: 30, fontWeight: "700", color: c.text }}>
            Pods
          </Text>
        </View>
        <IconButton
          name="options-outline"
          label="Settings"
          onPress={() => router.push("/settings")}
        />
      </View>
      {connected && !choosing ? (
        <>
          <Connected device={device} />
          <Action secondary onPress={() => void choose()}>
            Change AirPods
          </Action>
          <Action secondary onPress={() => void disconnect()}>
            Disconnect controls
          </Action>
        </>
      ) : (
        <>
          <View
            style={{
              flex: choosing ? 0 : 1,
              minHeight: 290,
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
              paddingVertical: 24,
            }}
          >
            <View
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: c.container,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {connecting ? (
                <ActivityIndicator size="large" color={c.onContainer} />
              ) : (
                <Icon name="headset-outline" size={80} color={c.onContainer} />
              )}
            </View>
            <Text
              style={{
                color: c.text,
                fontSize: 34,
                lineHeight: 40,
                fontWeight: "600",
                textAlign: "center",
                maxWidth: 340,
              }}
            >
              {connecting
                ? "Connecting to your AirPods"
                : choosing
                  ? "Choose your AirPods"
                  : "Connect your\nAirPods"}
            </Text>
            <Text
              style={{
                color: c.muted,
                fontSize: 17,
                lineHeight: 26,
                textAlign: "center",
                maxWidth: 340,
              }}
            >
              {connecting
                ? "Keep them nearby with the case open, or wear them."
                : choosing
                  ? "Select the name you use in Bluetooth settings."
                  : "Connect your AirPods to see their battery and available controls."}
            </Text>
          </View>
          {(error || device?.error) && (
            <Card>
              <View style={s.row}>
                <Icon name="information-circle-outline" />
                <View style={s.grow}>
                  <Copy>{error || device?.error}</Copy>
                </View>
              </View>
            </Card>
          )}
          {choosing && (
            <Card>
              <Copy title>Paired devices</Copy>
              {snapshot?.paired.length ? (
                [...snapshot.paired]
                  .sort(
                    (a, b) =>
                      Number(/airpods/i.test(b.name)) -
                      Number(/airpods/i.test(a.name)),
                  )
                  .map((item) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Connect to ${item.name}`}
                      onPress={() => void pick(item.id)}
                      style={({ pressed }) => ({
                        paddingVertical: 16,
                        opacity: pressed ? 0.5 : 1,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 16,
                      })}
                    >
                      <Icon name="bluetooth-outline" />
                      <View style={s.grow}>
                        <Copy>{item.name}</Copy>
                        <Copy muted>{item.id.slice(-5)}</Copy>
                      </View>
                      <Icon name="chevron-forward" size={20} />
                    </Pressable>
                  ))
              ) : (
                <Copy muted>
                  {snapshot?.enabled
                    ? "No paired devices yet. Pair your AirPods in Bluetooth settings, then come back here."
                    : "Turn on Bluetooth, then pair your AirPods."}
                </Copy>
              )}
              <Action secondary onPress={() => void choose()} busy={searching}>
                Refresh devices
              </Action>
              {connected && (
                <Action secondary onPress={() => setChoosing(false)}>
                  Back to your AirPods
                </Action>
              )}
            </Card>
          )}
          {!connecting && !choosing && (
            <Card>
              <View style={s.row}>
                <Icon name="bluetooth-outline" />
                <View style={s.grow}>
                  <Copy title>Start with Bluetooth</Copy>
                </View>
              </View>
              <Copy muted>
                Pair your AirPods in your phone’s Bluetooth settings. Already
                paired? Choose them below, even if you’ve renamed them.
              </Copy>
            </Card>
          )}
          <View style={s.gap}>
            {error?.includes("Nearby devices") && (
              <Action
                secondary
                onPress={() =>
                  void Linking.openSettings().catch((e) => setError(message(e)))
                }
              >
                App permissions
              </Action>
            )}
            {connecting ? (
              <Action secondary onPress={() => void disconnect()}>
                Cancel connection
              </Action>
            ) : (
              !choosing && (
                <Action busy={searching} onPress={() => void choose()}>
                  Choose AirPods
                </Action>
              )
            )}
            <Action secondary onPress={() => void bluetoothSettings()}>
              Bluetooth settings
            </Action>
          </View>
        </>
      )}
    </Screen>
  );
}
function Connected({ device }: { device: DeviceControl }) {
  const { palette: c, snapshot, refresh } = usePods();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const model = modelName(device.modelNumber);
  const change = async (
    key: string,
    action: () => Promise<unknown> | undefined,
  ) => {
    if (pending) return;
    setPending(key);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setPending(null);
    }
  };
  const batteries = Object.entries(device.batteries);
  const inEar = device.primaryEar === 0 || device.secondaryEar === 0;
  return (
    <>
      <Card tonal>
        <View style={s.row}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: c.onContainer,
            }}
          />
          <Text
            style={{ color: c.onContainer, fontSize: 14, fontWeight: "600" }}
          >
            Connected
          </Text>
        </View>
        <Text
          style={{
            color: c.onContainer,
            fontSize: 30,
            lineHeight: 36,
            fontWeight: "600",
          }}
        >
          {device.name ?? "AirPods"}
        </Text>
        {device.modelNumber && (
          <Text style={{ color: c.onContainer, fontSize: 15 }}>{model}</Text>
        )}
        {model.startsWith("AirPods Pro") ? (
          <AirPodsArt />
        ) : (
          <View style={{ alignItems: "center", padding: 36 }}>
            <Icon
              name={model.includes("Max") ? "headset-outline" : "ear-outline"}
              size={100}
              color={c.onContainer}
            />
          </View>
        )}
        {device.primaryEar !== null && (
          <Text style={{ color: c.onContainer, fontSize: 15 }}>
            {inEar
              ? "In your ears"
              : device.primaryEar === 2 && device.secondaryEar === 2
                ? "In the case"
                : "Out of your ears"}
          </Text>
        )}
      </Card>
      <Card>
        <View style={s.spread}>
          <Copy title>Battery</Copy>
          <IconButton
            name="refresh-outline"
            label="Refresh AirPods readings"
            onPress={() =>
              void change("refresh", () => android?.refreshReadings())
            }
          />
        </View>
        {batteries.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 24 }}>
            {batteries.map(([part, battery]) => (
              <View key={part} style={{ flexGrow: 1, gap: 8 }}>
                <Copy muted>
                  {part === "case"
                    ? "Case"
                    : part === "left"
                      ? "Left"
                      : part === "headset"
                        ? "Headphones"
                        : "Right"}
                </Copy>
                <View style={s.row}>
                  <Text
                    style={{ color: c.text, fontSize: 28, fontWeight: "600" }}
                  >
                    {battery.level === null
                      ? "Unavailable"
                      : `${battery.level}%`}
                  </Text>
                  {battery.stale && <Copy muted>Last reading</Copy>}
                  {battery.charging && (
                    <Icon name="flash" size={18} color={c.primary} />
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Copy muted>Waiting for a battery reading from your AirPods.</Copy>
        )}
      </Card>
      {error && (
        <Card>
          <Copy>{error}</Copy>
        </Card>
      )}
      {(device.mode !== null ||
        supportsNoiseControl(device.modelNumber, device.name)) && (
        <Card>
          <View style={s.spread}>
            <Copy title>Listening mode</Copy>
            {pending === "mode" && <ActivityIndicator color={c.primary} />}
          </View>
          {device.mode === null && (
            <Copy muted>
              Reading current mode. You can select a mode below.
            </Copy>
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {modes
              .filter(
                (mode) =>
                  mode.value !== 4 ||
                  device.mode === 4 ||
                  supportsAdaptive(device.modelNumber),
              )
              .map((mode) => (
                <Pressable
                  key={mode.value}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: device.mode === mode.value,
                    disabled: pending !== null,
                  }}
                  accessibilityLabel={mode.name}
                  disabled={pending !== null}
                  onPress={() =>
                    void change("mode", () =>
                      android?.setListeningMode(mode.value),
                    )
                  }
                  style={({ pressed }) => ({
                    width: "47%",
                    flexGrow: 1,
                    minHeight: 112,
                    padding: 18,
                    borderRadius: 30,
                    backgroundColor:
                      device.mode === mode.value ? c.container : c.background,
                    opacity: pressed ? 0.6 : 1,
                    justifyContent: "center",
                    gap: 12,
                  })}
                >
                  <Icon
                    name={mode.icon}
                    color={device.mode === mode.value ? c.onContainer : c.text}
                  />
                  <Text
                    style={{
                      color:
                        device.mode === mode.value ? c.onContainer : c.text,
                      fontSize: 15,
                      lineHeight: 20,
                      fontWeight: "500",
                    }}
                  >
                    {mode.name}
                  </Text>
                </Pressable>
              ))}
          </View>
        </Card>
      )}
      {device.conversation !== null && (
        <Card>
          <View style={s.spread}>
            <View style={{ flex: 1, gap: 8 }}>
              <Copy title>Conversation awareness</Copy>
              <Copy muted>
                Let your AirPods respond when you start speaking.
              </Copy>
            </View>
            {pending === "conversation" ? (
              <ActivityIndicator color={c.primary} />
            ) : (
              <Switch
                accessibilityLabel="Conversation awareness"
                value={device.conversation}
                disabled={pending !== null}
                trackColor={{ false: c.outline, true: c.primary }}
                thumbColor={c.surface}
                onValueChange={(value) =>
                  void change("conversation", () =>
                    android?.setConversationAwareness(value),
                  )
                }
              />
            )}
          </View>
        </Card>
      )}
      {snapshot && (
        <Card>
          <View style={s.spread}>
            <Copy title>Media volume</Copy>
            <Icon name="volume-high-outline" />
          </View>
          <Slider
            accessibilityLabel="Android media volume"
            value={snapshot.volume}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor={c.primary}
            maximumTrackTintColor={c.outline}
            thumbTintColor={c.primary}
            onSlidingComplete={(value) =>
              void change("volume", () => android?.setVolume(value))
            }
          />
          <Copy muted>Controls your phone’s current audio output.</Copy>
        </Card>
      )}
    </>
  );
}
