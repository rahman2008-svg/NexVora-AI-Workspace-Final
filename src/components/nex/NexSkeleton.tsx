import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { NEX, NEX_RADIUS } from './tokens';

/** Pulsing placeholder rows shown while a list loads (instead of a bare spinner). */
export default function NexSkeleton({ rows = 4 }: { rows?: number }) {
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading" style={styles.wrap}>
      {Array.from({ length: rows }).map((_, i) => (
        <Animated.View key={i} style={[styles.row, { opacity }]}>
          <View style={styles.icon} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.line, { width: '60%' }]} />
            <View style={[styles.line, { width: '85%', height: 10 }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: NEX.card, borderRadius: NEX_RADIUS.lg, padding: 16 },
  icon: { width: 40, height: 40, borderRadius: NEX_RADIUS.md, backgroundColor: NEX.cardPressed },
  line: { height: 14, borderRadius: 7, backgroundColor: NEX.cardPressed },
});
