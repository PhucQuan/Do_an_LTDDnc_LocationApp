import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/presentation/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { authService } from './src/infrastructure/firebase/authService';
import { adminService, ADMIN_EMAILS } from './src/infrastructure/firebase/adminService';
import { COLORS } from './src/presentation/theme';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './src/infrastructure/firebase/firebase';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.subscribe(async (user) => {
      if (!user) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setInitializing(false);
        return;
      }

      setIsAuthenticated(true);

      try {
        // Auto-assign admin role if email is whitelisted
        if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
          await adminService.ensureAdminRole(user.uid || user.id, user.email);
          setIsAdmin(true);
        } else {
          // Check role field in Firestore
          const uid = user.uid || user.id;
          if (uid) {
            const userDoc = await getDoc(doc(db, 'users', uid));
            const role = userDoc.exists() ? userDoc.data().role : null;
            setIsAdmin(role === 'admin');
          } else {
            setIsAdmin(false);
          }
        }
      } catch (e) {
        console.error('[App] Role check failed:', e);
        setIsAdmin(false);
      } finally {
        setInitializing(false);
      }
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
        <StatusBar style={isAdmin ? 'light' : 'dark'} backgroundColor={isAdmin ? '#0A0E1A' : COLORS.bg} />
        <AppNavigator isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
