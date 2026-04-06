import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface EmptyStateProps {
  onGoExplore: () => void;
}

export default function EmptyState({ onGoExplore }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.illustrationContainer}>
        <View style={[styles.cardStack, styles.cardBack]} />
        <View style={[styles.cardStack, styles.cardMiddle]} />
        <View style={[styles.cardStack, styles.cardFront]} />
        <View style={styles.centerCard}>
          <Feather name="box" size={32} color="rgba(20,184,166,0.6)" />
        </View>
      </View>
      <Text style={styles.title}>Your Vault is Empty</Text>
      <Text style={styles.subtitle}>
        Start building your ultimate Pokemon TCG collection. Go to the Explore tab to find and add your first assets.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onGoExplore} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Explore Cards</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  illustrationContainer: {
    width: 128,
    height: 128,
    marginBottom: 24,
    position: 'relative',
  },
  cardStack: {
    position: 'absolute',
    width: 80,
    height: 112,
    borderRadius: 12,
    left: 24,
    top: 8,
  },
  cardBack: {
    backgroundColor: 'rgba(20,184,166,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.2)',
    transform: [{ rotate: '-15deg' }],
    opacity: 0.3,
  },
  cardMiddle: {
    backgroundColor: 'rgba(20,184,166,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.3)',
    opacity: 0.5,
  },
  cardFront: {
    backgroundColor: 'rgba(20,184,166,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.4)',
    transform: [{ rotate: '15deg' }],
    opacity: 0.7,
  },
  centerCard: {
    position: 'absolute',
    width: 80,
    height: 112,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    left: 24,
    top: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#14b8a6',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '900',
  },
});
