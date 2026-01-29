"use client";

import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import {
  hasMadeChoice,
  setConsent,
  type CookieConsentChoice,
} from "../lib/consent"; // ✅ relative import

const green = "#1F8A4C";
const red = "#C62828";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!hasMadeChoice());
  }, []);

  function choose(choice: CookieConsentChoice) {
    setConsent(choice);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Cookies & Privacy</Text>

        <Text style={styles.text}>
          We use essential cookies for login and security. With your permission,
          we also use cookies for analytics to improve the platform.
        </Text>

        <View style={styles.buttons}>
          <Pressable
            onPress={() => choose("none")}
            style={[styles.button, { backgroundColor: red }]}
          >
            <Text style={styles.buttonText}>Decline</Text>
          </Pressable>

          <Pressable
            onPress={() => choose("essential")}
            style={[styles.button, { backgroundColor: green }]}
          >
            <Text style={styles.buttonText}>Accept essential</Text>
          </Pressable>

          <Pressable
            onPress={() => choose("all")}
            style={[styles.button, { backgroundColor: green }]}
          >
            <Text style={styles.buttonText}>Accept all</Text>
          </Pressable>
        </View>

        <View style={styles.links}>
          <Link href="/privacy-policy" style={styles.link}>
            Privacy Policy
          </Link>
          <Text style={styles.dot}>•</Text>
          <Link href="/cookie-policy" style={styles.link}>
            Cookies
          </Link>
          <Text style={styles.dot}>•</Text>
          <Link href="/terms" style={styles.link}>
            Terms
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = {
  overlay: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  card: {
    backgroundColor: "#0f0f12",
    borderRadius: 14,
    padding: 16,
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 6,
  },
  text: {
    color: "white",
    fontSize: 13,
    opacity: 0.9,
  },
  buttons: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    marginTop: 12,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "600" as const,
    fontSize: 13,
  },
  links: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    marginTop: 10,
    gap: 6,
  },
  link: {
    color: "#9ad1ff",
    fontSize: 12,
  },
  dot: {
    color: "#6b7280",
    fontSize: 12,
  },
};
