import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name="search" size={32} color="#14b8a6" />
      </View>
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>Page not found</Text>
      <Text style={styles.subtitle}>
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/(tabs)/explore')}
        activeOpacity={0.8}
      >
        <Feather name="arrow-left" size={16} color="#0a0a0a" />
        <Text style={styles.buttonText}>Back to Explore</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(20,184,166,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  code: {
    fontSize: 64,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#14b8a6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#0a0a0a',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
