export type VolumeSliderProps = {
  value: number;
  disabled: boolean;
  onCommit: (value: number) => Promise<void>;
};
