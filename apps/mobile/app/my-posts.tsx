/**
 * My Posts Screen
 * 
 * Features:
 * - List of user's published and draft blogs
 * - Filter by status
 * - Edit/delete functionality
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMyBlogs } from "../src/lib/hooks";
import { api, ApiError } from "../src/lib/api";
import { useAuth } from "@clerk/clerk-expo";

type FilterStatus = "all" | "published" | "draft";

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default function MyPostsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { blogs, loading, error, loadMyBlogs } = useMyBlogs();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadMyBlogs();
  }, []);

  const filteredBlogs = blogs.filter((blog) => {
    if (filter === "all") return true;
    return blog.status === filter;
  });

  const handleDelete = async (id: string, title: string) => {
    Alert.alert(
      "Delete Post",
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(id);
              const token = await getToken();
              if (!token) throw new Error("Not authenticated");
              await api.deleteBlog(token, id);
              loadMyBlogs(); // Refresh list
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof ApiError ? err.message : "Failed to delete post"
              );
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const renderBlogItem = ({ item }: { item: typeof blogs[0] }) => (
    <View style={styles.blogCard}>
      <TouchableOpacity
        style={styles.blogContent}
        onPress={() => router.push(`/blog/${item.slug}`)}
        activeOpacity={0.7}
      >
        <View style={styles.blogHeader}>
          <View
            style={[
              styles.statusBadge,
              item.status === "published"
                ? styles.statusPublished
                : styles.statusDraft,
            ]}
          >
            <Text style={styles.statusText}>
              {item.status === "published" ? "Published" : "Draft"}
            </Text>
          </View>
          <Text style={styles.blogDate}>{formatRelativeTime(item.updatedAt)}</Text>
        </View>
        <Text style={styles.blogTitle} numberOfLines={2}>
          {item.title || "Untitled"}
        </Text>
      </TouchableOpacity>

      <View style={styles.blogActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push(`/edit/${item._id}`)}
        >
          <Ionicons name="pencil" size={18} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDelete(item._id, item.title)}
          disabled={deleting === item._id}
        >
          {deleting === item._id ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Posts</Text>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push("/(tabs)/write")}
          >
            <Ionicons name="add" size={24} color="#f97316" />
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterContainer}>
          {(["all", "published", "draft"] as FilterStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterPill, filter === status && styles.filterPillActive]}
              onPress={() => setFilter(status)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === status && styles.filterTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== "all" && ` (${blogs.filter((b) => b.status === status).length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* Loading */}
      {loading && blogs.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadMyBlogs()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Blog List */}
      {!loading && !error && (
        <FlatList
          data={filteredBlogs}
          renderItem={renderBlogItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>
                {filter === "all"
                  ? "No posts yet"
                  : `No ${filter} posts`}
              </Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => router.push("/(tabs)/write")}
              >
                <Text style={styles.createBtnText}>Create your first post</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  filterPillActive: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  filterTextActive: {
    color: "#fff",
  },
  list: {
    padding: 16,
  },
  blogCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderCurve: "continuous",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  blogContent: {
    padding: 16,
  },
  blogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
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
  blogDate: {
    fontSize: 12,
    color: "#666",
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 22,
  },
  blogActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 16,
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
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
  },
  createBtn: {
    backgroundColor: "#f97316",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  createBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
