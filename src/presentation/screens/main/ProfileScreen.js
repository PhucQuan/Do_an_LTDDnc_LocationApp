import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Settings, Edit2, MapPin, Navigation, Plus, LogOut } from 'lucide-react-native';
import { authService } from '../../../infrastructure/firebase/authService';

const ProfileScreen = () => {
  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await authService.logout();
            } catch (error) {
              Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.settingsButton}>
            <Settings color="#F8FAFC" size={24} />
        </TouchableOpacity>
        
        <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>A</Text>
                </View>
                <TouchableOpacity style={styles.editButton}>
                    <Edit2 color="#fff" size={14} />
                </TouchableOpacity>
            </View>
            <Text style={styles.name}>Alex</Text>
            <TouchableOpacity style={styles.copyCode}>
                <Text style={styles.codeText}>Bumping Code: BUMP123</Text>
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Moments</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.momentsList}>
            <View style={styles.momentItem} />
            <View style={styles.momentItem} />
            <View style={styles.momentItem} />
        </ScrollView>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
                <Navigation color="#38BDF8" size={30} />
            </View>
            <Text style={styles.statValue}>120 km</Text>
            <Text style={styles.statLabel}>Total Distance Traveled</Text>
        </View>

        <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
                <MapPin color="#38BDF8" size={30} />
            </View>
            <Text style={styles.statValue}>45</Text>
            <Text style={styles.statLabel}>Places Visited</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut color="#EF4444" size={20} style={styles.menuIcon} />
            <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
         <TouchableOpacity style={styles.addButton}>
            <Plus color="#fff" size={32} />
         </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  settingsButton: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
      alignItems: 'center',
      marginTop: 10,
  },
  avatarContainer: {
      position: 'relative',
      marginBottom: 15,
  },
  avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#1E293B',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: '#38BDF8',
  },
  avatarText: {
      color: '#fff',
      fontSize: 40,
      fontWeight: 'bold',
  },
  editButton: {
      position: 'absolute',
      right: 0,
      top: 0,
      backgroundColor: '#38BDF8',
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#0F172A',
  },
  name: {
      color: '#F8FAFC',
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 5,
  },
  copyCode: {
      backgroundColor: '#1E293B',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#334155',
  },
  codeText: {
      color: '#94A3B8',
      fontSize: 12,
  },
  section: {
      paddingHorizontal: 20,
      marginBottom: 30,
  },
  sectionTitle: {
      color: '#F8FAFC',
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
  },
  momentsList: {
      gap: 15,
  },
  momentItem: {
      width: 120,
      height: 160,
      borderRadius: 20,
      backgroundColor: '#1E293B',
      borderWidth: 1,
      borderColor: '#334155',
  },
  statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 15,
      marginBottom: 20,
  },
  statCard: {
      flex: 1,
      backgroundColor: '#1E293B',
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#334155',
  },
  statIconContainer: {
      marginBottom: 15,
  },
  statValue: {
      color: '#F8FAFC',
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
  },
  statLabel: {
      color: '#64748B',
      fontSize: 12,
      textAlign: 'center',
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  menuIcon: {
    marginRight: 12,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
      alignItems: 'center',
      marginBottom: 40,
  },
  addButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#38BDF8',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
  }
});

export default ProfileScreen;
