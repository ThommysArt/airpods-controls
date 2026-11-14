package expo.modules.airpodsandroid

/** Percentage and charging status have independent validity and freshness. */
internal class BatteryReadings {
  private data class Reading(var level: Int? = null, var charging: Boolean? = null,
    var levelAt: Long = 0, var chargingAt: Long = 0, var levelMissing: Boolean = true,
    var chargingMissing: Boolean = true)
  private val reports = ArrayDeque<Map<String, Any?>>()
  private val readings = mutableMapOf<String, Reading>()
  fun accept(battery: AapProtocol.Battery, now: Long) {
    reports.addLast(mapOf("receivedAt" to now, "component" to battery.component,
      "reportedLevel" to battery.rawLevel, "reportedStatus" to battery.rawStatus))
    while (reports.size > 60) reports.removeFirst()
    val reading = readings.getOrPut(battery.component) { Reading() }
    reading.levelMissing = battery.level == null
    reading.chargingMissing = battery.charging == null
    battery.level?.let { reading.level = it; reading.levelAt = now }
    battery.charging?.let { reading.charging = it; reading.chargingAt = now }
  }
  fun snapshot(now: Long): Map<String, Map<String, Any?>> = readings.mapValues { (_, reading) ->
    mapOf("level" to reading.level, "charging" to reading.charging,
      "stale" to (reading.levelMissing || now - reading.levelAt >= 45000),
      "chargingStale" to (reading.chargingMissing || now - reading.chargingAt >= 45000),
      "updatedAt" to reading.levelAt, "chargingUpdatedAt" to reading.chargingAt)
  }
  fun reports(): List<Map<String, Any?>> = reports.toList()
  fun clear() { readings.clear(); reports.clear() }
}
