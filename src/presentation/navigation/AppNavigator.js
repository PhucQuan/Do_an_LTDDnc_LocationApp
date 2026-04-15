import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CircleUserRound,
  Map,
  MessageCircle,
  Users,
} from 'lucide-react-native';
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import MapScreen from '../screens/main/MapScreen';
import FriendsListScreen from '../screens/main/FriendsListScreen';
import ChatListScreen from '../screens/main/ChatListScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import AddFriendScreen from '../screens/main/AddFriendScreen';
import CreateGroupScreen from '../screens/main/CreateGroupScreen';
import GroupChatScreen from '../screens/main/GroupChatScreen';
import PrivacySettingsScreen from '../screens/main/PrivacySettingsScreen';
import GiftCenterScreen from '../screens/main/GiftCenterScreen';
import { COLORS, SHADOW } from '../theme';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MainStack = createNativeStackNavigator();

function TabIcon({ focused, label, Icon }) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minWidth: 68,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? COLORS.ink : 'transparent',
        }}
      >
        <Icon color={focused ? COLORS.white : COLORS.textMuted} size={21} />
      </View>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '800',
          color: focused ? COLORS.textPrimary : COLORS.textMuted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 14,
          height: 82,
          paddingTop: 12,
          paddingBottom: 10,
          borderRadius: 28,
          backgroundColor: 'rgba(255,255,255,0.94)',
          borderTopWidth: 0,
          ...SHADOW.card,
        },
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Map" Icon={Map} />,
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsListScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Friends" Icon={Users} />,
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Chats" Icon={MessageCircle} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Profile" Icon={CircleUserRound} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Welcome" component={WelcomeScreen} />
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Register" component={RegisterScreen} />
      <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </RootStack.Navigator>
  );
}

function AuthenticatedStack() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen name="AddFriend" component={AddFriendScreen} />
      <MainStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <MainStack.Screen name="GroupChat" component={GroupChatScreen} />
      <MainStack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <MainStack.Screen name="GiftCenter" component={GiftCenterScreen} />
    </MainStack.Navigator>
  );
}

export default function AppNavigator({ isAuthenticated }) {
  return isAuthenticated ? <AuthenticatedStack /> : <AuthStack />;
}
