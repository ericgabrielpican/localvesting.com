import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { Theme } from "../../styles/Theme";

export default function Card({ children, style, ...rest }: ViewProps & { children: React.ReactNode }) {
  return <View style={[styles.card, style]} {...rest}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    marginBottom: Theme.spacing.md,
  },
});
