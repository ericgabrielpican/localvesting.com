import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Theme } from "../../styles/Theme";

export default function TextField({
  label,
  ...props
}: { label?: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...props}
        placeholderTextColor={props.placeholderTextColor ?? Theme.colors.textSubtle}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Theme.spacing.md },
  label: { ...Theme.typography.label, marginBottom: Theme.spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radii.md,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm + 2,
    backgroundColor: Theme.colors.surface,
    color: Theme.colors.text,
  },
});
