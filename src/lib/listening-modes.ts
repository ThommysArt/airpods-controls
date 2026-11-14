export function listeningModes(adaptive: boolean) {
  return [
    { value: 3, name: "Transparency", icon: "ear-outline" as const },
    adaptive
      ? { value: 4, name: "Adaptive", icon: "sparkles-outline" as const }
      : { value: 1, name: "Off", icon: "ellipse-outline" as const },
    {
      value: 2,
      name: "Noise cancellation",
      icon: "volume-mute-outline" as const,
    },
  ];
}
