package expo.modules.airpodsandroid

import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.Intent
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AirPodsAndroidModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: error("Android context is unavailable")
  private val audio: AudioManager
    get() = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  override fun definition() = ModuleDefinition {
    Name("AirPodsAndroid")

    AsyncFunction("getSnapshot") {
      // BLUETOOTH_CONNECT is requested by the JS layer before this call.
      val adapter = (context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
      val outputs = audio.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
        .filter { it.type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP || it.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO || it.type == AudioDeviceInfo.TYPE_BLE_HEADSET }
        .map { it.productName.toString() }.distinct()
      mapOf(
        "enabled" to (adapter?.isEnabled ?: false),
        "paired" to (adapter?.bondedDevices?.map { mapOf("name" to (it.name ?: "Bluetooth device"), "id" to it.address) } ?: emptyList()),
        "outputs" to outputs,
        "volume" to audio.getStreamVolume(AudioManager.STREAM_MUSIC).toDouble() / audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
      )
    }

    AsyncFunction("setVolume") { value: Double ->
      val maximum = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
      audio.setStreamVolume(AudioManager.STREAM_MUSIC, (value.coerceIn(0.0, 1.0) * maximum).toInt(), 0)
      audio.getStreamVolume(AudioManager.STREAM_MUSIC).toDouble() / maximum
    }

    AsyncFunction("openBluetoothSettings") {
      context.startActivity(Intent(Settings.ACTION_BLUETOOTH_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    Function("getMaterialColors") { dark: Boolean ->
      if (Build.VERSION.SDK_INT < 31) return@Function null
      fun color(name: String): String {
        val id = context.resources.getIdentifier(name, "color", "android")
        val value = context.getColor(id)
        return String.format("#%06X", 0xFFFFFF and value)
      }
      mapOf(
        "primary" to color(if (dark) "system_accent1_200" else "system_accent1_700"),
        "onPrimary" to color(if (dark) "system_accent1_800" else "system_accent1_0"),
        "container" to color(if (dark) "system_accent1_800" else "system_accent1_100"),
        "onContainer" to color(if (dark) "system_accent1_100" else "system_accent1_900"),
        "background" to color(if (dark) "system_neutral1_900" else "system_neutral1_10"),
        "surface" to color(if (dark) "system_neutral1_800" else "system_neutral1_0"),
        "text" to color(if (dark) "system_neutral1_50" else "system_neutral1_900"),
        "muted" to color(if (dark) "system_neutral2_200" else "system_neutral2_600"),
        "outline" to color(if (dark) "system_neutral2_600" else "system_neutral2_200")
      )
    }
  }
}
