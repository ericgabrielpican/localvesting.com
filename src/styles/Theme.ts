import { ViewStyle, TextStyle, FlexStyle } from "react-native";

// Define the shape of our Theme for better intellisense
interface ThemeInterface {
  colors: Record<string, string>;
  radii: Record<string, number>;
  spacing: Record<string, number>;
  typography: {
    title: TextStyle;
    subtitle: TextStyle;
    body: TextStyle;
    label: TextStyle;
  };
  screen: ViewStyle;
  content: ViewStyle;
}

export const Theme: ThemeInterface = {
  colors: {
    background: "#f3f4f6",
    surface: "#ffffff",
    border: "#e5e7eb",
    primary: "#2563eb",
    primaryText: "#ffffff",
    text: "#111827",
    textMuted: "#6b7280",
    textSubtle: "#9ca3af",
    success: "#10b981",
    danger: "#ef4444",
  },

  radii: { sm: 8, md: 12, lg: 16 },

  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },

  typography: {
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: "#111827"
    },
    subtitle: {
      fontSize: 14,
      color: "#6b7280"
    },
    body: {
      fontSize: 14,
      color: "#111827"
    },
    label: {
      fontSize: 13,
      color: "#000",
      fontWeight: "700"
    },
  },

  screen: {
    flex: 1, // Added flex: 1 so the screen actually fills the device
    display: "flex",
    alignItems: "center", // Changed from alignContent to alignItems to center children
    width: "100%",
    backgroundColor: "#f3f4f6", // Use your background color variable
  },

  content: {
    alignSelf: "center",
    width: "75%",
    // Recommended: add padding or margin here if this is your main scroll container
  }
};
