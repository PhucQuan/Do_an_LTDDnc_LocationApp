import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { COLORS, SHADOW } from '../../theme';

export function ReactionAnimation({ emoji, fromName, onComplete }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Float up and fade out after delay
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onComplete) onComplete();
      });
    }, 1800);

    return () => clearTimeout(timer);
  }, [scale, opacity, translateY, onComplete]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      {fromName ? <Text style={styles.fromText}>{fromName}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    zIndex: 9999,
    ...SHADOW.accent,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 6,
  },
  fromText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
});
