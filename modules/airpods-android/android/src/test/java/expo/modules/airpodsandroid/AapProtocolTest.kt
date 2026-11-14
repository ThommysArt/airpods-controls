package expo.modules.airpodsandroid

import org.junit.Assert.*
import org.junit.Test

class AapProtocolTest {
  private fun hex(value: String) = value.trim().split(Regex("\\s+")).map { it.toInt(16).toByte() }.toByteArray()
  @Test fun readsDocumentedBatteryNotification() {
    val update = AapProtocol.decode(hex("04 00 04 00 04 00 03 02 01 64 02 01 04 01 63 01 01 08 01 11 02 01"))!!
    assertEquals(listOf("right", "left", "case"), update.batteries.map { it.component })
    assertEquals(listOf(100, 99, 17), update.batteries.map { it.level })
    assertEquals(listOf(false, true, false), update.batteries.map { it.charging })
  }
  @Test fun unknownAndDisconnectedBatteriesAreNotZeroPercent() {
    val update = AapProtocol.decode(hex("04 00 04 00 04 00 02 02 01 ff 00 01 08 01 00 04 01"))!!
    assertTrue(update.batteries.all { it.level == null && it.charging == null })
  }
  @Test fun rejectsTruncatedInvalidAndUnsupportedPackets() {
    assertNull(AapProtocol.decode(hex("04 00 04 00 04 00 03 02 01 64 02 01")))
    assertNull(AapProtocol.decode(hex("04 00 04 00 04 00 01 02 01 65 02 01")))
    assertNull(AapProtocol.decode(hex("04 00 04 00 09 00 0d 05 00 00 00")))
    assertNull(AapProtocol.decode(hex("04 00 04 00 09 00 28 00 00 00 00")))
    assertNull(AapProtocol.decode(hex("04 00 04 00 09 00 0d 02 ff 00 00")))
    assertNull(AapProtocol.decode(hex("00 00 04 00 09 00 0d 02 00 00 00")))
    assertNull(AapProtocol.decode(AapProtocol.handshake))
  }
  @Test fun preservesSplitPacketsAndSeparatesCoalescedUpdates() {
    val decoder = AapProtocol.Decoder()
    val packet = hex("04 00 04 00 09 00 0d 02 00 00 00")
    assertTrue(decoder.accept(packet.copyOfRange(0, 5)).isEmpty())
    val updates = decoder.accept(packet.copyOfRange(5, packet.size) + hex("04 00 04 00 06 00 00 01"))
    assertEquals(2, updates.size)
    assertEquals(2, updates[0].mode)
    assertEquals(0, updates[1].primaryEar)
    assertEquals(1, updates[1].secondaryEar)
  }
  @Test fun parsesMetadataWithoutUsingTheDeviceNickname() {
    val decoder = AapProtocol.Decoder()
    val metadata = hex("04 00 04 00 1d 00 02 d5 00 04 00") + "My Pro 3\u0000A3048\u0000Apple Inc.\u0000".toByteArray()
    val updates = decoder.accept(metadata + hex("04 00 04 00 09 00 28 02 00 00 00"))
    assertEquals(2, updates.size)
    assertEquals("A3048", updates[0].modelNumber)
    assertEquals(false, updates[1].conversation)
  }
  @Test fun retainsFragmentedModelFieldAndRecoversFromGarbage() {
    val decoder = AapProtocol.Decoder()
    assertTrue(decoder.accept(hex("ff aa 04 00 04 00 1d 00") + "Name\u0000A30".toByteArray()).isEmpty())
    assertEquals("A3063", decoder.accept("63\u0000Apple\u0000".toByteArray()).single().modelNumber)
    assertTrue(decoder.accept(ByteArray(9000)).isEmpty())
    assertEquals(3, decoder.accept(hex("04 00 04 00 09 00 0d 03 00 00 00")).single().mode)
  }
  @Test fun writesOnlySupportedCommandsWithExactWireFormat() {
    assertArrayEquals(hex("04 00 04 00 09 00 0d 04 00 00 00"), AapProtocol.control(13, 4))
    assertArrayEquals(hex("04 00 04 00 09 00 28 01 00 00 00"), AapProtocol.control(40, 1))
    assertThrows(IllegalArgumentException::class.java) { AapProtocol.control(13, 0) }
    assertThrows(IllegalArgumentException::class.java) { AapProtocol.control(999, 1) }
  }
  @Test fun chargingUnknownDoesNotDiscardAValidPercentage() {
    val update = AapProtocol.decode(hex("04 00 04 00 04 00 03 02 01 55 00 01 04 01 53 00 01 08 01 13 02 01"))!!
    assertEquals(listOf(85, 83, 19), update.batteries.map { it.level })
    assertNull(update.batteries[0].charging)
    assertNull(update.batteries[1].charging)
  }
  @Test fun repeatedHeadersSurviveEveryFragmentBoundary() {
    val bytes = hex("04 00 04 00 04 00 04 00 09 00 0d 02 00 00 00 04 00 04 00 04 00 04 00 04 00 01 02 01 55 02 01")
    for (split in 1 until bytes.size) {
      val decoder = AapProtocol.Decoder()
      val updates = decoder.accept(bytes.copyOfRange(0, split)) + decoder.accept(bytes.copyOfRange(split, bytes.size))
      assertEquals("split $split", 2, updates.size)
      assertEquals(2, updates[0].mode)
      assertEquals(85, updates[1].batteries.single().level)
    }
  }
  @Test fun readsMaxHeadsetBatteryComponent() {
    val battery = AapProtocol.decode(hex("04 00 04 00 04 00 01 01 01 55 02 01"))!!.batteries.single()
    assertEquals("headset", battery.component)
    assertEquals(85, battery.level)
  }
}
