// app/about/index.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  useWindowDimensions,
} from "react-native";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import Screen from "../../src/components/ui/Screen";
import NavBar from "../../src/components/Navbar";
import { Theme } from "../../src/styles/Theme";

export default function AboutPage() {
  const open = (url: string) => Linking.openURL(url);
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  const goCreateAccount = () => {
    router.push("/login" as any);
  };

  return (
    <Screen>
      <NavBar />

      <ScrollView contentContainerStyle={styles.container}>
        {/* soft background block (more "human" than plain white) */}
        <View style={styles.bgSoft} />

        {/* HEADER + CTA */}
        <View
          style={[
            styles.topRow,
            isMobile ? styles.topRowMobile : styles.topRowDesktop,
          ]}
        >
          <View style={[styles.header, isMobile && styles.headerMobile]}>
            <Text style={styles.kicker}>About us</Text>
            <Text style={[styles.title, isMobile && styles.titleMobile]}>
              Hi, I’m Eric Pican.
            </Text>
            <Text style={styles.subtitle}>
              I built LocalVesting because I want investing to have impact again.
            </Text>
          </View>

         
        </View>

        {/* STORY CARD */}
        <View style={styles.storyCard}>
          <Text style={styles.paragraph}>
            I’m a 22-year-old student from Romania, currently studying{" "}
            <Text style={styles.strong}>
              Food Engineering at USAMV Cluj-Napoca
            </Text>{" "}
            and{" "}
            <Text style={styles.strong}>
              Business Administration at UBB Cluj-Napoca
            </Text>
            .
          </Text>

          <Text style={styles.paragraph}>
            I was born in <Text style={styles.strong}>Craiova, Romania</Text>,
            where I graduated from{" "}
            <Text style={styles.strong}>
              Colegiul Național „Frații Buzești”
            </Text>
            , studying Mathematics-Informatics in a bilingual French program.
          </Text>

          <Text style={styles.paragraph}>
            My investment journey started with sandwitches and ended with
            stacking Bitcoin in highschool. Since then, I started my quite
            interesting entrepreneurial journey.
          </Text>

          <Text style={styles.paragraph}>
            Talking to small stockmarket investors made me realize how
            disconnected most investments they make are from their everyday
            life.
          </Text>

          <Text style={styles.quote}>
            “Investments today are disconnected from daily real life.”
          </Text>

          <Text style={styles.paragraph}>
            You invest in companies you never interact with, whose value depends
            more on market sentiment and speculation than on the actual quality
            of what they do.
          </Text>
        </View>

        {/* WHY LOCALVESTING */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why I started LocalVesting</Text>

          <Text style={styles.paragraph}>
            I want to invest in businesses I actually trust. Places I walk past.
            Cafés I sit in. Restaurants I return to.
          </Text>

          <Text style={styles.paragraph}>
            I'm an ordinary person who puts a bit of money away, but knows that
            money in the bank is not growing anything.
          </Text>

          <Text style={styles.paragraph}>
            LocalVesting started from this simple question:
          </Text>

          <Text style={styles.quote}>
            “Why can’t I invest in the places I go to everyday?”
          </Text>

          <Text style={styles.paragraph}>
            If I frequent a certain bar, or a local business grows, I want to be
            able to support that growth — and benefit from it — without
            navigating big financial instruments or be scared of stock market
            volatility.
          </Text>
        </View>

        {/* MINDSET */}
        <View style={styles.mindsetSection}>
          <Text style={styles.sectionTitle}>
            Changing the “nothing ever gets done” mentality
          </Text>

          <Text style={styles.paragraph}>
            In many communities, especially in Eastern Europe, there’s a deeply
            rooted belief that progress is always someone else’s responsibility.
          </Text>

          <Text style={styles.paragraph}>
            We complain about conditions. About institutions. About the system.
          </Text>

          <Text style={styles.paragraphStrong}>
            But when you invest locally, you remove excuses.
          </Text>

          <Text style={styles.paragraph}>
            You can directly see the impact of your decision. You don’t blame
            external factors — you become part of the solution.
          </Text>

          <Text style={styles.quote}>“We're starting community growth. Are you in?”</Text>
        </View>


        {/* CLOSING */}
        <View style={styles.closing}>
          <Text style={styles.closingText}>LocalVesting is not just a platform.</Text>

          <Text style={styles.closingTextStrong}>
            It’s a mindset: investing with real impact. 
          </Text>
{/* CTA CARD (responsive) */}
         <View style={styles.ctaSection}>
  <View style={styles.ctaBox}>
    <Text style={styles.ctaTitle}>Let's start our journey</Text>


    <Pressable style={styles.ctaButton} onPress={goCreateAccount}>
      <Text style={styles.ctaButtonLabel}>Create free account</Text>
    </Pressable>

    <Text style={styles.ctaHint}>
      Takes under a minute • No deposit required
    </Text>
  </View>
</View>

          <Text style={styles.signature}>— Eric Pican, Founder of LocalVesting</Text>
        </View>

        {/* BOTTOM BUTTONS */}
        <View style={styles.bottomButtons}>
          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              open("https://www.linkedin.com/in/eric-gabriel-pican-5b1779334")
            }
          >
            <View style={styles.btnInner}>
              <FontAwesome
                name="linkedin"
                size={16}
                color={Theme.colors.primaryText}
              />
              <Text style={styles.primaryButtonLabel}>LinkedIn</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => open("https://wa.me/40725179323")}
          >
            <View style={styles.btnInner}>
              <FontAwesome5 name="whatsapp" size={16} color={Theme.colors.text} />
              <Text style={styles.secondaryButtonLabel}>WhatsApp</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => open("https://www.instagram.com/eric.pican/")}
          >
            <View style={styles.btnInner}>
              <FontAwesome name="instagram" size={16} color={Theme.colors.text} />
              <Text style={styles.secondaryButtonLabel}>Instagram</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 1000,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xl,
    gap: Theme.spacing.xl,
    position: "relative",
  },

  // subtle background decoration (safe, works on web + mobile)
  bgSoft: {
    position: "absolute",
    top: -80,
    left: -80,
    right: -80,
    height: 220,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    backgroundColor: "#F5F7FF",
  },

  topRow: {
    gap: Theme.spacing.lg,
    alignItems: "stretch",
  },
  topRowDesktop: {
    flexDirection: "row",
  },
  topRowMobile: {
    flexDirection: "column",
  },

  header: {
    flex: 1,
    gap: 6,
    minWidth: 0, // important for mobile
  },
  headerMobile: {
    paddingTop: 6,
  },

  kicker: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  titleMobile: {
    fontSize: 30,
  },
  subtitle: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 22,
    marginTop: 2,
  },

  photoCard: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  cardDesktopWidth: {
    width: 320,
  },
  cardFullWidth: {
    width: "100%",
  },
