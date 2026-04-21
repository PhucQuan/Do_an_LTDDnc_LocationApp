import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../theme';

/**
 * Ripple effect when user taps on map
 */
export function MapRipple({ x, y, visible, onComplete }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      opacity.setValue(1);

      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onComplete) onComplete();
      });
    }
  }, [visible, scale, opacity, onComplete]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          left: x - 50,
          top: y - 50,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <View style={styles.rippleRing} />
    </Animated.View>
  );
}

/**
 * Pulse effect for selected location
 */
export function LocationPulse({ x, y, color = COLORS.accent }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.5,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.pulse,
        {
          left: x - 30,
          top: y - 30,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <View style={[styles.pulseRing, { borderColor: color }]} />
    </Animated.View>
  );
}

/**
 * Zoom transition overlay
 */
export function ZoomTransition({ visible, onComplete }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 20,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onComplete) onComplete();
      });
    }
  }, [visible, scale, opacity, onComplete]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.zoomOverlay,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[COLORS.accent, COLORS.pink, COLORS.purple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.zoomGradient}
      />
    </Animated.View>
  );
}

/**
 * Loading spinner for map
 */
export function MapLoadingSpinner() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.spinnerContainer}>
      <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]}>
        <LinearGradient
          colors={[COLORS.accent, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.spinnerGradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ripple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  rippleRing: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  pulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  pulseRing: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    borderWidth: 2,
  },
  zoomOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  spinnerContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  spinner: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  spinnerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
});
