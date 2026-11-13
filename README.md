# Pods

AirPods controls for Android, built with Expo SDK 58 and HeroUI Native. The interface uses Material You wallpaper colors, rounded controls, and your phone's light or dark appearance.

[Download the Android preview](https://github.com/ThommysArt/airpods-controls/releases).

## Connect

Pair your AirPods in Android Bluetooth settings, open Pods, and tap **Choose AirPods**. Allow Nearby devices access and select your device. Renamed AirPods are supported because selection uses the paired device address, not its name. No location or microphone permission is requested.

The app starts with a dedicated connection screen. There are no sample readings, demo controls, bottom tabs, or feature-explanation popups. Appearance settings are available from the top-right button.

## Device controls

The native module opens an encrypted classic Bluetooth L2CAP connection to the AirPods accessory protocol, subscribes to notifications, and reads actual battery, listening-mode, conversation-awareness, ear-status, and model information. Listening-mode and conversation-awareness changes wait for a device notification before changing the displayed value. Unknown or disconnected batteries remain unavailable.

The UI adapts to reported settings. It shows listening controls only after receiving a listening-mode notification, and conversation awareness only after receiving its current state. Adaptive mode requires a known compatible model or an Adaptive notification. Model identification uses Apple's published hardware identifiers, never a device nickname. The model directory covers ordinary AirPods, Pro, and Max generations; this is not a claim that every model has been physically tested.

Media volume controls Android's current audio output. Ear status is displayed when reported; automatic playback pausing is not implemented. Conversation awareness configures the earbuds; automatic Android volume ducking is not implemented. Background reconnection, gesture customization, widgets, head tracking, and Apple account services are not implemented in this preview. This is not full iPhone feature parity.

### Android compatibility

Classic L2CAP PSM 0x1001 is not available through Android's public BLE socket API. This build uses targeted BluetoothSocket reflection with the Apache-licensed AndroidHiddenApiBypass library. Android Bluetooth stack changes can prevent a connection. Newer Pixel Android 16 QPR3 or Android 17 builds with current Google Play system updates are the intended starting point. The app does not install root tools or modify the system.

A connection is marked ready only after a recognized AirPods notification arrives. Failures return to connection setup. Physical Pixel 9 and AirPods testing is still required; successful compilation and protocol tests do not establish hardware compatibility.

Protocol documentation and compatibility references:

- [AAP message definitions](https://github.com/tyalie/AAP-Protocol-Defintion)
- [LibrePods protocol documentation](https://github.com/librepods-org/librepods/blob/main/docs/AAP%20Definitions.md)
- [LibrePods Android compatibility](https://github.com/librepods-org/librepods/blob/main/android/README.md)
- [Apple model identifiers](https://support.apple.com/en-us/109525)
- [AndroidHiddenApiBypass](https://github.com/LSPosed/AndroidHiddenApiBypass)

The native transport and packet decoder are implemented in this repository. No LibrePods application implementation is included.

## Development

```sh
npm install
npm start
```

`npm start` uses an Expo Go tunnel and skips the browser launcher. For a direct local connection, use `npm start -- --lan`.

Device connections require a development or standalone Android build. Expo Go does not include the local Bluetooth module.

```sh
npx eas-cli@latest build --platform android --profile development
```

After installing the development APK, run `npm run start:dev` and scan its QR code with the installed Pods app. This uses the same public tunnel, with a direct development-client link. Expo Go remains available through `npm start`.

The EAS project is [@thommysart24/airpods-controls](https://expo.dev/accounts/thommysart24/projects/airpods-controls). Development and preview profiles use local signing credentials from the git-ignored `credentials.json`. The signing key stays outside the repository; EAS receives the credentials needed to sign each requested build.

The authored Android module lives in `modules/airpods-android`. Expo generates the native application project during prebuild. Appearance preferences are stored locally; device addresses and notification data are not uploaded.

## Validation

```sh
npm run typecheck
npm run lint
npx expo-doctor
npx expo export --platform android
npx expo prebuild --platform android --no-install
cd android
./gradlew :airpods-android:testDebugUnitTest
```

Protocol tests exercise documented battery packets, unavailable readings, malformed messages, fragmented and coalesced notifications, model identification, recovery from invalid input, and command encoding.

## Standalone previews

```sh
npx eas-cli@latest build --platform android --profile preview
```

For a local Android SDK build, generate the Android project and run `./gradlew app:assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64` inside `android/`. From the repository root, sign the resulting APK:

```sh
scripts/sign-preview.sh android/app/build/outputs/apk/release/app-release.apk 0.2.0-preview.1
```

The script writes the APK and checksum to `artifacts/`. It keeps the preview signing key in `${XDG_DATA_HOME:-$HOME/.local/share}/pods-controls`, outside the repository. Preserve that key to sign compatible updates.
