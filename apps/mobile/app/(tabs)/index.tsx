/**
 * Feed Screen - Stitch-inspired Dark Premium Design
 * 
 * Features:
 * - Real data from backend API via TanStack Query
 * - Glassmorphism search bar with live search
 * - Premium blog cards with cover images
 * - Pull-to-refresh and infinite scroll
 * - Automatic caching and background refetching
 */

import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useFeedQuery } from "../../src/lib/queries";
import type { FeedBlog } from "../../src/lib/api";

// Category colors for visual interest
const CATEGORY_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f97316", // Orange
  "#10b981", // Green
  "#06b6d4", // Cyan
];

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Estimate read time from content
function estimateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

export default function FeedScreen() {
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // TanStack Query - handles caching, loading, errors, pagination
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isRefetching,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useFeedQuery(debouncedSearch || undefined);

  // Flatten paginated data into single array
  const blogs = useMemo(() => {
    return data?.pages.flatMap((page) => page.blogs) ?? [];
  }, [data]);

  // Debounced search - waits 500ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get category color by index
  const getCategoryColor = (index: number) => {
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  };

  const renderBlogCard = ({ item, index }: { item: FeedBlog; index: number }) => {
    const categoryColor = getCategoryColor(index);
    const tag = item.tags?.[0] || "Blog";
    const isFeatured = index === 0;

    return (
      <TouchableOpacity
        style={[styles.card, isFeatured && styles.featuredCard]}
        activeOpacity={0.9}
        onPress={() => router.push(`/blog/${item.slug}`)}
      >
        {/* Cover Image or Gradient Background */}
        <View style={[styles.cardImage, isFeatured && styles.featuredImage]}>
          {item.coverImage ? (
            <Image
              source={{ uri: item.coverImage }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={["#1a1a1a", "#111", "#0a0a0a"]}
              style={StyleSheet.absoluteFill}
            />
          )}
          
          {/* Gradient Overlay for text readability */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.95)"]}
            style={styles.cardGradient}
          >
            {/* Content */}
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, isFeatured && styles.featuredTitle]} numberOfLines={2}>
                {item.title}
              </Text>
              {isFeatured && item.description && (
                <Text style={styles.cardExcerpt} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              
              {/* Meta */}
              <View style={styles.cardMeta}>
                <View style={styles.authorContainer}>
                  {item.authorImage ? (
                    <Image 
                      source={{ uri: item.authorImage }} 
                      style={styles.authorAvatarImage}
                    />
                  ) : (
                    <View style={[styles.authorAvatar, { backgroundColor: categoryColor }]}>
                      <Text style={styles.authorAvatarText}>
                        {item.authorName?.charAt(0).toUpperCase() || "?"}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.authorName}>{item.authorName || "Anonymous"}</Text>
                </View>
                <View style={styles.metaRight}>
                  <Text style={styles.metaText}>{formatRelativeTime(item.publishedAt)}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage || blogs.length === 0) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator color="#f97316" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.headerTitle}>Discover</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Search Bar with Glassmorphism */}
        <View style={styles.searchContainer}>
          <BlurView intensity={20} tint="dark" style={styles.searchBlur}>
            <Ionicons name="search" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search articles..."
              placeholderTextColor="#666"
              value={localSearch}
              onChangeText={setLocalSearch}
              returnKeyType="search"
              onSubmitEditing={() => setDebouncedSearch(localSearch)}
            />
            {localSearch.length > 0 && (
              <TouchableOpacity onPress={() => setLocalSearch("")}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </BlurView>
        </View>

        {/* Categories - filter by tags */}
        <View style={styles.categoriesContainer}>
          {["All", "Tech", "Design", "Code", "Mobile"].map((cat, i) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, i === 0 && styles.categoryPillActive]}
              onPress={() => {
                if (cat === "All") {
                  setLocalSearch("");
                  setDebouncedSearch("");
                } else {
                  setLocalSearch(cat);
                  setDebouncedSearch(cat);
                }
              }}
            >
              <Text style={[styles.categoryPillText, i === 0 && styles.categoryPillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* Error State */}
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#f97316" />
          <Text style={styles.errorText}>{error.message}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Initial Loading */}
      {isLoading && blogs.length === 0 && !error && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      )}

      {/* Blog List - Virtualized for performance */}
      {(!isLoading || blogs.length > 0) && !error && (
        <FlatList
          data={blogs}
          renderItem={renderBlogCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={() => refetch()}
              tintColor="#f97316"
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No articles yet</Text>
              <Text style={styles.emptySubtext}>Be the first to share your story</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#f97316",
    borderWidth: 2,
    borderColor: "#050505",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBlur: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#fff",
  },
  categoriesContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  categoryPillActive: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  categoryPillTextActive: {
    color: "#fff",
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    marginBottom: 20,
    borderRadius: 20,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: "#111",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
  },
  featuredCard: {
    marginBottom: 24,
  },
  cardImage: {
    height: 200,
    justifyContent: "flex-end",
    overflow: "hidden",
    borderRadius: 20,
  },
  featuredImage: {
    height: 280,
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  cardGradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
    borderRadius: 20,
  },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardContent: {},
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    lineHeight: 24,
  },
  featuredTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  cardExcerpt: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 12,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  authorAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  authorAvatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  authorName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  metaRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  metaDot: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    marginHorizontal: 6,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#444",
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
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
});
