import React from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';

export function MomentViewerModal({ moment, onClose }) {
  return (
    <Modal animationType="fade" transparent visible={!!moment} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X color="#FFFFFF" size={18} />
        </TouchableOpacity>

        {moment ? (
          <View style={styles.card}>
            <Image source={{ uri: moment.imageUrl }} style={styles.image} resizeMode="cover" />
            <View style={styles.footer}>
              <Text style={styles.name}>{moment.displayName}</Text>
              <Text style={styles.caption}>{moment.caption || 'Shared a moment on the map'}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    padding: 18,
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#111111',
  },
  image: {
    width: '100%',
    height: 420,
    backgroundColor: '#1F2937',
  },
  footer: {
    padding: 18,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  caption: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 6,
  },
});
