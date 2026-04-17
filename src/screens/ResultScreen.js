import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius, categoryColors } from '../theme/colors';

export default function ResultScreen({ route, navigation }) {
  const { category, totalQuestions, correctCount, score } = route.params;
  const insets = useSafeAreaInsets();
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const accentColor = categoryColors[category.id] || colors.azul;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const emoji = percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '📚';
  const msg = percentage >= 80 ? '¡Excelente!' : percentage >= 50 ? '¡Buen trabajo!' : 'Sigue practicando';

  return (
    // El fondo del gradient llega al borde físico
    <LinearGradient colors={[colors.gradStart, colors.gradEnd]} style={styles.gradient}>
      {/* paddingTop dinámico en el container para que el contenido central respete el notch */}
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.title}>{msg}</Text>
          <Text style={styles.catName}>{category.icon} {category.name}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.amarillo }]}>{score}</Text>
              <Text style={styles.statLabel}>Puntos</Text>
            </View>
            <View style={[styles.divider]} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.success }]}>{correctCount}</Text>
              <Text style={styles.statLabel}>Correctas</Text>
            </View>
            <View style={[styles.divider]} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.error }]}>{totalQuestions - correctCount}</Text>
              <Text style={styles.statLabel}>Incorrectas</Text>
            </View>
          </View>

          {/* Circle percentage */}
          <View style={[styles.circleWrap, { borderColor: accentColor }]}>
            <Text style={[styles.circleNum, { color: accentColor }]}>{percentage}%</Text>
            <Text style={styles.circleLabel}>Aciertos</Text>
          </View>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('Game', { category })}
          >
            <LinearGradient
              colors={[accentColor, accentColor + 'BB']}
              style={styles.btnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>🔄 Jugar de nuevo</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Main')}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>← Categorías</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emoji: { fontSize: 56, marginBottom: spacing.sm },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.textPrimary, marginBottom: 4 },
  catName: { fontFamily: fonts.medium, color: colors.textSecondary, fontSize: 15, marginBottom: spacing.lg },

  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  stat: { alignItems: 'center', paddingHorizontal: spacing.lg },
  statNum: { fontFamily: fonts.bold, fontSize: 28 },
  statLabel: { fontFamily: fonts.regular, color: colors.textMuted, fontSize: 12 },
  divider: { width: 1, height: 40, backgroundColor: colors.border },

  circleWrap: {
    width: 110, height: 110, borderRadius: 55, borderWidth: 4,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl,
  },
  circleNum: { fontFamily: fonts.bold, fontSize: 30 },
  circleLabel: { fontFamily: fonts.regular, color: colors.textMuted, fontSize: 11 },

  btn: { width: '100%', borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.md },
  btnGrad: { padding: spacing.md + 2, alignItems: 'center' },
  btnText: { fontFamily: fonts.bold, color: '#fff', fontSize: 16 },
  linkBtn: { marginTop: 4 },
  linkText: { fontFamily: fonts.medium, color: colors.textSecondary, fontSize: 14 },
});
