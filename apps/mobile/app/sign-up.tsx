/**
 * Sign Up Screen - Stitch-Inspired Elegant Design
 * 
 * Features:
 * - App branding at top
 * - Clean welcome message
 * - Prominent Google sign-up
 * - Subtle aurora glow effect
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";

const { width, height } = Dimensions.get("window");

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  
  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleGoogleSignUp = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const { createdSessionId, setActive: setActiveSession } = await startGoogleOAuth();

      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [startGoogleOAuth]);

  const handleVerify = async () => {
    if (!isLoaded) return;
    
    setIsLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Verification code screen
  if (pendingVerification) {
    return (
      <View style={styles.container}>
        {/* Aurora background glow */}
        <Animated.View
          style={[
            styles.auroraContainer,
            { transform: [{ scale: glowPulse }] },
          ]}
        >
          <LinearGradient
            colors={["transparent", "rgba(249, 115, 22, 0.12)", "rgba(249, 115, 22, 0.2)", "rgba(234, 88, 12, 0.08)", "transparent"]}
            style={styles.aurora}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.verifyContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setPendingVerification(false)}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.verifyHeader}>
              <View style={styles.verifyIconContainer}>
                <Ionicons name="mail-outline" size={32} color="#f97316" />
              </View>
              <Text style={styles.verifyTitle}>Verify your email</Text>
              <Text style={styles.verifySubtitle}>
                We sent a 6-digit code to{"\n"}{email}
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor="#444"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#f97316", "#ea580c"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.verifyButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify Email</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Aurora background glow */}
      <Animated.View
        style={[
          styles.auroraContainer,
          { transform: [{ scale: glowPulse }] },
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(249, 115, 22, 0.12)", "rgba(249, 115, 22, 0.2)", "rgba(234, 88, 12, 0.08)", "transparent"]}
          style={styles.aurora}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButtonTop}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeIn,
              transform: [{ translateY: slideUp }],
            },
          ]}
        >
          {/* App Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="cafe" size={48} color="#f97316" />
            </View>
            <Text style={styles.appName}>Chai & Blog</Text>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Join the community</Text>
            <Text style={styles.welcomeSubtitle}>
              Start sharing your stories today
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Google Sign Up Button */}
          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignUp}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["rgba(249, 115, 22, 0.15)", "rgba(249, 115, 22, 0.1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.googleButtonInner}
            >
              {isLoading ? (
                <ActivityIndicator color="#f97316" size="small" />
              ) : (
                <>
                  <View style={styles.googleIconContainer}>
                    <Ionicons name="logo-google" size={22} color="#fff" />
                  </View>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Terms notice */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {" "}and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          {/* Feature highlights */}
          <View style={styles.featuresSection}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="create-outline" size={20} color="#f97316" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Write Stories</Text>
                <Text style={styles.featureDesc}>Share your thoughts with the world</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="people-outline" size={20} color="#f97316" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Join Community</Text>
                <Text style={styles.featureDesc}>Connect with fellow writers</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="trending-up-outline" size={20} color="#f97316" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Grow Audience</Text>
                <Text style={styles.featureDesc}>Reach thousands of readers</Text>
              </View>
            </View>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Sign In Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/sign-in")}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  auroraContainer: {
    position: "absolute",
    top: height * 0.1,
    width: width * 1.5,
    height: height * 0.5,
    left: -width * 0.25,
  },
  aurora: {
    width: "100%",
    height: "100%",
    borderRadius: width * 0.5,
  },
  safeArea: {
    flex: 1,
  },
  backButtonTop: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginLeft: 20,
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: height * 0.06,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: "rgba(249, 115, 22, 0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(249, 115, 22, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: "300",
    color: "#fff",
    letterSpacing: 2,
    fontStyle: "italic",
  },
  welcomeSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    flex: 1,
  },
  googleButton: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(249, 115, 22, 0.3)",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  googleButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 14,
  },
  googleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  featuresSection: {
    marginTop: 32,
    gap: 18,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  featureDesc: {
    color: "#555",
    fontSize: 13,
  },
  termsText: {
    textAlign: "center",
    color: "#555",
    fontSize: 13,
    marginTop: 20,
    lineHeight: 20,
  },
  termsLink: {
    color: "#f97316",
  },
  spacer: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 32,
  },
  footerText: {
    color: "#666",
    fontSize: 15,
  },
  footerLink: {
    color: "#f97316",
    fontSize: 15,
    fontWeight: "600",
  },
  // Verification styles
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  verifyContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  verifyHeader: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  verifyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  verifyTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  verifySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  codeInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 20,
    color: "#fff",
    fontSize: 28,
    textAlign: "center",
    letterSpacing: 12,
    marginBottom: 24,
  },
  verifyButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  verifyButtonGradient: {
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
