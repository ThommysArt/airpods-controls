// Model identifiers published by Apple: https://support.apple.com/en-us/109525
const groups: [string, string[]][] = [
  ["AirPods", ["A1523", "A1722"]],
  ["AirPods 2", ["A2032", "A2031"]],
  ["AirPods 3", ["A2565", "A2564"]],
  ["AirPods 4", ["A3053", "A3050", "A3054"]],
  ["AirPods 4 with ANC", ["A3056", "A3055", "A3057"]],
  ["AirPods 5", ["A3531", "A3532", "A3533"]],
  ["AirPods 5 with wireless charging", ["A3439", "A3440", "A3441"]],
  ["AirPods Pro", ["A2084", "A2083"]],
  ["AirPods Pro 2", ["A3047", "A3048", "A3049", "A2931", "A2699", "A2698"]],
  ["AirPods Pro 3", ["A3063", "A3064", "A3065"]],
  ["AirPods Max", ["A2096", "A3184"]],
  ["AirPods Max 2", ["A3454"]],
];
export function modelName(number: string | null | undefined) {
  return (
    groups.find(([, ids]) => number && ids.includes(number))?.[0] ?? "AirPods"
  );
}
export function supportsAdaptive(number: string | null) {
  const name = modelName(number);
  return [
    "AirPods Pro 2",
    "AirPods Pro 3",
    "AirPods 4 with ANC",
    "AirPods Max 2",
  ].includes(name);
}

export function supportsNoiseControl(
  number: string | null,
  name: string | null,
) {
  const known = groups.find(([, ids]) => number && ids.includes(number));
  if (known) return /Pro|Max|ANC/.test(known[0]);
  // Keep commands reachable while a Pro/Max device's metadata is loading.
  return /AirPods.*(?:Pro|Max|ANC)/i.test(name ?? "");
}
