import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Map, Users, User } from 'lucide-react-native';

// Import Screens
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import MapScreen from '../screens/main/MapScreen';
import FriendsListScreen from '../screens/main/FriendsListScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CreateGroupScreen from '../screens/main/CreateGroupScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D0D1A',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.05)',
          height: 70,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#E848E5',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
      }}
    >
      <Tab.Screen 
        name="Explore" 
        component={MapScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
          tabBarLabel: 'Khám phá',
          tabBarStyle: { display: 'none' } // Ẩn tab bar mặc định vì đã có thanh Floating ở MapScreen
        }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsListScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          tabBarLabel: 'Bạn bè'
        }}
      />
      <Tab.Screen 
        name="Me" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          tabBarLabel: 'Tôi'
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ isAuthenticated }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
