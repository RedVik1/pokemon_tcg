import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform, View } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#2dd4bf',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarBackground: () => (
          <View style={{ backgroundColor: '#0a0a0a' }} />
        ),
        sceneStyle: {
          backgroundColor: '#0a0a0a',
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Feather name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color, size }) => (
            <Feather name="briefcase" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
