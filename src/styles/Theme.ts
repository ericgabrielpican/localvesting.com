export const Theme = {
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
    title: { fontSize: 20, fontWeight: "700" as const, color: "#111827" },
    subtitle: { fontSize: 14, color: "#6b7280" },
    body: { fontSize: 14, color: "#111827" },
    label: { fontSize: 13, color: "#374151" },
  },
};
