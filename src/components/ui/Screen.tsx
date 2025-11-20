import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { Theme } from "../../styles/Theme";

export default function Screen({ children, style, ...rest }: ViewProps & { children: React.ReactNode }) {
  return <View style={[styles.root, style]} {...rest}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
});
