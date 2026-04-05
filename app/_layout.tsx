// app/_layout.tsx
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuth, AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { EstoqueProvider } from '../context/estoqueStorage';
import { NetworkStatusListener } from '../components/NetworkStatusListener';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

function RootLayoutNav() {
  const { user, loading } = useAuth();

  // SEMPRE mostrar auth enquanto carrega, até verificar login
  const mostrarAuth = loading || !user;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {mostrarAuth ? (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="escanear"
            options={{ presentation: 'fullScreenModal', headerShown: false, animation: 'slide_from_bottom' }}
          />
        </>
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
          <NetworkStatusListener />
          <Toast />
        </EstoqueProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}