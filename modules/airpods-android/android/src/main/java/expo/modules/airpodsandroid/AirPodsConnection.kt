package expo.modules.airpodsandroid

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.os.ParcelUuid
import org.lsposed.hiddenapibypass.HiddenApiBypass
import java.io.IOException
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

internal class AirPodsConnection {
  private val lock = Object()
  private val scheduler = Executors.newSingleThreadScheduledExecutor()
  private var socket: BluetoothSocket? = null
  private var generation = 0
  private var status = "disconnected"
  private var error: String? = null
  private var deviceId: String? = null
  private var name: String? = null
  private var mode: Int? = null
  private var conversation: Boolean? = null
  private var model: String? = null
  private var primaryEar: Int? = null
  private var secondaryEar: Int? = null
  private val batteries = mutableMapOf<String, Map<String, Any?>>()

  fun snapshot(): Map<String, Any?> = synchronized(lock) {
    mapOf("status" to status, "error" to error, "id" to deviceId, "name" to name,
      "mode" to mode, "conversation" to conversation, "modelNumber" to model,
      "primaryEar" to primaryEar, "secondaryEar" to secondaryEar,
      "batteries" to batteries.toMap())
  }

  fun connect(adapter: BluetoothAdapter, device: BluetoothDevice) {
    val token: Int
    synchronized(lock) {
      closeLocked()
      token = generation
      deviceId = device.address; name = device.name ?: "AirPods"
      status = "connecting"
    }
    // connect()/read() are blocking. Neither runs on the JS or Android UI thread.
    Thread({
      var active: BluetoothSocket? = null
      try {
        val opened = createSocket(adapter, device)
        active = opened
        synchronized(lock) { if (token != generation) { opened.close(); return@Thread }; socket = opened }
        scheduler.schedule({ synchronized(lock) {
          if (token == generation && status == "connecting") failLocked("Your phone could not open AirPods controls. Check for an Android system update, then try again.")
        } }, 15, TimeUnit.SECONDS)
        opened.connect()
        synchronized(lock) {
          if (token != generation) return@Thread
          opened.outputStream.write(AapProtocol.handshake)
          opened.outputStream.flush()
        }
        var initialized = false
        val decoder = AapProtocol.Decoder()
        val buffer = ByteArray(4096)
        while (true) {
          val count = opened.inputStream.read(buffer)
          if (count < 0) throw IOException("AirPods disconnected")
          if (!initialized) {
            synchronized(lock) {
              if (token != generation) return@Thread
              opened.outputStream.write(AapProtocol.features)
              opened.outputStream.write(AapProtocol.subscribe)
              opened.outputStream.flush()
            }
            initialized = true
            // Retry the initial subscription while firmware populates its state.
            for (delay in listOf(1L, 3L, 8L)) scheduler.schedule({ synchronized(lock) {
              if (token == generation) try { requestReadingsLocked() } catch (_: IOException) {}
            } }, delay, TimeUnit.SECONDS)
          }
          val updates = decoder.accept(buffer.copyOf(count))
          synchronized(lock) {
            if (token != generation) return@Thread
            for (update in updates) {
              status = "connected"; error = null
              update.mode?.let { mode = it }
              update.conversation?.let { conversation = it }
              update.modelNumber?.let { model = it }
              update.primaryEar?.let { primaryEar = it }
              update.secondaryEar?.let { secondaryEar = it }
              for (battery in update.batteries) {
                val prior = batteries[battery.component]?.get("level")
                batteries[battery.component] = mapOf("level" to (battery.level ?: prior),
                  "charging" to battery.charging, "stale" to (battery.level == null && prior != null))
              }
            }
            lock.notifyAll()
          }
        }
      } catch (_: Exception) {
        synchronized(lock) { if (token == generation) failLocked("Could not connect to AirPods controls. Keep your AirPods nearby, reconnect them in Bluetooth settings, and try again.") }
      } finally { try { active?.close() } catch (_: Exception) {} }
    }, "Pods-AAP-reader").start()
  }

  fun setMode(value: Int) { require(value in 1..4); command(13, value) { mode == value } }
  fun setConversation(value: Boolean) { command(40, if (value) 1 else 2) { conversation == value } }
  private fun command(id: Int, value: Int, confirmed: () -> Boolean) {
    synchronized(lock) {
      check(status == "connected") { "Reconnect your AirPods to change this setting." }
      if (confirmed()) return
      val token = generation
      try {
        socket!!.outputStream.write(AapProtocol.control(id, value))
        // Conversation state is reported on subscription, rather than echoed after a write.
        socket!!.outputStream.write(AapProtocol.subscribe)
        socket!!.outputStream.flush()
      }
      catch (_: IOException) { failLocked("AirPods disconnected. Reconnect to continue."); throw IOException("AirPods disconnected") }
      val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(4)
      // New values become visible only after a device notification confirms them.
      while (!confirmed() && token == generation && status == "connected") {
        val remaining = deadline - System.nanoTime()
        if (remaining <= 0) throw IOException("Your AirPods did not confirm the change. Try again.")
        TimeUnit.NANOSECONDS.timedWait(lock, remaining)
      }
      check(token == generation && status == "connected") { "AirPods disconnected" }
    }
  }
  fun requestReadings() = synchronized(lock) {
    check(status == "connected") { "Connect your AirPods first." }
    requestReadingsLocked()
  }
  private fun requestReadingsLocked() {
    socket?.outputStream?.let { it.write(AapProtocol.subscribe); it.flush() }
  }
  fun disconnect() = synchronized(lock) { closeLocked() }
  fun destroy() { disconnect(); scheduler.shutdownNow() }
  private fun closeLocked() {
    generation++
    try { socket?.close() } catch (_: Exception) {}
    socket = null; status = "disconnected"; error = null; deviceId = null; name = null
    mode = null; conversation = null; model = null; primaryEar = null; secondaryEar = null; batteries.clear()
    lock.notifyAll()
  }
  private fun failLocked(message: String) { closeLocked(); status = "error"; error = message }

  private fun createSocket(adapter: BluetoothAdapter, device: BluetoothDevice): BluetoothSocket {
    // AAP uses classic L2CAP PSM 0x1001, which Android's public BLE CoC API cannot open.
    HiddenApiBypass.addHiddenApiExemptions("Landroid/bluetooth/BluetoothSocket;")
    val service = ParcelUuid(UUID.fromString("00000000-deca-fade-deca-deafdecacaff"))
    val constructors = BluetoothSocket::class.java.declaredConstructors
    for (ctor in constructors) {
      val types = ctor.parameterTypes
      // Framework constructors differ across Android releases. Bind their typed fields rather than a single OS version.
      var intIndex = 0
      val ints = if (types.count { it == Int::class.javaPrimitiveType } == 3) listOf(3, -1, 4097) else listOf(3, 4097)
      if (!types.contains(BluetoothDevice::class.java) || !types.contains(ParcelUuid::class.java)) continue
      val args = types.map { type -> when (type) {
        BluetoothAdapter::class.java -> adapter
        BluetoothDevice::class.java -> device
        ParcelUuid::class.java -> service
        Int::class.javaPrimitiveType -> ints.getOrNull(intIndex++)
        Boolean::class.javaPrimitiveType -> true
        else -> null
      } }.toTypedArray()
      if (args.any { it == null }) continue
      try { ctor.isAccessible = true; return ctor.newInstance(*args) as BluetoothSocket } catch (_: ReflectiveOperationException) {}
    }
    throw IOException("Classic Bluetooth controls are unavailable on this Android version")
  }
}
