/**
 * Edit Blog Screen
 * 
 * Features:
 * - Load existing blog for editing
 * - Update and publish
 * - Delete blog
 */

import { useEffect, useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useBlogForEditQuery, useSaveBlogMutation, useDeleteBlogMutation } from "../../src/lib/queries";

// Extract text from TipTap JSON content
function extractTextFromContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  
  if (content.content && Array.isArray(content.content)) {
    return content.content
      .map((node: any) => {
        if (node.type === "paragraph" && node.content) {
          return node.content.map((child: any) => child.text || "").join("");
        }
        if (node.type === "heading" && node.content) {
          return node.content.map((child: any) => child.text || "").join("");
        }
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
  }
  
  return "";
}

export default function EditBlogScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // TanStack Query
  const { data: blogData, isLoading: loading, error } = useBlogForEditQuery(id || "");
  const { mutateAsync: saveBlog, isPending: saving } = useSaveBlogMutation();
  const { mutateAsync: deleteBlogMutation } = useDeleteBlogMutation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  // Populate form when blog loads
  useEffect(() => {
    if (blogData) {
      setTitle(blogData.title || "");
      setContent(extractTextFromContent(blogData.content));
      setDescription(blogData.description || "");
      setStatus(blogData.publishedAt ? "published" : "draft");
    }
  }, [blogData]);

  const handleSave = async (newStatus: "draft" | "published") => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please add a title to your blog post");
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
        id,
        title: title.trim(),
        content: contentJson,
        description: description.trim() || content.slice(0, 160),
        status: newStatus,
      });

      const message = newStatus === "published" 
        ? "Your changes have been published"
        : "Draft saved successfully";

      Alert.alert("Success!", message, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Error", "Failed to save. Please try again.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBlogMutation(id!);
              Alert.alert("Deleted", "Your post has been deleted", [
                { text: "OK", onPress: () => router.replace("/my-posts") },
              ]);
            } catch (err) {
              Alert.alert("Error", "Failed to delete post");
            }
          },
        },
      ]
    );
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading post...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#f97316" />
          <Text style={styles.errorText}>{error.message}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

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
              <Ionicons name="arrow-back" size={24} color="#888" />
            </TouchableOpacity>
            
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.draftButton}
                onPress={() => handleSave("draft")}
                disabled={saving}
              >
                <Text style={styles.draftText}>Save Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.publishButton, saving && styles.publishButtonDisabled]}
                onPress={() => handleSave("published")}
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
                    {saving ? "Saving..." : status === "published" ? "Update" : "Publish"}
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
            {/* Status Badge */}
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge,
                status === "published" ? styles.statusPublished : styles.statusDraft
              ]}>
                <Text style={styles.statusText}>
                  {status === "published" ? "Published" : "Draft"}
                </Text>
              </View>
            </View>

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

            {/* Description Input */}
            <TextInput
              style={styles.descriptionInput}
              placeholder="Brief description (shown in previews)..."
              placeholderTextColor="#555"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={200}
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

            {/* Stats */}
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Ionicons name="document-text-outline" size={16} color="#666" />
                <Text style={styles.statText}>{wordCount} words</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.statText}>{readTime} min read</Text>
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: "#f97316",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  retryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    gap: 10,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  draftButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
  },
  draftText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
  },
  publishButton: {
    borderRadius: 18,
    overflow: "hidden",
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishGradient: {
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  publishButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  editor: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusPublished: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  statusDraft: {
    backgroundColor: "rgba(249, 115, 22, 0.15)",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  titleInput: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginTop: 16,
    marginBottom: 12,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  descriptionInput: {
    fontSize: 16,
    color: "#888",
    lineHeight: 24,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  contentInput: {
    fontSize: 18,
    color: "#ccc",
    lineHeight: 30,
    minHeight: 200,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    marginTop: 40,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    color: "#666",
    fontSize: 13,
  },
  bottomPadding: {
    height: 80,
  },
});
