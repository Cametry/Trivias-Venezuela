import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radius } from '../theme/colors';
import Button from '../components/ui/Button';
import IconMapper from '../utils/IconMapper';

export default function ResultScreen({ route, navigation }) {
  const { category, totalQuestions, correctCount, score } = route.params;
  const insets = useSafeAreaInsets();
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const cc = colors.category[category.id] || colors.palette.azul;

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
    <View style={[styles.container, { paddingTop: insets.top + 10, backgroundColor: colors.bg }]}>
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{msg}</Text>
        <View style={styles.categoryRow}>
          <IconMapper iconName={category.icon} color={cc.text} size={26} />
          <Text style={styles.catName}> {category.name}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.palette.amarillo.text }]}>{score}</Text>
            <Text style={styles.statLabel}>Puntos</Text>
          </View>
          <View style={[styles.divider]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.palette.verde.text }]}>{correctCount}</Text>
            <Text style={styles.statLabel}>Correctas</Text>
          </View>
          <View style={[styles.divider]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.palette.rojo.text }]}>{totalQuestions - correctCount}</Text>
            <Text style={styles.statLabel}>Incorrectas</Text>
          </View>
        </View>

        {/* Circle percentage */}
        <View style={[styles.circleWrap, { borderColor: cc.text }]}>
          <Text style={[styles.circleNum, { color: cc.text }]}>{percentage}%</Text>
          <Text style={styles.circleLabel}>Aciertos</Text>
        </View>

        <Button
          label="Jugar de nuevo"
          variant="primary"
          icon="refresh-outline"
          onPress={() => navigation.navigate('Game', { category })}
          style={{ marginBottom: spacing.md }}
        />

        <Button
          label="Volver"
          variant="secondary"
          onPress={() => navigation.navigate('Main')}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  catName: { fontFamily: fonts.medium, color: colors.textSecondary, fontSize: 15, marginLeft: 8 },

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

});
