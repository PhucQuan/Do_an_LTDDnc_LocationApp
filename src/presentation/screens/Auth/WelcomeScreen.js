import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get('window');

// ── Floating dot decoration ───────────────────────────────────────────────
function FloatingDot({ style, delay = 0 }) {
  const posY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(posY, { toValue: -14, duration: 2000, delay, useNativeDriver: true }),
        Animated.timing(posY, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[style, { transform: [{ translateY: posY }] }]} />;
}

export default function WelcomeScreen({ navigation }) {
  // Entry animations
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(30)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(40)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0D0D1A', '#12001A', '#1A0012']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative blobs */}
      <View style={[styles.blob, { top: -80, right: -60, width: 260, height: 260, backgroundColor: 'rgba(232,72,229,0.15)' }]} />
      <View style={[styles.blob, { bottom: 100, left: -80, width: 220, height: 220, backgroundColor: 'rgba(139,92,246,0.14)' }]} />
      <View style={[styles.blob, { top: '40%', right: '-20%', width: 160, height: 160, backgroundColor: 'rgba(236,72,153,0.1)' }]} />

      {/* Floating map pins */}
      <FloatingDot delay={0} style={[styles.pin, { top: '18%', left: '12%' }]}>
        <LinearGradient colors={['#E848E5', '#8B5CF6']} style={styles.pinInner}>
          <Text style={{ fontSize: 16 }}>📍</Text>
        </LinearGradient>
      </FloatingDot>
      <FloatingDot delay={600} style={[styles.pin, { top: '28%', right: '10%' }]}>
        <LinearGradient colors={['#8B5CF6', '#E848E5']} style={styles.pinInner}>
          <Text style={{ fontSize: 14 }}>👥</Text>
        </LinearGradient>
      </FloatingDot>
      <FloatingDot delay={300} style={[styles.pin, { bottom: '28%', right: '16%' }]}>
        <LinearGradient colors={['#E848E5', '#EC4899']} style={styles.pinInner}>
          <Text style={{ fontSize: 14 }}>💬</Text>
        </LinearGradient>
      </FloatingDot>

      <SafeAreaView style={styles.safe}>
        {/* Logo + Title */}
        <Animated.View style={[styles.logoSection, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <LinearGradient
            colors={['#E848E5', '#8B5CF6', '#EC4899']}
            style={styles.logoGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Text style={{ fontSize: 44 }}>🌍</Text>
          </LinearGradient>

          {/* Glow ring */}
          <View style={styles.glowRing} />
        </Animated.View>

        {/* Text block */}
        <Animated.View style={[styles.textBlock, { transform: [{ translateY: textSlide }], opacity: textOpacity }]}>
          <Text style={styles.appTitle}>GeoLink</Text>
          <Text style={styles.headline}>
            Chia sẻ vị trí với{'\n'}
            <Text style={styles.headlineAccent}>bạn bè</Text> theo{'\n'}thời gian thực
          </Text>
          <Text style={styles.sub}>
            Luôn kết nối, luôn bên nhau — dù ở bất cứ đâu.
          </Text>
        </Animated.View>

        {/* Dots indicator */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Buttons */}
        <Animated.View style={[styles.btnSection, { transform: [{ translateY: btnSlide }], opacity: btnOpacity }]}>
          {/* Get Started */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#E848E5', '#8B5CF6']}
              style={styles.primaryBtnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.primaryBtnText}>Bắt đầu ngay</Text>
              <Text style={styles.arrow}>»</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Already have account */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>
              Đã có tài khoản?{' '}
              <Text style={styles.secondaryBtnAccent}>Đăng nhập</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, justifyContent: 'space-evenly', paddingHorizontal: 28, paddingBottom: 20 },
  blob: { position: 'absolute', borderRadius: 999 },

  // Floating pins
  pin: { position: 'absolute', zIndex: 2 },
  pinInner: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#E848E5',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8,
  },

  // Logo
  logoSection: { alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  logoGrad: {
    width: 120, height: 120, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
    elevation: 16, shadowColor: '#E848E5',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 24,
  },
  glowRing: {
    position: 'absolute',
    width: 148, height: 148, borderRadius: 44,
    borderWidth: 1.5, borderColor: 'rgba(232,72,229,0.3)',
  },

  // Text
  textBlock: { alignItems: 'center' },
  appTitle: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13, fontWeight: '700', letterSpacing: 4,
    textTransform: 'uppercase', marginBottom: 12,
  },
  headline: {
    color: '#FFFFFF', fontSize: 36, fontWeight: '900',
    textAlign: 'center', lineHeight: 44,
  },
  headlineAccent: {
    color: '#E848E5',
  },
  sub: {
    color: 'rgba(255,255,255,0.45)', fontSize: 15,
    textAlign: 'center', marginTop: 14, lineHeight: 22,
  },

  // Dots
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 24, backgroundColor: '#E848E5' },

  // Buttons
  btnSection: { gap: 14 },
  primaryBtn: {
    borderRadius: 18, overflow: 'hidden',
    elevation: 12, shadowColor: '#E848E5',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.55, shadowRadius: 16,
  },
  primaryBtnGrad: {
    height: 60, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  checkmark: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  primaryBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  arrow: { color: 'rgba(255,255,255,0.7)', fontSize: 20 },

  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18, height: 56,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  secondaryBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
  secondaryBtnAccent: { color: '#E848E5', fontWeight: '700' },
});
