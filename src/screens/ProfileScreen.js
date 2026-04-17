import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing, radius, levelColors } from '../theme/colors';
import {
  LEVEL_LABELS, LEVEL_DESCRIPTIONS, LEVELS,
  getLevelFromCorrect, getQuestionsInLevel, QUESTIONS_PER_LEVEL,
} from '../utils/levels';

// Safe helpers — prevents undefined from reaching LinearGradient
const FALLBACK_COLOR = '#2ECC71';
const safeLevel = (v) => (v && levelColors[v.toLowerCase()] ? v.toLowerCase() : 'basico');
const safeLevelColor = (v) => levelColors[safeLevel(v)] || FALLBACK_COLOR;

export default function ProfileScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'friendships'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingRequests(snapshot.size);
    });

    return unsubscribe;
  }, [user]);

  if (!user) return null;

  const level = safeLevel(user.level);
  const inLevel = getQuestionsInLevel(user.questionsAnswered || 0);
  const progress = inLevel / QUESTIONS_PER_LEVEL;
  const lcolor = safeLevelColor(user.level);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 10 }]}>
        {/* Avatar card — el paddingTop del scroll hace que el contenido respete el notch */}
        <LinearGradient
          colors={[lcolor + '30', colors.bgCard]}
          style={styles.profileCard}
        >
          <View style={[styles.avatar, { borderColor: lcolor }]}>
            <Text style={styles.avatarLetter}>{user.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.displayName}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={[styles.levelBadgeLg, { backgroundColor: lcolor + '25', borderColor: lcolor }]}>
            <Text style={[styles.levelBadgeTxt, { color: lcolor }]}>
              {LEVEL_LABELS[level]} • {LEVEL_DESCRIPTIONS[level]}
            </Text>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Puntos', val: user.points || 0, color: colors.amarillo },
            { label: 'Correctas', val: user.questionsAnswered || 0, color: colors.success },
          ].map(({ label, val, color }) => (
            <View key={label} style={styles.statCard}>
              <Text style={[styles.statNum, { color }]}>{val}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.friendsButton}
          onPress={() => navigation.navigate('ManageFriends')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, marginRight: 8, transform: [{ translateY: -2 }] }}>👥</Text>
            <Text style={styles.friendsButtonText}>Mis Amigos</Text>
          </View>
          {pendingRequests > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRequests}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Level progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progreso de nivel</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>{inLevel} / {QUESTIONS_PER_LEVEL} respuestas correctas</Text>
            <Text style={[styles.progressPct, { color: lcolor }]}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: lcolor }]} />
          </View>

          {/* Level roadmap */}
          <View style={styles.roadmap}>
            {LEVELS.map((lv, i) => {
              const reached = LEVELS.indexOf(level) >= i;
              const lc = levelColors[lv] || FALLBACK_COLOR;
              return (
                <View key={lv} style={styles.roadmapItem}>
                  <View style={[styles.dot, { backgroundColor: reached ? lc : colors.border, borderColor: lc }]} />
                  <Text style={[styles.dotLabel, { color: reached ? lc : colors.textMuted }]}>
                    {LEVEL_LABELS[lv]}
                  </Text>
                  {i < LEVELS.length - 1 && (
                    <View style={[styles.connector, { backgroundColor: reached ? lc + '60' : colors.border }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: 80 },

  profileCard: {
    borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center',
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 3,
    backgroundColor: colors.bgInput, justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarLetter: { fontFamily: fonts.bold, fontSize: 32, color: colors.textPrimary },
  displayName: { fontFamily: fonts.bold, fontSize: 22, color: colors.textPrimary, marginBottom: 4 },
  email: { fontFamily: fonts.regular, color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm },
  levelBadgeLg: { borderRadius: radius.full, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 5 },
  levelBadgeTxt: { fontFamily: fonts.semiBold, fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statNum: { fontFamily: fonts.bold, fontSize: 28 },
  statLabel: { fontFamily: fonts.regular, color: colors.textMuted, fontSize: 12 },

  friendsButton: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendsButtonText: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 16,
  },
  badge: {
    backgroundColor: colors.rojo,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 10,
  },
  badgeText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 12,
  },

  section: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontFamily: fonts.bold, color: colors.textPrimary, fontSize: 16, marginBottom: spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontFamily: fonts.regular, color: colors.textMuted, fontSize: 13 },
  progressPct: { fontFamily: fonts.bold, fontSize: 13 },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden', marginBottom: spacing.lg },
  progressFill: { height: '100%', borderRadius: radius.full },

  roadmap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roadmapItem: { alignItems: 'center', flex: 1, position: 'relative' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, marginBottom: 4 },
  dotLabel: { fontFamily: fonts.medium, fontSize: 10, textAlign: 'center' },
  connector: { position: 'absolute', top: 7, left: '60%', right: 0, height: 2 },

});
