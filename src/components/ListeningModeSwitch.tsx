import { Pressable, Switch, Text, View } from "react-native";
import { usePods } from "../lib/app-state";
import { supportsAdaptive } from "../lib/models";
import { listeningModes } from "../lib/listening-modes";
import { Copy, Icon, styles as s } from "./ui";

export function ListeningModeSwitch({
  model,
  value,
  disabled,
  onChange,
}: {
  model: string | null;
  value: number | null;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const { palette: c } = usePods();
  const modes = listeningModes(supportsAdaptive(model) || value === 4);
  return (
    <View style={{ gap: 16 }}>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Listening mode"
        style={{
          flexDirection: "row",
          backgroundColor: c.background,
          borderRadius: 32,
          padding: 4,
          gap: 4,
          borderColor: c.outline,
          borderWidth: 1,
        }}
      >
        {modes.map((mode) => (
          <Pressable
            key={mode.value}
            accessibilityRole="radio"
            accessibilityLabel={mode.name}
            accessibilityState={{ checked: value === mode.value, disabled }}
            disabled={disabled}
            onPress={() => onChange(mode.value)}
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 0,
              minHeight: 88,
              borderRadius: 28,
              paddingHorizontal: 4,
              paddingVertical: 12,
              gap: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                value === mode.value ? c.container : "transparent",
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Icon
              name={mode.icon}
              color={value === mode.value ? c.onContainer : c.muted}
            />
            <Text
              style={{
                color: value === mode.value ? c.onContainer : c.text,
                fontWeight: value === mode.value ? "600" : "400",
                fontSize: 13,
                lineHeight: 17,
                textAlign: "center",
              }}
            >
              {mode.name}
            </Text>
          </Pressable>
        ))}
      </View>
      {modes.some((mode) => mode.value === 4) && value !== null && (
        <View style={s.spread}>
          <Copy muted>Noise control</Copy>
          <Switch
            accessibilityLabel="Noise control"
            value={value !== 1}
            disabled={disabled}
            onValueChange={(enabled) => onChange(enabled ? 2 : 1)}
            trackColor={{ false: c.outline, true: c.primary }}
            thumbColor={c.surface}
          />
        </View>
      )}
    </View>
  );
}
