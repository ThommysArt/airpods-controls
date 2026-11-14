import { Host, Slider } from "@expo/ui/jetpack-compose";
import { fillMaxWidth, semantics } from "@expo/ui/jetpack-compose/modifiers";
import { useRef, useState } from "react";
import { usePods } from "../lib/app-state";
import { VolumeSliderProps } from "./volume-slider-props";

export function MaterialVolumeSlider({
  value,
  disabled,
  onCommit,
}: VolumeSliderProps) {
  const { palette: c, dark } = usePods();
  const [draft, setDraft] = useState<number | null>(null);
  const latest = useRef<number | null>(null);
  return (
    <Host
      matchContents={{ vertical: true }}
      style={{ width: "100%" }}
      colorScheme={dark ? "dark" : "light"}
      colorOverrides={{
        primary: c.primary,
        onPrimary: c.onPrimary,
        primaryContainer: c.container,
        onPrimaryContainer: c.onContainer,
        surface: c.surface,
        onSurface: c.text,
      }}
    >
      <Slider
        value={draft ?? value}
        min={0}
        max={1}
        enabled={!disabled}
        modifiers={[
          fillMaxWidth(),
          semantics({ contentDescription: "Media volume" }),
        ]}
        colors={{
          thumbColor: c.primary,
          activeTrackColor: c.primary,
          inactiveTrackColor: c.container,
        }}
        onValueChange={(next) => {
          latest.current = next;
          setDraft(next);
        }}
        onValueChangeFinished={() => {
          const next = latest.current ?? value;
          void onCommit(next).finally(() => {
            latest.current = null;
            setDraft(null);
          });
        }}
      />
    </Host>
  );
}
