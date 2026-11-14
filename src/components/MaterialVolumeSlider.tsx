import Slider from "@react-native-community/slider";
import { usePods } from "../lib/app-state";
import { VolumeSliderProps } from "./volume-slider-props";

export function MaterialVolumeSlider({
  value,
  disabled,
  onCommit,
}: VolumeSliderProps) {
  const { palette: c } = usePods();
  return (
    <Slider
      accessibilityLabel="Media volume"
      value={value}
      disabled={disabled}
      minimumValue={0}
      maximumValue={1}
      minimumTrackTintColor={c.primary}
      maximumTrackTintColor={c.container}
      thumbTintColor={c.primary}
      onSlidingComplete={(next) => void onCommit(next)}
    />
  );
}
