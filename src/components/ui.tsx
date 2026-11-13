import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native/button";
import { usePods } from "../lib/app-state";
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function Icon({
  name,
  size = 24,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const { palette: c } = usePods();
  return <Ionicons name={name} size={size} color={color ?? c.text} />;
}
export function Copy({
  children,
  title = false,
  muted = false,
}: {
  children: React.ReactNode;
  title?: boolean;
  muted?: boolean;
}) {
  const { palette: c } = usePods();
  return (
    <Text
      style={{
        color: muted ? c.muted : c.text,
        fontSize: title ? 22 : 16,
        fontWeight: title ? "600" : "400",
        lineHeight: title ? 29 : 24,
      }}
    >
      {children}
    </Text>
  );
}
export function Action({
  children,
  onPress,
  secondary = false,
  busy = false,
  disabled = false,
}: {
  children: string;
  onPress: () => void;
  secondary?: boolean;
  busy?: boolean;
  disabled?: boolean;
}) {
  const { palette: c } = usePods();
  const color = secondary ? c.onContainer : c.onPrimary;
  return (
    <Button
      onPress={onPress}
      isDisabled={disabled || busy}
      className="rounded-full"
      style={{
        minHeight: 56,
        backgroundColor: secondary ? c.container : c.primary,
        borderRadius: 999,
        paddingHorizontal: 22,
      }}
    >
      {busy && <ActivityIndicator color={color} />}
      <Button.Label style={{ color, fontSize: 16, fontWeight: "600" }}>
        {children}
      </Button.Label>
    </Button>
  );
}
export function IconButton({
  name,
  label,
  onPress,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
}) {
  const { palette: c } = usePods();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: c.surface,
        opacity: pressed ? 0.6 : 1,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Icon name={name} />
    </Pressable>
  );
}
export function Card({
  children,
  tonal = false,
}: {
  children: React.ReactNode;
  tonal?: boolean;
}) {
  const { palette: c } = usePods();
  return (
    <View
      style={{
        backgroundColor: tonal ? c.container : c.surface,
        borderRadius: 32,
        padding: 24,
        gap: 20,
      }}
    >
      {children}
    </View>
  );
}
export function Screen({ children }: { children: React.ReactNode }) {
  const { palette: c } = usePods();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 40,
          gap: 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  spread: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  grow: { flex: 1 },
  gap: { gap: 12 },
});
