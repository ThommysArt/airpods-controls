package expo.modules.airpodsandroid
import org.junit.Assert.*
import org.junit.Test
class BatteryReadingsTest {
  @Test fun caseChargingSurvivesUnknownStatusWithoutPretendingItIsFresh() {
    val readings = BatteryReadings()
    readings.accept(AapProtocol.Battery("case", 19, true), 1000)
    readings.accept(AapProtocol.Battery("case", 20, null), 2000)
    val result = readings.snapshot(2000).getValue("case")
    assertEquals(20, result["level"])
    assertEquals(true, result["charging"])
    assertEquals(false, result["stale"])
    assertEquals(true, result["chargingStale"])
    readings.accept(AapProtocol.Battery("case", null, false), 3000)
    val unplugged = readings.snapshot(3000).getValue("case")
    assertEquals(false, unplugged["charging"])
    assertEquals(false, unplugged["chargingStale"])
    assertEquals(20, unplugged["level"])
    assertEquals(true, unplugged["stale"])
  }
  @Test fun chargingAndPercentageCanArriveIndependentlyAndExpire() {
    val readings = BatteryReadings()
    readings.accept(AapProtocol.Battery("case", null, true), 1000)
    assertEquals(true, readings.snapshot(1000).getValue("case")["charging"])
    assertNull(readings.snapshot(1000).getValue("case")["level"])
    readings.accept(AapProtocol.Battery("left", 80, false), 1000)
    assertEquals(true, readings.snapshot(46000).getValue("left")["stale"])
    assertEquals(true, readings.snapshot(46000).getValue("left")["chargingStale"])
    readings.clear()
    assertTrue(readings.snapshot(46000).isEmpty())
    assertTrue(readings.reports().isEmpty())
  }
  @Test fun boundedReportsKeepOriginalStatusCodesWithoutDeviceIdentity() {
    val readings = BatteryReadings()
    repeat(70) { readings.accept(AapProtocol.Battery("case", 20, null, 20, 3), it.toLong()) }
    assertEquals(60, readings.reports().size)
    assertEquals(3, readings.reports().last()["reportedStatus"])
    assertEquals(setOf("receivedAt", "component", "reportedLevel", "reportedStatus"), readings.reports().last().keys)
  }
}
