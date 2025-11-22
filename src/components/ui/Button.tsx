// src/components/ui/Button.tsx
import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Theme } from "../../styles/Theme";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  style?: ViewStyle;      // extra style for button
  labelStyle?: TextStyle; // extra style for text
};

export default function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  style,
  labelStyle,
}: Props) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          !isPrimary && styles.labelSecondary,
          labelStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: 140,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primary: {
    backgroundColor: Theme.colors.primary,
  },
  secondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ translateY: 1 }],
  },
  label: {
    ...Theme.typography.label,
    color: Theme.colors.primaryText,
  },
  labelSecondary: {
    color: Theme.colors.text,
  },
});
