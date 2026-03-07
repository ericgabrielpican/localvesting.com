import React, { forwardRef } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Theme } from "../../styles/Theme";

type Props = { label?: string } & React.ComponentProps<typeof TextInput>;

const TextField = forwardRef<TextInput, Props>(({ label, ...props }, ref) => {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        ref={ref}
        {...props}
        placeholderTextColor={
          props.placeholderTextColor ?? Theme.colors.textSubtle
        }
        style={[styles.input, props.style]}
      />
    </View>
  );
});

export default TextField;

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