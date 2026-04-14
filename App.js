import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/presentation/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { authService } from './src/infrastructure/firebase/authService';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const startupTimeout = setTimeout(() => {
      setInitializing(false);
    }, 5000);

    const unsubscribe = authService.subscribe((user) => {
      setIsAuthenticated(!!user);
      setInitializing(false);
    });

    return () => {
      clearTimeout(startupTimeout);
      unsubscribe();
    };
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#0F172A" />
        <AppNavigator isAuthenticated={isAuthenticated} />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
