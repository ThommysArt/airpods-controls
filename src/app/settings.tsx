import packageInfo from "../../package.json";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, Share, Pressable, Switch, Text, View } from "react-native";
import {
  Action,
  Card,
  Copy,
  Icon,
  IconButton,
  Screen,
  styles as s,
} from "../components/ui";
import { message, usePods } from "../lib/app-state";
export default function Settings() {
  const {
    palette: c,
    snapshot,
    theme,
    setTheme,
    dynamic,
    setDynamic,
    bluetoothSettings,
  } = usePods();
  const [reportError, setReportError] = useState<string | null>(null);
  const shareBatteryReport = async () => {
    setReportError(null);
    try {
      await Share.share({
        title: "Pods battery report",
        message: JSON.stringify(
          {
            appVersion: packageInfo.version,
            androidVersion: Platform.Version,
            model: snapshot?.control.modelNumber,
            readings: snapshot?.control.batteries,
            reports: snapshot?.control.batteryReports ?? [],
          },
          null,
          2,
        ),
      });
    } catch (error) {
      setReportError(message(error));
    }
  };
  return (
    <Screen>
      <View style={s.row}>
        <IconButton
          name="arrow-back"
          label="Back"
          onPress={() => router.back()}
        />
        <Text style={{ color: c.text, fontSize: 30, fontWeight: "600" }}>
          Settings
        </Text>
      </View>
      <Card>
        <Copy title>Appearance</Copy>
        <Copy muted>Choose how Pods looks on your phone.</Copy>
        <View style={{ gap: 8 }}>
          {(["system", "light", "dark"] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: theme === value }}
              onPress={() => setTheme(value)}
              style={{
                borderRadius: 28,
                padding: 18,
                minHeight: 56,
                backgroundColor: theme === value ? c.container : c.background,
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
              }}
            >
              <Icon
                name={
                  value === "system"
                    ? "phone-portrait-outline"
                    : value === "dark"
                      ? "moon-outline"
                      : "sunny-outline"
                }
              />
              <View style={s.grow}>
                <Copy>
                  {value === "system"
                    ? "Follow your phone"
                    : value === "light"
                      ? "Light"
                      : "Dark"}
                </Copy>
              </View>
              {theme === value && <Icon name="checkmark" />}
            </Pressable>
          ))}
        </View>
      </Card>
      <Card>
        <View style={s.spread}>
          <View style={{ flex: 1, gap: 8 }}>
            <Copy title>Wallpaper colors</Copy>
            <Copy muted>Use your Android color palette.</Copy>
          </View>
          <Switch
            accessibilityLabel="Wallpaper colors"
            value={dynamic}
            onValueChange={setDynamic}
            trackColor={{ false: c.outline, true: c.primary }}
            thumbColor={c.surface}
          />
        </View>
      </Card>
      {snapshot?.control.status === "connected" && (
        <Action secondary onPress={() => void shareBatteryReport()}>
          Share battery report
        </Action>
      )}
      {reportError && <Copy>{reportError}</Copy>}
      <Action secondary onPress={() => void bluetoothSettings()}>
        Bluetooth settings
      </Action>
    </Screen>
  );
}
