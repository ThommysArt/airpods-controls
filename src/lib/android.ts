import { requireOptionalNativeModule } from "expo";
import { PermissionsAndroid, Platform } from "react-native";

export type PairedDevice = { name: string; id: string };
export type DeviceControl = {
  status: "disconnected" | "connecting" | "connected" | "error";
  error: string | null;
  id: string | null;
  name: string | null;
  mode: number | null;
  conversation: boolean | null;
  modelNumber: string | null;
  primaryEar: number | null;
  secondaryEar: number | null;
  batteries: Partial<
    Record<
      "left" | "right" | "case",
      { level: number | null; charging: boolean | null }
    >
  >;
};
export type Snapshot = {
  enabled: boolean;
  paired: PairedDevice[];
  outputs: string[];
  volume: number;
  control: DeviceControl;
};
type AndroidBridge = {
  getSnapshot(): Promise<Snapshot>;
  connectDevice(id: string): Promise<void>;
  disconnectDevice(): Promise<void>;
  setListeningMode(mode: number): Promise<void>;
  setConversationAwareness(enabled: boolean): Promise<void>;
  setVolume(value: number): Promise<number>;
  openBluetoothSettings(): Promise<void>;
  getMaterialColors(dark: boolean): Record<string, string> | null;
};
export const android =
  Platform.OS === "android"
    ? requireOptionalNativeModule<AndroidBridge>("AirPodsAndroid")
    : null;
export async function hasBluetoothPermission() {
  return (
    Platform.OS === "android" &&
    (Number(Platform.Version) < 31 ||
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ))
  );
}
export async function readAndroid(
  requestPermission = false,
): Promise<Snapshot> {
  if (!android)
    throw new Error("Install the Android app to connect your AirPods.");
  if (!(await hasBluetoothPermission())) {
    if (
      !requestPermission ||
      (await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      )) !== PermissionsAndroid.RESULTS.GRANTED
    ) {
      throw new Error(
        "Allow Nearby devices access in app settings to connect your AirPods.",
      );
    }
  }
  return android.getSnapshot();
}
