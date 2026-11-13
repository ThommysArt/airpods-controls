# Pods

An Expo + HeroUI Native Android app for AirPods Pro 3. Material You colors, rounded controls, system/light/dark appearance, and local appearance preferences.

## Run

```sh
npm install
npx expo start
```

The app starts in **Preview**, clearly marked with sample readings. Listening modes, conversation awareness, and ear detection in Preview change local UI state only. They never send commands to the earbuds. Appearance preferences persist locally.

For native Android functions:

```sh
npx expo run:android
```

This requires Android Studio, an Android SDK, and an emulator or connected Android phone. Alternatively use the development profile in `eas.json`. The local Expo module is discovered from `modules/` during prebuild. Expo Go does not contain that module, so it supports the interface preview only. This project targets mobile; HeroUI Native does not recommend web deployment.

## Current implementation

- HeroUI Native buttons and provider, Uniwind/Tailwind setup, React Native layout, SVG device illustration.
- Listen, Controls, and Settings screens with accessible labels and scrollable layouts.
- Android 12+ wallpaper color resources, plus light/dark fallback palettes on older Android and Expo Go.
- Android Nearby devices permission requested only when connecting. No location, microphone, or background service permissions.
- Native Bluetooth settings shortcut, paired device list, available Bluetooth audio outputs, and Android media volume.
- Refresh on returning from settings. AirPods detection uses audio output names, not a verified model identifier. Renamed AirPods may not be recognized. A detected output does not prove audio is currently routed through it.
- Separate battery readings remain unknown in live mode. The slider controls Android media volume for the current output, including the phone speaker if no headset is routed.

## Hardware work still required

This is an app foundation with a usable preview, not a complete replacement for Apple's AirPods settings. There is no AirPods control transport in this build. The following require verified device protocol work and tests with AirPods Pro 3 hardware:

- BLE battery advertisements and reliable model identification.
- Noise control, adaptive audio, conversation awareness, personalized volume, loud sound reduction, and gesture configuration.
- Ear detection events, media session integration, background connection state, notifications, and widgets.
- Head gestures, head tracking, and any exposed heart-rate telemetry.

Apple services such as Siri, account-based device switching, Find My precision finding, firmware distribution, hearing health setup, and Apple Live Translation are not implemented or promised. Some features have no public Android equivalent. Every feature's current availability is explained in Settings.

References:

- [Apple: pair with a non-Apple device](https://support.apple.com/en-asia/guide/airpods/-dev499c9718b/web)
- [AirPods Pro 3 specifications and requirements](https://www.apple.com/airpods-pro/specs/)
- [HeroUI Native setup](https://heroui.com/en/docs/native/getting-started/quick-start)

## Checks

```sh
npm run typecheck
npx expo-doctor
npx expo export --platform android
```

A successful JS export does not validate the Kotlin module or AirPods compatibility. Those require an Android build and physical-device testing.
