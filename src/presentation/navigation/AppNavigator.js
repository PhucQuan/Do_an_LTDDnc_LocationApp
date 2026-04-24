import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CircleUserRound,
  Map,
  Users,
  LayoutDashboard,
  MessageSquare,
  Gift,
} from 'lucide-react-native';
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import MapScreen from '../screens/main/MapScreen';
import FriendsListScreen from '../screens/main/FriendsListScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import AddFriendScreen from '../screens/main/AddFriendScreen';
import CreateGroupScreen from '../screens/main/CreateGroupScreen';
import GroupChatScreen from '../screens/main/GroupChatScreen';
import DirectChatScreen from '../screens/main/DirectChatScreen';
import PrivacySettingsScreen from '../screens/main/PrivacySettingsScreen';
import GiftCenterScreen from '../screens/main/GiftCenterScreen';
import ChatListScreen from '../screens/main/ChatListScreen';
import FriendProfileScreen from '../screens/main/FriendProfileScreen';
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/Admin/AdminUsersScreen';
import AdminGroupsScreen from '../screens/Admin/AdminGroupsScreen';
import AdminGiftsScreen from '../screens/Admin/AdminGiftsScreen';
import AdminMapScreen from '../screens/Admin/AdminMapScreen';
import { COLORS, SHADOW } from '../theme';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MainStack = createNativeStackNavigator();
const AdminTab = createBottomTabNavigator();
const AdminStack = createNativeStackNavigator();

// ── User tab icon ────────────────────────────────────────────────
function TabIcon({ focused, label, Icon }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 68 }}>
      <View style={{ width: 44, height: 44, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? COLORS.ink : 'transparent' }}>
        <Icon color={focused ? COLORS.white : COLORS.textMuted} size={21} />
      </View>
      <Text style={{ fontSize: 11, fontWeight: '800', color: focused ? COLORS.textPrimary : COLORS.textMuted }}>
        {label}
      </Text>
    </View>
  );
}

// ── Admin tab icon ───────────────────────────────────────────────
function AdminTabIcon({ focused, label, Icon }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 58 }}>
      <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? '#7C3AED' : 'transparent' }}>
        <Icon color={focused ? '#fff' : '#475569'} size={19} />
      </View>
      <Text style={{ fontSize: 10, fontWeight: '800', color: focused ? '#A78BFA' : '#475569' }}>
        {label}
      </Text>
    </View>
  );
}

// ── User Stacks ──────────────────────────────────────────────────
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
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Map" Icon={Map} /> }} />
      <Tab.Screen name="Friends" component={FriendsListScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Friends" Icon={Users} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Profile" Icon={CircleUserRound} /> }} />
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
      <MainStack.Screen name="DirectChat" component={DirectChatScreen} />
      <MainStack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <MainStack.Screen name="GiftCenter" component={GiftCenterScreen} />
      <MainStack.Screen name="Chats" component={ChatListScreen} />
      <MainStack.Screen name="FriendProfile" component={FriendProfileScreen} />
    </MainStack.Navigator>
  );
}

// ── Admin Stacks ─────────────────────────────────────────────────
function AdminTabs() {
  return (
    <AdminTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: '#111827',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)',
        },
      }}
    >
      <AdminTab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ tabBarIcon: ({ focused }) => <AdminTabIcon focused={focused} label="Home" Icon={LayoutDashboard} /> }} />
      <AdminTab.Screen name="AdminUsers" component={AdminUsersScreen} options={{ tabBarIcon: ({ focused }) => <AdminTabIcon focused={focused} label="Users" Icon={Users} /> }} />
      <AdminTab.Screen name="AdminGroups" component={AdminGroupsScreen} options={{ tabBarIcon: ({ focused }) => <AdminTabIcon focused={focused} label="Groups" Icon={MessageSquare} /> }} />
      <AdminTab.Screen name="AdminGifts" component={AdminGiftsScreen} options={{ tabBarIcon: ({ focused }) => <AdminTabIcon focused={focused} label="Gifts" Icon={Gift} /> }} />
      <AdminTab.Screen name="AdminMap" component={AdminMapScreen} options={{ tabBarIcon: ({ focused }) => <AdminTabIcon focused={focused} label="Map" Icon={Map} /> }} />
    </AdminTab.Navigator>
  );
}

function AdminNavigatorStack() {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminStack.Screen name="AdminTabs" component={AdminTabs} />
    </AdminStack.Navigator>
  );
}

export default function AppNavigator({ isAuthenticated, isAdmin }) {
  if (!isAuthenticated) return <AuthStack />;
  if (isAdmin) return <AdminNavigatorStack />;
  return <AuthenticatedStack />;
}
