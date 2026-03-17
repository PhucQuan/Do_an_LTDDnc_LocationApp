import React from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image } from 'react-native';
import { Search, Settings, MapPin } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const FRIENDS_DATA = [
  { id: '1', name: 'Alex', status: 'Just checked in at Central Park!', time: '10:45 AM', active: true },
  { id: '2', name: 'Sarah', status: 'See you later!', time: 'Yesterday', active: true },
  { id: '3', name: 'Mike', status: 'Dinner tonight?', time: 'Yesterday', active: false },
  { id: '4', name: 'Happy', status: 'You need a home too.', time: 'Yesterday', active: true },
  { id: '5', name: 'Juanh', status: 'Has two weeks out day!', time: 'Yesterday', active: false },
  { id: '6', name: 'Emaji', status: 'Dinner tonight?', time: 'Yesterday', active: true },
  { id: '7', name: 'Katy', status: 'Are you working for you!', time: 'Yesterday', active: false },
];

const FriendItem = ({ item }) => (
  <TouchableOpacity style={styles.friendItem}>
    <View style={styles.avatarContainer}>
        {/* Placeholder for avatar */}
        <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name[0]}</Text>
        </View>
        {item.active && <View style={styles.activeDot} />}
    </View>
    <View style={styles.friendInfo}>
        <View style={styles.friendHeader}>
            <Text style={styles.friendName}>{item.name}</Text>
            <Text style={styles.friendTime}>{item.time}</Text>
        </View>
        <Text style={styles.friendStatus} numberOfLines={1}>{item.status}</Text>
    </View>
  </TouchableOpacity>
);

const FriendsListScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BlurView intensity={80} tint="dark" style={styles.searchBar}>
            <Search color="#94A3B8" size={20} />
            <TextInput 
                placeholder="Search chats or friends..." 
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
            />
        </BlurView>
      </View>

      <View style={styles.activeFriends}>
        <FlatList 
            horizontal
            data={FRIENDS_DATA.filter(f => f.active)}
            keyExtractor={(item) => 'active-' + item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
                <View style={styles.activeFriendItem}>
                    <View style={styles.activeAvatar}>
                        <Text style={styles.avatarText}>{item.name[0]}</Text>
                    </View>
                    <Text style={styles.activeName}>{item.name}</Text>
                </View>
            )}
            contentContainerStyle={styles.activeList}
        />
      </View>

      <FlatList 
        data={FRIENDS_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FriendItem item={item} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Text style={styles.listLabel}>Messages</Text>}
      />
    </View>
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
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    marginLeft: 10,
    fontSize: 16,
  },
  activeFriends: {
      marginBottom: 20,
  },
  activeList: {
    paddingHorizontal: 20,
    gap: 15,
  },
  activeFriendItem: {
    alignItems: 'center',
  },
  activeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  activeName: {
    color: '#F8FAFC',
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  listLabel: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 15,
  },
  friendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  friendName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendTime: {
    color: '#64748B',
    fontSize: 12,
  },
  friendStatus: {
    color: '#94A3B8',
    fontSize: 14,
  },
});

export default FriendsListScreen;
