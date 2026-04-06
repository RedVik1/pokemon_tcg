import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function Index() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  if (token) {
    return <Redirect href="/(tabs)/explore" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
