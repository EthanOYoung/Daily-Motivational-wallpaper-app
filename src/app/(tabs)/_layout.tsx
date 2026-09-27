import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import { useAppTheme } from '@/theme';

type IconName = 'sunny-outline' | 'heart-outline' | 'create-outline' | 'options-outline';

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  };
}

export default function TabsLayout() {
  const { colors } = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Today', tabBarIcon: tabIcon('sunny-outline') }}
      />
      <Tabs.Screen
        name="favourites"
        options={{ title: 'Favourites', tabBarIcon: tabIcon('heart-outline') }}
      />
      <Tabs.Screen
        name="my-quotes"
        options={{ title: 'My Quotes', tabBarIcon: tabIcon('create-outline') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: tabIcon('options-outline') }}
      />
    </Tabs>
  );
}
