import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Search, MapPin, Layers, Navigation2, Plus, MessageCircle, Users } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useLocation } from '../../../core/hooks/useLocation';

const MapScreen = () => {
  const { location, isLoading } = useLocation();

  if (isLoading && !location) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  const initialRegion = {
    latitude: location?.coords.latitude || 37.78825,
    longitude: location?.coords.longitude || -122.4324,
    latitudeDelta: 0.0122,
    longitudeDelta: 0.0121,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        customMapStyle={mapStyle}
      >
        {location && (
          <Marker 
            coordinate={{ 
              latitude: location.coords.latitude, 
              longitude: location.coords.longitude 
            }}
            title="Me"
          />
        )}
      </MapView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <BlurView intensity={80} tint="dark" style={styles.searchBar}>
            <Search color="#94A3B8" size={20} />
            <TextInput 
                placeholder="Search places or friends..." 
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
            />
            <TouchableOpacity style={styles.searchIconRight}>
                <MapPin color="#F8FAFC" size={20} />
            </TouchableOpacity>
        </BlurView>
      </View>

      {/* Floating Buttons Right */}
      <View style={styles.floatingButtonsRight}>
        <TouchableOpacity style={styles.fButton}><Layers color="#F8FAFC" size={24} /></TouchableOpacity>
        <TouchableOpacity style={styles.fButton}><Plus color="#F8FAFC" size={24} /></TouchableOpacity>
        <TouchableOpacity style={styles.fButton}><Navigation2 color="#F8FAFC" size={24} /></TouchableOpacity>
      </View>

       {/* Bottom Actions Bar (Mimicking the UI in image) */}
       <View style={styles.bottomActions}>
         <BlurView intensity={100} tint="dark" style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionItem}>
                <Users color="#94A3B8" size={24} />
                <Text style={styles.actionText}>Friends</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.centerButton}>
                <View style={styles.centerButtonInner}>
                    <Plus color="#fff" size={32} />
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
                <MessageCircle color="#94A3B8" size={24} />
                <Text style={styles.actionText}>Chat</Text>
            </TouchableOpacity>
         </BlurView>
       </View>
    </View>
  );
};

const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#1e293b" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#94a3b8" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#0f172a" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#334155" }]
  },
  {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{ "color": "#334155" }]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
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
  searchIconRight: {
      backgroundColor: '#334155',
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
  },
  floatingButtonsRight: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    gap: 15,
  },
  fButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 5,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 70,
    borderRadius: 35,
    paddingHorizontal: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
  },
  centerButton: {
    top: -20,
  },
  centerButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#0F172A',
    elevation: 10,
  }
});

export default MapScreen;
