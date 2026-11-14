package expo.modules.airpodsandroid

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothProfile
import android.content.Context
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/** Watches actual A2DP connections, including devices that were connected before app launch. */
internal class AirPodsDiscovery(private val context: Context, private val connection: AirPodsConnection) {
  private val preferences = context.getSharedPreferences("pods-devices", Context.MODE_PRIVATE)
  private val executor = Executors.newSingleThreadScheduledExecutor()
  private var adapter: BluetoothAdapter? = null
  private var profile: BluetoothProfile? = null
  private var started = false
  private var closed = false
  private var suppressed: String? = null
  private var lastAttempt = 0L
  private var previouslyConnected = emptySet<String>()
  private val listener = object : BluetoothProfile.ServiceListener {
    override fun onServiceConnected(type: Int, proxy: BluetoothProfile) {
      synchronized(this@AirPodsDiscovery) {
        if (closed) { adapter?.closeProfileProxy(type, proxy); return }
        profile = proxy
        scan()
      }
    }
    override fun onServiceDisconnected(type: Int) { synchronized(this@AirPodsDiscovery) { profile = null } }
  }
  @Synchronized fun start(value: BluetoothAdapter) {
    if (closed || started) return
    adapter = value
    if (!value.getProfileProxy(context, listener, BluetoothProfile.A2DP)) return
    started = true
    executor.scheduleWithFixedDelay({ scan() }, 0, 2, TimeUnit.SECONDS)
  }
  @Synchronized fun selected(device: BluetoothDevice) {
    val saved = preferences.getStringSet("approved", emptySet())!!.toMutableSet()
    saved.add(device.address)
    preferences.edit().putStringSet("approved", saved).putString("last", device.address).apply()
    suppressed = null
    lastAttempt = System.currentTimeMillis()
  }
  @Synchronized fun disconnect() {
    suppressed = connection.snapshot()["id"] as? String
    connection.disconnect()
  }
  @Synchronized private fun scan() {
    if (closed) return
    try {
      val devices = profile?.connectedDevices ?: return
      val ids = devices.map { it.address }.toSet()
      if (suppressed !in ids) suppressed = null
      val state = connection.snapshot()
      val current = state["id"] as? String
      if (current != null && current in previouslyConnected && current !in ids) connection.disconnect()
      previouslyConnected = ids
      if (state["status"] == "connected" && current in ids || state["status"] == "connecting") return
      val approved = preferences.getStringSet("approved", emptySet())!!
      val selected = AirPodsSelection.pick(devices.map { device ->
        AirPodsSelection.Candidate(device.address, device.name,
          device.uuids?.any { it.uuid.toString() == "00000000-deca-fade-deca-deafdecacaff" } == true)
      }, approved, preferences.getString("last", null), suppressed)
      val device = devices.firstOrNull { it.address == selected } ?: return
      val now = System.currentTimeMillis()
      if (now - lastAttempt < 30000 && state["status"] == "error") return
      lastAttempt = now
      connection.connect(adapter ?: return, device)
    } catch (_: SecurityException) { connection.disconnect() }
  }
  @Synchronized fun close() {
    closed = true
    executor.shutdownNow()
    profile?.let { adapter?.closeProfileProxy(BluetoothProfile.A2DP, it) }
    profile = null
  }
}
