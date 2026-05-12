import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Zone = {
  name: string;
  emoji: string;
  hint: string;
  color: string;
};

const ZONES: Zone[] = [
  { name: 'Boven Rechts', emoji: '↗️', hint: 'Poets de bovenkant rechts', color: '#FF6B9D' },
  { name: 'Boven Links', emoji: '↖️', hint: 'Nu de bovenkant links', color: '#4ECDC4' },
  { name: 'Onder Links', emoji: '↙️', hint: 'Door naar onder links', color: '#FFA552' },
  { name: 'Onder Rechts', emoji: '↘️', hint: 'Laatste stuk: onder rechts', color: '#7B5EA7' },
];

const ZONE_DURATION = 30; // seconds per zone
const TOTAL = ZONE_DURATION * ZONES.length; // 120 seconds = 2 minuten

const PEP_TALK = [
  'Lekker poetsen! 💪',
  'Goed bezig! ✨',
  'Doorgaan! 🌟',
  'Knap hoor! 🦷',
  'Bijna! 🚀',
];

function useTriggerHaptic() {
  return useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning') => {
    if (Platform.OS === 'web') return;
    if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'warning') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      const map = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      Haptics.impactAsync(map[type]);
    }
  }, []);
}

export default function BrushScreen() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const [pepIndex, setPepIndex] = useState(0);

  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const haptic = useTriggerHaptic();

  const zoneIndex = Math.min(Math.floor(seconds / ZONE_DURATION), ZONES.length - 1);
  const zone = ZONES[zoneIndex];
  const zoneSeconds = seconds % ZONE_DURATION;
  const zoneProgress = zoneSeconds / ZONE_DURATION;

  // Wiggle the tooth when running
  useEffect(() => {
    if (!running || done) {
      wiggleAnim.stopAnimation();
      Animated.timing(wiggleAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wiggleAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: -1,
          duration: 440,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [running, done, wiggleAnim]);

  // Tick: 1 second
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => Math.min(s + 1, TOTAL));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // React to seconds changes (zone change, finish, pep talk)
  useEffect(() => {
    if (seconds === 0) return;

    if (seconds >= TOTAL) {
      setRunning(false);
      setDone(true);
      haptic('success');
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    if (seconds % ZONE_DURATION === 0) {
      haptic('warning');
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.35,
          duration: 200,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      const newZone = Math.floor(seconds / ZONE_DURATION);
      Animated.timing(bgAnim, {
        toValue: newZone,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }

    if (seconds % 10 === 0) {
      setPepIndex((p) => (p + 1) % PEP_TALK.length);
    }
  }, [seconds, bounceAnim, bgAnim, confettiAnim, haptic]);

  const start = useCallback(() => {
    haptic('medium');
    if (done) {
      setSeconds(0);
      setDone(false);
      bgAnim.setValue(0);
      confettiAnim.setValue(0);
    }
    setRunning(true);
  }, [done, bgAnim, confettiAnim, haptic]);

  const pause = useCallback(() => {
    haptic('light');
    setRunning(false);
  }, [haptic]);

  const reset = useCallback(() => {
    haptic('heavy');
    setRunning(false);
    setSeconds(0);
    setDone(false);
    bgAnim.setValue(0);
    confettiAnim.setValue(0);
  }, [bgAnim, confettiAnim, haptic]);

  const remaining = TOTAL - seconds;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const wiggle = wiggleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-12deg', '12deg'],
  });

  const bgColor = bgAnim.interpolate({
    inputRange: ZONES.map((_, i) => i),
    outputRange: ZONES.map((z) => z.color),
  });

  if (done) {
    const confettiTranslate = confettiAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-50, 0],
    });
    return (
      <SafeAreaView style={[styles.container, styles.celebrateBg]} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <Animated.View
          style={[
            styles.celebrate,
            { opacity: confettiAnim, transform: [{ translateY: confettiTranslate }] },
          ]}>
          <Text style={styles.confettiRow}>🎉 ✨ 🌟 ✨ 🎉</Text>
          <Text style={styles.celebrateTooth}>🦷</Text>
          <Text style={styles.celebrateTitle}>Super gedaan!</Text>
          <Text style={styles.celebrateText}>
            Je hebt 2 minuten gepoetst.{'\n'}Je tanden zijn nu blinkend schoon! ✨
          </Text>
          <Pressable
            onPress={start}
            style={({ pressed }) => [
              styles.bigButton,
              styles.celebrateButton,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.bigButtonText, styles.celebrateButtonText]}>
              Nog een keer 🦷
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <Animated.View style={[styles.bgWrap, { backgroundColor: bgColor }]}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="light" />

        <View style={styles.header}>
          <Text style={styles.title}>Poets je tanden!</Text>
          <Text style={styles.subtitle}>2 minuten lang 💪</Text>
        </View>

        <View style={styles.toothStage}>
          <View style={styles.bubblesLayer} pointerEvents="none">
            {running && <Bubbles />}
          </View>
          <Animated.Text
            style={[
              styles.tooth,
              { transform: [{ rotate: wiggle }, { scale: bounceAnim }] },
            ]}>
            🦷
          </Animated.Text>
          {running && <Text style={styles.pepTalk}>{PEP_TALK[pepIndex]}</Text>}
        </View>

        <View style={styles.zoneCard}>
          <Text style={styles.zoneLabel}>POETS NU</Text>
          <Text style={styles.zoneName}>
            {zone.emoji}  {zone.name}
          </Text>
          <Text style={styles.zoneHint}>{zone.hint}</Text>

          <View style={styles.zoneProgressTrack}>
            <View
              style={[
                styles.zoneProgressFill,
                { width: `${Math.max(2, zoneProgress * 100)}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.timerRow}>
          <Text style={styles.timer}>
            {mm}:{ss}
          </Text>
          <View style={styles.zoneDots}>
            {ZONES.map((z, i) => {
              const completed = i < zoneIndex || done;
              const active = i === zoneIndex && running;
              return (
                <View
                  key={z.name}
                  style={[
                    styles.dot,
                    completed && styles.dotDone,
                    active && styles.dotActive,
                  ]}>
                  {completed && <Text style={styles.dotCheck}>✓</Text>}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.controls}>
          {!running ? (
            <Pressable
              onPress={start}
              style={({ pressed }) => [styles.bigButton, pressed && styles.pressed]}>
              <Text style={styles.bigButtonText}>
                {seconds > 0 ? 'Verder ▶️' : 'Start! 🚀'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={pause}
              style={({ pressed }) => [
                styles.bigButton,
                styles.pauseButton,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.bigButtonText}>Pauze ⏸</Text>
            </Pressable>
          )}
          {seconds > 0 && (
            <Pressable
              onPress={reset}
              style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}>
              <Text style={styles.smallButtonText}>Opnieuw 🔄</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const BUBBLE_EMOJIS = ['✨', '💧', '🫧', '⭐️', '💫'];
const { width: SCREEN_W } = Dimensions.get('window');

function Bubbles() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <Bubble key={i} index={i} />
      ))}
    </>
  );
}

function Bubble({ index }: { index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const startX = useRef(((index * 73) % (SCREEN_W - 80)) + 20).current;
  const emoji = BUBBLE_EMOJIS[index % BUBBLE_EMOJIS.length];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 2200 + index * 250,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const timeout = setTimeout(() => loop.start(), index * 300);
    return () => {
      clearTimeout(timeout);
      loop.stop();
      anim.setValue(0);
    };
  }, [anim, index]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [40, -260] });
  const opacity = anim.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] });

  return (
    <Animated.Text
      style={[
        styles.bubble,
        { left: startX, transform: [{ translateY }, { scale }], opacity },
      ]}>
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  bgWrap: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    fontWeight: '600',
  },
  toothStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bubblesLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  bubble: {
    position: 'absolute',
    bottom: 60,
    fontSize: 32,
  },
  tooth: {
    fontSize: 140,
    textAlign: 'center',
  },
  pepTalk: {
    marginTop: 12,
    fontSize: 22,
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
  },
  zoneCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  zoneLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1.5,
  },
  zoneName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#222',
    marginTop: 4,
  },
  zoneHint: {
    fontSize: 15,
    color: '#555',
    marginTop: 4,
    marginBottom: 12,
  },
  zoneProgressTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EEE',
    overflow: 'hidden',
  },
  zoneProgressFill: {
    height: '100%',
    backgroundColor: '#33C28E',
    borderRadius: 7,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  timer: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  zoneDots: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: '#fff',
    transform: [{ scale: 1.15 }],
  },
  dotDone: {
    backgroundColor: '#33C28E',
    borderColor: '#33C28E',
  },
  dotCheck: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
  controls: {
    marginTop: 16,
    gap: 10,
    alignItems: 'center',
  },
  bigButton: {
    backgroundColor: '#FFD93D',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  pauseButton: {
    backgroundColor: '#fff',
  },
  bigButtonText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#222',
  },
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  celebrateBg: {
    backgroundColor: '#FFE066',
  },
  celebrate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confettiRow: {
    fontSize: 36,
    letterSpacing: 6,
    marginBottom: 16,
  },
  celebrateTooth: {
    fontSize: 140,
    marginBottom: 12,
  },
  celebrateTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#3A2A00',
    textAlign: 'center',
  },
  celebrateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5C4400',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  celebrateButton: {
    backgroundColor: '#7B5EA7',
    alignSelf: 'center',
    paddingHorizontal: 48,
  },
  celebrateButtonText: {
    color: '#fff',
  },
});
