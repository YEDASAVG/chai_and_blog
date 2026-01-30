/**
 * Edit Profile Screen
 * 
 * Features:
 * - Update name, bio, social links
 * - Form validation
 * - Loading states
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useProfileQuery, useUpdateProfileMutation } from "../src/lib/queries";

export default function EditProfileScreen() {
  const router = useRouter();
  
  // TanStack Query
  const { data: profile, isLoading: loading, error } = useProfileQuery();
  const { mutateAsync: updateProfile, isPending: saving } = useUpdateProfileMutation();

  // Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [github, setGithub] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // Populate form when profile loads (TanStack Query auto-fetches)
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.bio || "");
      setGithub(profile.github || "");
      setTwitter(profile.twitter || "");
      setLinkedin(profile.linkedin || "");
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        github: github.trim(),
        twitter: twitter.trim(),
        linkedin: linkedin.trim(),
      });
      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  const hasChanges =
    profile &&
    (name !== (profile.name || "") ||
      bio !== (profile.bio || "") ||
      github !== (profile.github || "") ||
      twitter !== (profile.twitter || "") ||
      linkedin !== (profile.linkedin || ""));

  if (loading && !profile) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <TouchableOpacity
              style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={[styles.saveBtnText, !hasChanges && styles.saveBtnTextDisabled]}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Error */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          )}

          {/* Basic Info */}
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#666"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Social Links */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Social Links</Text>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-github" size={18} color="#888" />
              <Text style={[styles.label, { marginLeft: 8 }]}>GitHub</Text>
            </View>
            <TextInput
              style={styles.input}
              value={github}
              onChangeText={setGithub}
              placeholder="username"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-twitter" size={18} color="#1DA1F2" />
              <Text style={[styles.label, { marginLeft: 8 }]}>Twitter</Text>
            </View>
            <TextInput
              style={styles.input}
              value={twitter}
              onChangeText={setTwitter}
              placeholder="username"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-linkedin" size={18} color="#0077B5" />
              <Text style={[styles.label, { marginLeft: 8 }]}>LinkedIn</Text>
            </View>
            <TextInput
              style={styles.input}
              value={linkedin}
              onChangeText={setLinkedin}
              placeholder="username"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  safeArea: {
    backgroundColor: "#050505",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  saveBtn: {
    backgroundColor: "#f97316",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderCurve: "continuous",
  },
  saveBtnDisabled: {
    backgroundColor: "rgba(249, 115, 22, 0.3)",
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  saveBtnTextDisabled: {
    color: "rgba(255,255,255,0.5)",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#888",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
});
