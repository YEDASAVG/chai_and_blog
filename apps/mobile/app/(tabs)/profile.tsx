/**
 * Profile Screen - Premium Dark Design
 * 
 * Features:
 * - Real user data from API
 * - Glowing avatar with stats
 * - Elegant menu cards
 * - Edit profile functionality
 */

import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useProfile, useMyBlogs } from "../../src/lib/hooks";

export default function ProfileScreen() {
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { profile, loading: profileLoading, loadProfile } = useProfile();
  const { blogs, loading: blogsLoading, loadMyBlogs } = useMyBlogs();
  
  // Computed values
  const publishedCount = blogs.filter(b => b.status === "published").length;
  const draftCount = blogs.filter(b => b.status === "draft").length;

  // Load profile and blogs when signed in - run in parallel for speed
  useEffect(() => {
    if (isSignedIn) {
      // Run both API calls in parallel instead of sequentially
      Promise.all([loadProfile(), loadMyBlogs()]);
    }
  }, [isSignedIn]);

  const handleSignOut = async () => {
    await signOut();
  };

  // Get display name
  const displayName = profile?.name || user?.fullName || user?.firstName || "User";
  const displayUsername = profile?.username || user?.username || user?.firstName?.toLowerCase() || "user";
  const displayAvatar = profile?.avatar || user?.imageUrl;

  // Not signed in view - Premium design
  if (!isSignedIn) {
    return (
      <View style={styles.container}>
        {/* Background gradient orbs */}
        <LinearGradient
          colors={["#f97316", "transparent"]}
          style={styles.bgOrb1}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={["#3b82f6", "transparent"]}
          style={styles.bgOrb2}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.authPrompt}>
            {/* Glowing avatar placeholder */}
            <View style={styles.avatarGlowContainer}>
              <LinearGradient
                colors={["#f97316", "#ea580c", "#dc2626"]}
                style={styles.avatarGlow}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.avatarPlaceholderLarge}>
                <Ionicons name="person" size={56} color="#666" />
              </View>
            </View>
            
            <Text style={styles.authTitle}>Join the Community</Text>
            <Text style={styles.authSubtext}>
              Sign in to write stories, follow authors, and personalize your reading experience
            </Text>
            
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push("/sign-in")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#f97316", "#ea580c"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInGradient}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => router.push("/sign-up")}
              activeOpacity={0.8}
            >
              <Text style={styles.signUpButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Signed in view - Premium design
  return (
    <View style={styles.container}>
      {/* Background gradient orbs */}
      <LinearGradient
        colors={["#f97316", "transparent"]}
        style={styles.bgOrb1}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {profileLoading && !profile && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#f97316" size="large" />
            </View>
          )}

          {/* Profile Card */}
          <View style={styles.profileCard}>
            {/* Avatar with glow */}
            <View style={styles.avatarGlowContainer}>
              <LinearGradient
                colors={["#f97316", "#ea580c", "#dc2626"]}
                style={styles.avatarGlow}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userHandle}>@{displayUsername}</Text>
            
            {/* Bio */}
            {profile?.bio && (
              <Text style={styles.userBio} numberOfLines={2}>{profile.bio}</Text>
            )}
            
            {/* Stats - Real data */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{publishedCount}</Text>
                <Text style={styles.statLabel}>Published</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{draftCount}</Text>
                <Text style={styles.statLabel}>Drafts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{blogs.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.editProfileButton} 
              activeOpacity={0.8}
              onPress={() => router.push("/edit-profile")}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Menu Sections */}
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>Content</Text>
            <View style={styles.menuCard}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push("/my-posts")}
              >
                <View style={[styles.menuIcon, { backgroundColor: "rgba(249, 115, 22, 0.15)" }]}>
                  <Ionicons name="document-text" size={20} color="#f97316" />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuText}>My Posts</Text>
                  <Text style={styles.menuSubtext}>
                    {blogsLoading ? "Loading..." : `${publishedCount} published, ${draftCount} drafts`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#444" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <View style={[styles.menuIcon, { backgroundColor: "rgba(139, 92, 246, 0.15)" }]}>
                  <Ionicons name="bookmark" size={20} color="#8b5cf6" />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuText}>Saved</Text>
                  <Text style={styles.menuSubtext}>Coming soon</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#444" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]}>
                <View style={[styles.menuIcon, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
                  <Ionicons name="stats-chart" size={20} color="#3b82f6" />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuText}>Analytics</Text>
                  <Text style={styles.menuSubtext}>Coming soon</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Links */}
          {(profile?.github || profile?.twitter || profile?.linkedin) && (
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>Social</Text>
              <View style={styles.menuCard}>
                {profile?.github && (
                  <View style={styles.menuItem}>
                    <View style={[styles.menuIcon, { backgroundColor: "rgba(255, 255, 255, 0.1)" }]}>
                      <Ionicons name="logo-github" size={20} color="#fff" />
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuText}>GitHub</Text>
                      <Text style={styles.menuSubtext}>{profile.github}</Text>
                    </View>
                  </View>
                )}
                {profile?.twitter && (
                  <View style={styles.menuItem}>
                    <View style={[styles.menuIcon, { backgroundColor: "rgba(29, 161, 242, 0.15)" }]}>
                      <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuText}>Twitter</Text>
                      <Text style={styles.menuSubtext}>{profile.twitter}</Text>
                    </View>
                  </View>
                )}
                {profile?.linkedin && (
                  <View style={[styles.menuItem, styles.menuItemLast]}>
                    <View style={[styles.menuIcon, { backgroundColor: "rgba(0, 119, 181, 0.15)" }]}>
                      <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuText}>LinkedIn</Text>
                      <Text style={styles.menuSubtext}>{profile.linkedin}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Sign Out */}
          <TouchableOpacity 
            style={styles.signOutButton} 
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  safeArea: {
    flex: 1,
  },
  bgOrb1: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.2,
  },
  bgOrb2: {
    position: "absolute",
    bottom: 100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  // Profile Card
  profileCard: {
    alignItems: "center",
    padding: 24,
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
  },
  avatarGlowContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.5,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "#050505",
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#050505",
  },
  avatarPlaceholderLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#050505",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#f97316",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: 16,
  },
  userHandle: {
    fontSize: 15,
    color: "#666",
    marginTop: 4,
  },
  userBio: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  editProfileButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  editProfileText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  // Menu
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 14,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  menuSubtext: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  // Sign out
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "600",
  },
  bottomPadding: {
    height: 40,
  },
  // Auth prompt (not signed in)
  authPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginTop: 32,
    letterSpacing: -0.5,
  },
  authSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  signInButton: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
  },
  signInGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 8,
  },
  signInButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
  signUpButton: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  signUpButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 17,
  },
});
