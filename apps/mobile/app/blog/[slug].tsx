/**
 * Blog Detail Screen - Beautiful Reading Experience
 * 
 * Features:
 * - Hero cover image
 * - Full blog content with proper TipTap rendering
 * - Author information with avatar
 * - Share functionality
 * - Smooth scrolling
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Image,
  Dimensions,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useBlogQuery } from "../../src/lib/queries";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Estimate read time
function estimateReadTime(content: any): number {
  const text = extractAllText(content);
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Extract all text from content
function extractAllText(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  
  if (content.content && Array.isArray(content.content)) {
    return content.content
      .map((node: any) => {
        if (node.content) {
          return node.content.map((child: any) => child.text || "").join("");
        }
        return "";
      })
      .join(" ");
  }
  return "";
}

export default function BlogDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  
  // TanStack Query - auto-fetches, caches, handles loading/error
  const { data: blog, isLoading: loading, error } = useBlogQuery(slug || "");

  const handleShare = async () => {
    if (!blog) return;
    try {
      await Share.share({
        title: blog.title,
        message: `Check out "${blog.title}" on Chai & Blog`,
        url: `https://www.chaiand.blog/blog/${blog.slug}`,
      });
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  // Render TipTap content node
  const renderNode = (node: any, index: number): React.ReactNode => {
    if (!node) return null;

    switch (node.type) {
      case "paragraph":
        if (!node.content || node.content.length === 0) {
          return <View key={index} style={{ height: 16 }} />;
        }
        return (
          <Text key={index} style={styles.paragraph}>
            {node.content?.map((child: any, i: number) => renderInlineContent(child, i))}
          </Text>
        );

      case "heading":
        const level = node.attrs?.level || 2;
        const headingStyle = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
        return (
          <Text key={index} style={headingStyle}>
            {node.content?.map((child: any, i: number) => renderInlineContent(child, i))}
          </Text>
        );

      case "bulletList":
        return (
          <View key={index} style={styles.list}>
            {node.content?.map((item: any, i: number) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listItemText}>
                  {item.content?.[0]?.content?.map((c: any) => c.text || "").join("")}
                </Text>
              </View>
            ))}
          </View>
        );

      case "orderedList":
        return (
          <View key={index} style={styles.list}>
            {node.content?.map((item: any, i: number) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.bullet}>{i + 1}.</Text>
                <Text style={styles.listItemText}>
                  {item.content?.[0]?.content?.map((c: any) => c.text || "").join("")}
                </Text>
              </View>
            ))}
          </View>
        );

      case "codeBlock":
        const code = node.content?.map((c: any) => c.text || "").join("") || "";
        return (
          <View key={index} style={styles.codeBlock}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={styles.codeText}>{code}</Text>
            </ScrollView>
          </View>
        );

      case "blockquote":
        return (
          <View key={index} style={styles.blockquote}>
            <Text style={styles.blockquoteText}>
              {node.content?.[0]?.content?.map((c: any) => c.text || "").join("")}
            </Text>
          </View>
        );

      case "image":
        if (node.attrs?.src) {
          return (
            <View key={index} style={styles.imageContainer}>
              <Image
                source={{ uri: node.attrs.src }}
                style={styles.contentImage}
                resizeMode="contain"
              />
              {node.attrs.alt && (
                <Text style={styles.imageCaption}>{node.attrs.alt}</Text>
              )}
            </View>
          );
        }
        return null;

      case "horizontalRule":
        return <View key={index} style={styles.hr} />;

      case "table":
        const colCount = node.content?.[0]?.content?.length || 2;
        // Calculate cell width - min 140px per cell, but if 2 columns, fill screen
        const cellWidth = colCount === 2 
          ? (SCREEN_WIDTH - 44) / 2 
          : Math.max(140, (SCREEN_WIDTH - 44) / colCount);
        
        return (
          <ScrollView 
            key={index} 
            horizontal 
            showsHorizontalScrollIndicator={colCount > 2} 
            style={styles.tableContainer}
            contentContainerStyle={colCount <= 2 ? { flex: 1 } : undefined}
          >
            <View style={[styles.table, colCount <= 2 && { flex: 1 }]}>
              {node.content?.map((row: any, i: number) => (
                <View key={i} style={styles.tableRow}>
                  {row.content?.map((cell: any, j: number) => {
                    const isHeader = cell.type === "tableHeader";
                    return (
                      <View 
                        key={j} 
                        style={[
                          isHeader ? styles.tableHeader : styles.tableCell,
                          { width: colCount <= 2 ? undefined : cellWidth, flex: colCount <= 2 ? 1 : undefined }
                        ]}
                      >
                        <Text style={isHeader ? styles.tableHeaderText : styles.tableCellText}>
                          {cell.content?.[0]?.content?.map((c: any, k: number) => renderInlineContent(c, k))}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        );

      case "tableRow":
        return (
          <View key={index} style={styles.tableRow}>
            {node.content?.map((cell: any, i: number) => renderNode(cell, i))}
          </View>
        );

      case "tableHeader":
        return (
          <View key={index} style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>
              {node.content?.[0]?.content?.map((c: any, i: number) => renderInlineContent(c, i))}
            </Text>
          </View>
        );

      case "tableCell":
        return (
          <View key={index} style={styles.tableCell}>
            <Text style={styles.tableCellText}>
              {node.content?.[0]?.content?.map((c: any, i: number) => renderInlineContent(c, i))}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  // Render inline content (text, bold, italic, links, inline code)
  const renderInlineContent = (child: any, index: number): React.ReactNode => {
    if (!child) return null;

    if (child.type === "text") {
      const text = child.text || "";
      
      // Check for special marks first
      if (child.marks && child.marks.length > 0) {
        // Check for inline code mark
        const hasCode = child.marks.some((m: any) => m.type === "code");
        if (hasCode) {
          return <Text key={index} style={styles.inlineCode}>{text}</Text>;
        }
        
        // Check for link mark
        const linkMark = child.marks.find((m: any) => m.type === "link");
        if (linkMark) {
          return (
            <Text
              key={index}
              style={styles.link}
              onPress={() => Linking.openURL(linkMark.attrs?.href)}
            >
              {text}
            </Text>
          );
        }
        
        // Handle bold/italic/underline
        let textStyle: any = {};
        child.marks.forEach((mark: any) => {
          if (mark.type === "bold") textStyle.fontWeight = "700";
          if (mark.type === "italic") textStyle.fontStyle = "italic";
          if (mark.type === "underline") textStyle.textDecorationLine = "underline";
        });
        return <Text key={index} style={textStyle}>{text}</Text>;
      }
      
      return <Text key={index}>{text}</Text>;
    }

    return child.text || null;
  };

  // Render all content (skip first image if it matches cover)
  const renderContent = (content: any, coverImageUrl?: string): React.ReactNode => {
    if (!content) return null;
    if (typeof content === "string") {
      return <Text style={styles.paragraph}>{content}</Text>;
    }
    
    if (content.content && Array.isArray(content.content)) {
      let skippedCoverImage = false;
      return content.content.map((node: any, index: number) => {
        // Skip the first image if it matches the cover image
        if (!skippedCoverImage && node.type === "image" && coverImageUrl && node.attrs?.src === coverImageUrl) {
          skippedCoverImage = true;
          return null;
        }
        return renderNode(node, index);
      });
    }
    
    return null;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading article...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (error || !blog) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#f97316" />
          <Text style={styles.errorText}>{error?.message || "Article not found"}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const readTime = estimateReadTime(blog.content);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Floating Header */}
      <SafeAreaView edges={["top"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Hero Cover Image */}
        {blog.coverImage && (
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: blog.coverImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(5,5,5,0.5)", "#050505"]}
              style={styles.heroGradient}
            />
          </View>
        )}

        <View style={[styles.content, !blog.coverImage && { paddingTop: 20 }]}>
          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {blog.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{blog.title}</Text>

          {/* Author & Meta */}
          <View style={styles.meta}>
            <View style={styles.authorContainer}>
              {blog.authorImage ? (
                <Image source={{ uri: blog.authorImage }} style={styles.authorAvatarImage} />
              ) : (
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorAvatarText}>
                    {blog.authorName?.charAt(0).toUpperCase() || "?"}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.authorName}>{blog.authorName || "Anonymous"}</Text>
                <Text style={styles.publishInfo}>
                  {formatDate(blog.publishedAt)} · {readTime} min read
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {blog.description && (
            <Text style={styles.description}>{blog.description}</Text>
          )}

          {/* Content */}
          <View style={styles.bodyContent}>
            {renderContent(blog.content, blog.coverImage)}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-social" size={20} color="#f97316" />
              <Text style={styles.shareButtonText}>Share this article</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
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
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: "#f97316",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  backBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.65,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  content: {
    padding: 20,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: "rgba(249,115,22,0.2)",
    borderWidth: 1,
    borderColor: "#f97316",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderCurve: "continuous",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f97316",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 36,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  meta: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  authorAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  authorAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  publishInfo: {
    fontSize: 14,
    color: "#888",
  },
  description: {
    fontSize: 18,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 28,
    marginBottom: 24,
    fontStyle: "italic",
    paddingLeft: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#f97316",
  },
  bodyContent: {
    marginTop: 8,
  },
  // Content styles
  paragraph: {
    fontSize: 17,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 28,
    letterSpacing: 0.2,
    marginBottom: 16,
  },
  h1: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 34,
    marginTop: 32,
    marginBottom: 16,
  },
  h2: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 30,
    marginTop: 28,
    marginBottom: 12,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 26,
    marginTop: 24,
    marginBottom: 10,
  },
  list: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bullet: {
    fontSize: 17,
    color: "#f97316",
    marginRight: 12,
    width: 20,
  },
  listItemText: {
    flex: 1,
    fontSize: 17,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 26,
  },
  codeBlock: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderCurve: "continuous",
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  codeText: {
    fontSize: 14,
    fontFamily: "Menlo",
    color: "#e5e5e5",
    lineHeight: 22,
  },
  inlineCode: {
    backgroundColor: "rgba(249,115,22,0.2)",
    color: "#f97316",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 15,
    fontFamily: "Menlo",
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: "#f97316",
    paddingLeft: 16,
    marginBottom: 16,
    backgroundColor: "rgba(249,115,22,0.05)",
    paddingVertical: 12,
    borderRadius: 4,
  },
  blockquoteText: {
    fontSize: 17,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 26,
  },
  link: {
    color: "#f97316",
    textDecorationLine: "underline",
  },
  imageContainer: {
    marginVertical: 16,
    alignItems: "center",
  },
  contentImage: {
    width: SCREEN_WIDTH - 40,
    height: (SCREEN_WIDTH - 40) * 0.6,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  imageCaption: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
  hr: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 32,
  },
  // Table styles
  tableContainer: {
    marginVertical: 20,
  },
  table: {
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(60,60,60,1)",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeader: {
    backgroundColor: "rgba(35,35,35,1)",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(60,60,60,1)",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  tableCell: {
    backgroundColor: "rgba(18,18,18,1)",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(50,50,50,1)",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  tableCellText: {
    color: "rgba(200,200,200,1)",
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerDivider: {
    width: 60,
    height: 4,
    backgroundColor: "#f97316",
    borderRadius: 2,
    marginBottom: 24,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(249,115,22,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderCurve: "continuous",
    gap: 8,
  },
  shareButtonText: {
    color: "#f97316",
    fontSize: 16,
    fontWeight: "600",
  },
});
