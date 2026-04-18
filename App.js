import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/presentation/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { authService } from './src/infrastructure/firebase/authService';
import { COLORS } from './src/presentation/theme';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.subscribe((user) => {
      setIsAuthenticated(!!user);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor={COLORS.bg} />
        <AppNavigator isAuthenticated={isAuthenticated} />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
