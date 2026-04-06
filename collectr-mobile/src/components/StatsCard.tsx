import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatMoney } from '../utils';

interface StatsCardProps {
  label: string;
  value: number;
  prefix?: string;
  variant?: 'netWorth' | 'default';
  onPress?: () => void;
}

export default function StatsCard({ label, value, prefix = '$', variant = 'default', onPress }: StatsCardProps) {
  const isNetWorth = variant === 'netWorth';

  return (
    <TouchableOpacity
      style={[styles.container, isNetWorth && styles.netWorthContainer]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={[styles.label, isNetWorth && styles.netWorthLabel]}>{label}</Text>
      <Text style={[styles.value, isNetWorth && styles.netWorthValue]}>
        {prefix}
        {formatMoney(value)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  netWorthContainer: {
    backgroundColor: 'rgba(20,184,166,0.1)',
    borderRadius: 20,
    padding: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  netWorthLabel: {
    color: '#14b8a6',
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  netWorthValue: {
    fontSize: 28,
    color: '#34d399',
  },
});
