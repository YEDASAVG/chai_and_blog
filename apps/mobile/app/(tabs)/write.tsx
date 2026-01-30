/**
 * Write Screen - Simple Text Editor
 * 
 * Features:
 * - Plain text editing (no rich text in React Native TextInput)
 * - Cover image placeholder
 * - Save as draft or publish
 * - Word count & read time stats
 */

import { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSaveBlogMutation } from "../../src/lib/queries";

export default function WriteScreen() {
  const { isSignedIn } = useAuth();
  const { mutateAsync: saveBlog, isPending: saving, error: saveError } = useSaveBlogMutation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#f97316", "transparent"]}
          style={styles.bgOrb1}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.authPrompt}>
            <View style={styles.authIconContainer}>
              <LinearGradient
                colors={["#f97316", "#ea580c"]}
                style={styles.authIconGradient}
              >
                <Ionicons name="pencil" size={40} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.authTitle}>Start Writing</Text>
            <Text style={styles.authSubtext}>
              Sign in to share your stories{"\n"}with the world
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
                <Text style={styles.signInButtonText}>Sign In to Write</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please add a title to your blog post");
      return;
    }
    if (!content.trim()) {
      Alert.alert("Missing content", "Please write some content");
      return;
    }

    try {
      // Convert plain text to TipTap-like JSON structure
      const contentJson = {
        type: "doc",
        content: content.split("\n\n").map((paragraph) => ({
          type: "paragraph",
          content: paragraph ? [{ type: "text", text: paragraph }] : [],
        })),
      };

      await saveBlog({
        title: title.trim(),
        content: contentJson,
        description: description.trim() || content.slice(0, 160),
        status: "published",
      });

      Alert.alert("Success!", "Your blog post has been published", [
        {
          text: "OK",
          onPress: () => {
            setTitle("");
            setContent("");
            setDescription("");
            router.push("/(tabs)");
          },
        },
      ]);
    } catch (err) {
      Alert.alert("Error", saveError?.message || "Failed to publish. Please try again.");
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert("Empty draft", "Add a title or content to save as draft");
      return;
    }

    try {
      const contentJson = content.trim()
        ? {
            type: "doc",
            content: content.split("\n\n").map((paragraph) => ({
              type: "paragraph",
              content: paragraph ? [{ type: "text", text: paragraph }] : [],
            })),
          }
        : undefined;

      await saveBlog({
        title: title.trim() || "Untitled",
        content: contentJson,
        description: description.trim(),
        status: "draft",
      });

      Alert.alert("Saved!", "Your draft has been saved", [
        {
          text: "OK",
          onPress: () => {
            setTitle("");
            setContent("");
            setDescription("");
          },
        },
      ]);
    } catch (err) {
      Alert.alert("Error", saveError?.message || "Failed to save draft. Please try again.");
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
            
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.draftButton}
                onPress={handleSaveDraft}
                disabled={saving}
              >
                <Text style={styles.draftText}>Save Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.publishButton, saving && styles.publishButtonDisabled]}
                onPress={handlePublish}
                disabled={saving}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#f97316", "#ea580c"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.publishGradient}
                >
                  <Text style={styles.publishButtonText}>
                    {saving ? "Saving..." : "Publish"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={styles.editor} 
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            contentInsetAdjustmentBehavior="automatic"
          >
            {/* Cover Image Placeholder */}
            <TouchableOpacity style={styles.coverImagePlaceholder} activeOpacity={0.8}>
              <View style={styles.coverImageContent}>
                <View style={styles.coverIconContainer}>
                  <Ionicons name="image-outline" size={28} color="#666" />
                </View>
                <Text style={styles.coverImageText}>Add cover image</Text>
                <Text style={styles.coverImageHint}>Recommended: 1200 x 630px</Text>
              </View>
            </TouchableOpacity>

            {/* Title Input */}
            <TextInput
              style={styles.titleInput}
              placeholder="Your story title..."
              placeholderTextColor="#444"
              value={title}
              onChangeText={setTitle}
              multiline
              maxLength={100}
            />

            {/* Content Input */}
            <TextInput
              style={styles.contentInput}
              placeholder="Tell your story..."
              placeholderTextColor="#555"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* Stats Bar - Fixed above tab bar */}
          <View style={styles.statsBar}>
            <View style={styles.statsContent}>
              <Text style={styles.statText}>{wordCount} words</Text>
              <View style={styles.statDot} />
              <Text style={styles.statText}>{readTime} min read</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  draftButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
  },
  draftText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  publishButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  publishButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  editor: {
    flex: 1,
    paddingHorizontal: 20,
  },
  coverImagePlaceholder: {
    marginTop: 20,
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  coverImageContent: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  coverIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  coverImageText: {
    color: "#888",
    fontSize: 15,
    fontWeight: "600",
  },
  coverImageHint: {
    color: "#555",
    fontSize: 12,
    marginTop: 4,
  },
  titleInput: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginTop: 28,
    marginBottom: 16,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  contentInput: {
    fontSize: 18,
    color: "#ccc",
    lineHeight: 30,
    minHeight: 200,
  },
  bottomPadding: {
    height: 120,
  },
  statsBar: {
    position: "absolute",
    bottom: 88,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#050505",
  },
  statsContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#555",
  },
  statText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "500",
  },
  // Auth prompt styles
  authPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  authIconContainer: {
    marginBottom: 28,
  },
  authIconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  authTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  authSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  signInButton: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
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
});
