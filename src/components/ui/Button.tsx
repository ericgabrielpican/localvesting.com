import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Theme } from "../../styles/Theme";

export default function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        disabled && { opacity: 0.7 },
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === "primary" ? styles.primaryText : styles.secondaryText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.sm,
  },
  primary: { backgroundColor: Theme.colors.primary },
  secondary: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  text: { fontSize: 14, fontWeight: "600" },
  primaryText: { color: Theme.colors.primaryText },
  secondaryText: { color: Theme.colors.text },
});
