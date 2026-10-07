import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "@/i18n";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const bottom = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#65E6E0", tabBarInactiveTintColor: "#70849A", tabBarStyle: { backgroundColor: "#0D1B2E", borderTopColor: "#27415C", height: 58 + bottom, paddingTop: 7, paddingBottom: bottom }, tabBarLabelStyle: { fontSize: 11, fontWeight: "700" } }}>
    <Tabs.Screen name="index" options={{ title: t("nav.explore"), tabBarIcon: ({ color, size }) => <MaterialIcons name="explore" color={color} size={size} /> }} />
    <Tabs.Screen name="lab" options={{ title: t("nav.lab"), tabBarIcon: ({ color, size }) => <MaterialIcons name="science" color={color} size={size} /> }} />
    <Tabs.Screen name="library" options={{ title: t("nav.library"), tabBarIcon: ({ color, size }) => <MaterialIcons name="bookmarks" color={color} size={size} /> }} />
    <Tabs.Screen name="profile" options={{ title: t("nav.profile"), tabBarIcon: ({ color, size }) => <MaterialIcons name="person-outline" color={color} size={size} /> }} />
  </Tabs>;
}
