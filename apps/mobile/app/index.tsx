/**
 * Landing Screen - Clean Minimal Design
 * 
 * Features:
 * - Simple animated logo
 * - Clean typography
 * - Auth check: auto-redirect if logged in
 * - Sign in/up buttons if not logged in
 */

import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Dimensions, Easing, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// Loading dots component
function LoadingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.loadingDots}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
}

export default function LandingScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const [showButtons, setShowButtons] = useState(false);
  
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslate = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Main animation sequence
    Animated.sequence([
      // Logo appears
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Title fades in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Subtitle
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After animation, show buttons if not signed in
      if (!isSignedIn) {
        setShowButtons(true);
        Animated.parallel([
          Animated.timing(buttonsOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(buttonsTranslate, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  }, [isSignedIn]);

  // Redirect to tabs if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const timer = setTimeout(() => {
        router.replace("/(tabs)");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn]);

  return (
    <View style={styles.container}>
      {/* Subtle background gradient */}
      <LinearGradient
        colors={["#0a0a0a", "#050505", "#000"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoIcon}>
            <Ionicons name="cafe" size={52} color="#f97316" />
          </View>
        </Animated.View>

        {/* App Name */}
        <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
          Chai & Blog
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          STORIES WORTH SHARING
        </Animated.Text>
      </View>

      {/* Auth buttons - show only if not signed in */}
      {showButtons && (
        <Animated.View 
          style={[
            styles.buttonContainer, 
            { 
              opacity: buttonsOpacity,
              transform: [{ translateY: buttonsTranslate }],
            }
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/sign-up")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#f97316", "#ea580c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/sign-in")}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              Already have an account? <Text style={styles.signInText}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Loading indicator - show while checking auth */}
      {!showButtons && !isSignedIn && (
        <Animated.View style={[styles.footer, { opacity: subtitleOpacity }]}>
          <LoadingDots />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: 28,
  },
  logoIcon: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 38,
    fontWeight: "300",
    color: "#fff",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: "#555",
    marginTop: 12,
    letterSpacing: 4,
  },
  footer: {
    position: "absolute",
    bottom: 80,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#f97316",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 60,
    left: 24,
    right: 24,
    gap: 16,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 15,
  },
  signInText: {
    color: "#f97316",
    fontWeight: "600",
  },
});
