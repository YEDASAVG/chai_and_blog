/**
 * Tab Navigation Layout - Premium Dark Design
 * 
 * Creates a floating bottom tab bar with 3 tabs:
 * - Feed (home icon) - Browse blogs
 * - Write (plus icon) - Create new blog  
 * - Profile (user icon) - User settings
 */

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // Premium dark theme
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.OS === "ios" ? "transparent" : "rgba(10,10,10,0.95)",
          borderTopWidth: 0,
          paddingTop: 8,
          height: 88,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 20,
        },
        tabBarBackground: () => 
          Platform.OS === "ios" ? (
            <BlurView 
              intensity={80} 
              tint="dark" 
              style={StyleSheet.absoluteFill} 
            />
          ) : null,
        tabBarActiveTintColor: "#f97316",
        tabBarInactiveTintColor: "#555",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        // Hide header (we'll add custom headers per screen)
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="write"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View style={styles.writeButtonWrapper}>
              <View style={[styles.writeIconContainer, focused && styles.writeIconContainerActive]}>
                <Ionicons 
                  name="add" 
                  size={30} 
                  color="#fff" 
                />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons 
                name={focused ? "person" : "person-outline"} 
                size={24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderCurve: "continuous",
  },
  iconContainerActive: {
    backgroundColor: "rgba(249, 115, 22, 0.15)",
  },
  writeButtonWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  writeIconContainer: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    borderCurve: "continuous",
    backgroundColor: "#f97316",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  writeIconContainerActive: {
    backgroundColor: "#ea580c",
    transform: [{ scale: 0.95 }],
  },
});
