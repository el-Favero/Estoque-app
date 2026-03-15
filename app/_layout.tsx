// app/_layout.tsx
import { Stack } from 'expo-router';
import { useAuth, AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { EstoqueProvider } from '../context/estoqueStorage';
import { View, ActivityIndicator } from 'react-native';

function RootLayoutNav() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <EstoqueProvider>
          <RootLayoutNav />
        </EstoqueProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}