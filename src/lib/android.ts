import { requireOptionalNativeModule } from 'expo-modules-core';
import { PermissionsAndroid, Platform } from 'react-native';

export type Snapshot = { enabled: boolean; paired: { name: string; id: string }[]; outputs: string[]; volume: number };
type AndroidBridge = {
  getSnapshot(): Promise<Snapshot>;
  setVolume(value: number): Promise<number>;
  openBluetoothSettings(): Promise<void>;
  getMaterialColors(dark: boolean): Record<string, string> | null;
};
export const android = Platform.OS === 'android' ? requireOptionalNativeModule<AndroidBridge>('AirPodsAndroid') : null;

export async function readAndroid(): Promise<Snapshot> {
  if (!android) throw new Error('Live controls need an Android development build. Preview works in Expo Go.');
  if (Number(Platform.Version) >= 31) {
    const permission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, {
      title: 'Connect to your AirPods',
      message: 'Nearby devices access lets the app read paired Bluetooth devices. No location access is needed.',
      buttonPositive: 'Continue',
      buttonNegative: 'Cancel',
    });
    if (permission !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Nearby devices access is off. Enable it in Android app settings to view your AirPods.');
  }
  return android.getSnapshot();
}
