import Constants from 'expo-constants';
import { Platform } from 'react-native';

const hostUri = Constants.expoConfig?.hostUri || '';

const isLocalhost =
  (typeof window !== 'undefined' && window.location?.origin?.includes('localhost')) ||
  hostUri.includes('localhost') ||
  hostUri.includes('127.0.0.1');

export const config = {
  api: {
    baseUrl: isLocalhost ? 'http://localhost:8000' : 'https://pokemon-vault1.onrender.com',
    timeout: 15000,
    retries: 2,
  },
  pagination: {
    defaultPageSize: 48,
    maxPageSize: 100,
  },
  cache: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  },
  platform: {
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    tabBarHeight: Platform.OS === 'ios' ? 88 : 60,
  },
} as const;
