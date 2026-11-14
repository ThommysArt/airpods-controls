package expo.modules.airpodsandroid

internal object AirPodsSelection {
  data class Candidate(val id: String, val name: String?, val accessoryService: Boolean)
  fun pick(connected: List<Candidate>, known: Set<String>, last: String?, suppressed: String?): String? {
    val eligible = connected.filter { it.id != suppressed &&
      (it.id in known || it.accessoryService || it.name?.contains("AirPods", true) == true) }
    return eligible.firstOrNull { it.id == last }?.id ?: eligible.singleOrNull()?.id
  }
}
