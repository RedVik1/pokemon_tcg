import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { login, register } from '../../src/api';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setToken } = useAuth();

  useEffect(() => {
    setError('');
  }, [isLoginMode]);

  const handleSubmit = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      if (isLoginMode) {
        const data = await login(email, password);
        setToken(data.access_token);
        router.replace('/(tabs)/explore');
      } else {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await register(email, password);
        const data = await login(email, password);
        setToken(data.access_token);
        router.replace('/(tabs)/explore');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail;
      setError(
        typeof msg === 'string'
          ? msg
          : err.message || 'Authentication failed. Check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoginMode, email, password, setToken, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Feather name="box" size={20} color="#0a0a0a" />
            </View>
            <Text style={styles.logoText}>COLLECTR</Text>
          </View>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isLoginMode ? 'Welcome Back' : 'Create an Account'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isLoginMode
                ? 'Enter your credentials to access your vault.'
                : 'Start building your ultimate TCG portfolio today.'}
            </Text>
          </View>
          {error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={18} color="#f43f5e" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <View style={styles.form}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor="#64748b"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#64748b"
              style={styles.input}
              secureTextEntry
              autoComplete="password"
              minLength={isLoginMode ? 1 : 6}
            />
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#0a0a0a" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLoginMode ? 'Enter Vault' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
              <Text
                style={styles.footerLink}
                onPress={() => setIsLoginMode(!isLoginMode)}
              >
                {' '}
                {isLoginMode ? 'Sign Up' : 'Log In'}
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#141414',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#14b8a6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(244,63,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorIcon: {
    marginTop: 2,
  },
  errorText: {
    flex: 1,
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: 'bold',
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#fff',
    fontSize: 16,
    outlineStyle: 'none',
  },
  submitButton: {
    backgroundColor: '#14b8a6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '900',
  },
  footer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
  },
  footerLink: {
    color: '#2dd4bf',
    fontWeight: 'bold',
  },
});
