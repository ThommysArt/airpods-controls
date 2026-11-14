package expo.modules.airpodsandroid

import org.junit.Assert.*
import org.junit.Test

class AirPodsSelectionTest {
  private fun candidate(id: String, name: String?, service: Boolean = false) = AirPodsSelection.Candidate(id, name, service)
  @Test fun detectsConnectedAirPodsAndDoesNotPickOtherHeadsets() {
    assertEquals("pods", AirPodsSelection.pick(listOf(candidate("other", "Headphones"), candidate("pods", "Daniel’s AirPods Pro #2")), emptySet(), null, null))
    assertNull(AirPodsSelection.pick(listOf(candidate("other", "Headphones")), emptySet(), null, null))
    assertNull(AirPodsSelection.pick(emptyList(), setOf("paired-but-not-connected"), null, null))
  }
  @Test fun restoresRenamedPreviouslySelectedAirPods() {
    assertEquals("saved", AirPodsSelection.pick(listOf(candidate("saved", "My earbuds")), setOf("saved"), "saved", null))
    assertEquals("new", AirPodsSelection.pick(listOf(candidate("new", "My earbuds", true)), emptySet(), null, null))
  }
  @Test fun doesNotUndoManualDisconnectOrGuessBetweenTwoPairs() {
    val devices = listOf(candidate("one", "AirPods"), candidate("two", "AirPods Pro"))
    assertNull(AirPodsSelection.pick(devices, emptySet(), null, null))
    assertEquals("two", AirPodsSelection.pick(devices, emptySet(), "two", null))
    assertNull(AirPodsSelection.pick(listOf(devices[0]), emptySet(), "one", "one"))
  }
}