ctaSection: {
  width: "100%",
  // backgroundColor: "#F8FAFF",
  // borderRadius: 24,
  paddingVertical: Theme.spacing.xl,
  paddingHorizontal: Theme.spacing.lg,
  // borderWidth: 1,
  borderColor: Theme.colors.border,
},

ctaBox: {
  maxWidth: 600,          // keeps it readable on desktop
  width: "100%",
  alignSelf: "center",    // centers the box horizontally
  alignItems: "center",   // centers text & button
  textAlign: "center",
  gap: 10,
},

ctaTitle: {
  fontSize: 20,
  fontWeight: "700",
  color: Theme.colors.text,
  textAlign: "center",
},

ctaSubtitle: {
  fontSize: 15,
  color: "#374151",
  lineHeight: 22,
  textAlign: "center",
},

ctaButton: {
  marginTop: 6,
  backgroundColor: Theme.colors.primary,
  paddingHorizontal: 22,
  paddingVertical: 12,
  borderRadius: 999,
},

ctaButtonLabel: {
  color: Theme.colors.primaryText,
  fontWeight: "700",
  fontSize: 14,
},

ctaHint: {
  fontSize: 12,
  color: Theme.colors.textMuted,
  marginTop: 4,
  textAlign: "center",
},


  storyCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 12,
  },

  section: {
    gap: 12,
  },

  mindsetSection: {
    backgroundColor: "#F8FAFF",
    borderRadius: 24,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 12,
  },

  sectionTitle: {
    ...Theme.typography.title,
  },

  paragraph: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  paragraphStrong: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 22,
  },

  strong: {
    fontWeight: "600",
    color: "#111827",
  },

  quote: {
    fontSize: 16,
    fontStyle: "italic",
    color: Theme.colors.primary,
    lineHeight: 24,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
    marginVertical: 4,
  },

  closing: {
    gap: 6,
    paddingTop: Theme.spacing.md,
  },
  closingText: {
    fontSize: 16,
    color: "#374151",
  },
  closingTextStrong: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  signature: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.textMuted,
  },

  bottomButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },

  primaryButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryButtonLabel: {
    color: Theme.colors.primaryText,
    fontWeight: "600",
    fontSize: 14,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: Theme.colors.surface,
  },
  secondaryButtonLabel: {
    color: Theme.colors.text,
    fontWeight: "500",
    fontSize: 14,
  },

  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8 as any,
  },
});
