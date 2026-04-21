import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS } from '../../theme';

export function TrailParticle({ startX, startY, color, delay = 0, onComplete }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -30,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(() => {
      if (onComplete) onComplete();
    });

    return () => animation.stop();
  }, [delay, translateY, opacity, scale, onComplete]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    />
  );
}

export function SpeedBurst({ x, y, speed, onComplete }) {
  const animations = useRef(
    Array.from({ length: 6 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    const angle = (Math.PI * 2) / 6;
    const distance = 20 + speed * 0.5;

    const animationSequence = animations.map((anim, i) => {
      const targetX = Math.cos(angle * i) * distance;
      const targetY = Math.sin(angle * i) * distance;

      return Animated.parallel([
        Animated.timing(anim.translateX, {
          toValue: targetX,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: targetY,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animationSequence).start(() => {
      if (onComplete) onComplete();
    });
  }, [animations, speed, onComplete]);

  return (
    <View style={[styles.burstContainer, { left: x, top: y }]}>
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.burstParticle,
            {
              opacity: anim.opacity,
              transform: [{ translateX: anim.translateX }, { translateY: anim.translateY }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  burstContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
  },
  burstParticle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.yellow,
    shadowColor: COLORS.yellow,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
});
