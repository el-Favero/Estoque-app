import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { ThemeProvider } from '../context/ThemeContext'; // Ajuste o caminho conforme necessário

export default function TabLayout() {
  return (
    <ThemeProvider>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f5f3ff', // lilás claro
          },
          headerTintColor: '#1e40af', // azul escuro
          tabBarActiveTintColor: '#4f46e5', // índigo
          tabBarInactiveTintColor: '#a78bfa', // roxo claro
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
          name="configuracao" 
          options={{ 
            title: "Configurações",
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
          }} 
        />
      </Tabs>
    </ThemeProvider>
  );
}