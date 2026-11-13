package expo.modules.airpodsandroid

/** Wire-format implementation based on publicly documented AAP messages.
 * https://github.com/tyalie/AAP-Protocol-Defintion
 * https://github.com/librepods-org/librepods/blob/main/docs/AAP%20Definitions.md
 * No device state is inferred from a command being sent.
 */
internal object AapProtocol {
  val handshake = byteArrayOf(0, 0, 4, 0, 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0)
  val subscribe = byteArrayOf(4, 0, 4, 0, 15, 0, -1, -1, -1, -1)
  val features = byteArrayOf(4, 0, 4, 0, 77, 0, -1, 0, 0, 0, 0, 0, 0, 0)
  fun control(id: Int, value: Int): ByteArray {
    require(id == 0x0d && value in 1..4 || id == 0x28 && value in 1..2)
    return byteArrayOf(4, 0, 4, 0, 9, 0, id.toByte(), value.toByte(), 0, 0, 0)
  }
  data class Battery(val component: String, val level: Int?, val charging: Boolean?)
  data class Update(
    val batteries: List<Battery> = emptyList(), val mode: Int? = null,
    val conversation: Boolean? = null, val modelNumber: String? = null,
    val primaryEar: Int? = null, val secondaryEar: Int? = null,
  )
  fun decode(packet: ByteArray): Update? {
    fun u(i: Int) = packet[i].toInt() and 255
    if (packet.size < 6 || u(0) != 4 || u(1) != 0 || u(2) != 4 || u(3) != 0 || u(5) != 0) return null
    return when (u(4)) {
      4 -> {
        if (packet.size < 7 || u(6) !in 1..3 || packet.size != 7 + u(6) * 5) return null
        val readings = mutableListOf<Battery>()
        for (i in 0 until u(6)) {
          val offset = 7 + i * 5
          val component = when (u(offset)) { 2 -> "right"; 4 -> "left"; 8 -> "case"; else -> return null }
          if (u(offset + 1) != 1 || u(offset + 4) != 1) return null
          val status = u(offset + 3)
          val known = status == 1 || status == 2
          if (known && u(offset + 2) > 100) return null
          readings.add(Battery(component, if (known) u(offset + 2) else null, if (known) status == 1 else null))
        }
        Update(batteries = readings)
      }
      9 -> {
        if (packet.size != 11 || u(8) != 0 || u(9) != 0 || u(10) != 0) return null
        when (u(6)) {
          13 -> if (u(7) in 1..4) Update(mode = u(7)) else null
          40 -> when (u(7)) { 1 -> Update(conversation = true); 2 -> Update(conversation = false); else -> null }
          else -> null
        }
      }
      6 -> if (packet.size == 8 && u(6) in 0..2 && u(7) in 0..2) Update(primaryEar = u(6), secondaryEar = u(7)) else null
      29 -> {
        val parts = packet.copyOfRange(6, packet.size).toString(Charsets.UTF_8).split('\u0000')
        val model = parts.firstOrNull { it.matches(Regex("A[0-9]{4}")) }
        if (model != null) Update(modelNumber = model) else null
      }
      else -> null
    }
  }

  /** Retains fragmented fixed-size notifications and handles several frames in one read. */
  class Decoder {
    private var pending = byteArrayOf()
    fun accept(bytes: ByteArray): List<Update> {
      pending += bytes
      if (pending.size > 8192) { pending = byteArrayOf(); return emptyList() }
      val result = mutableListOf<Update>()
      while (pending.size >= 6) {
        if (!(pending[0] == 4.toByte() && pending[1] == 0.toByte() && pending[2] == 4.toByte() && pending[3] == 0.toByte())) {
          pending = pending.drop(1).toByteArray(); continue
        }
        val size = when (pending[4].toInt() and 255) {
          4 -> { if (pending.size < 7) break; val count = pending[6].toInt() and 255; if (count !in 1..3) 6 else 7 + 5 * count }
          9 -> 11
          6 -> 8
          29 -> {
            val next = (6..pending.size - 4).firstOrNull { i -> pending[i] == 4.toByte() && pending[i + 1] == 0.toByte() && pending[i + 2] == 4.toByte() && pending[i + 3] == 0.toByte() }
            if (next != null) next else {
              // Metadata has a variable payload. Retain an incomplete model field across reads.
              if (decode(pending) == null) break
              pending.size
            }
          }
          else -> 6
        }
        if (pending.size < size) break
        decode(pending.copyOfRange(0, size))?.let(result::add)
        pending = pending.copyOfRange(size, pending.size)
      }
      return result
    }
  }
}
