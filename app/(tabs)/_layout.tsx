// app/(tabs)/_layout.tsx
import { Tabs, router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, Alert, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../utils/toast';
import { AlertasBadge } from '../../components/AlertasBadge';

export default function TabLayout() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            console.log("Executando logout...");
            try {
              await logout();
              toast.success('Você saiu da conta');
              // Redirect forçado para login
              setTimeout(() => {
                router.replace('/(auth)/login');
              }, 500);
            } catch (error: any) {
              console.error("Erro logout:", error);
              toast.error('Não foi possível sair');
            }
          }
        }
      ]
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f5f3ff',
        },
        headerTintColor: '#1e40af',
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#a78bfa',
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AlertasBadge />
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
              <Text style={{ color: '#ef4444', fontWeight: '600' }}>Sair</Text>
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "Home",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
        }} 
      />
      <Tabs.Screen 
        name="estoque" 
        options={{ 
          title: "Estoque",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📦</Text>,
        }} 
      />
      <Tabs.Screen 
        name="movimentacao" 
        options={{ 
          title: "Movimentação",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔄</Text>,
        }} 
      />
      <Tabs.Screen 
        name="relatorio" 
        options={{ 
          title: "Relatórios",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
        }} 
      />
      <Tabs.Screen 
        name="configuracao" 
        options={{ 
          title: "Configurações",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
        }} 
      />
      <Tabs.Screen 
        name="cadastro" 
        options={{ 
          title: "Cadastrar",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>➕</Text>,
        }} 
      />
      <Tabs.Screen name="editar-produto" options={{ href: null, title: 'Editar' }} />
    </Tabs>
  );
}