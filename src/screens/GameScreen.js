import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { shuffleOptions, shuffleArray } from '../utils/shuffle';
import { colors, fonts, spacing, radius, levelColors, categoryColors } from '../theme/colors';
import { LEVEL_LABELS, getLevelFromCorrect, LEVELS } from '../utils/levels';
import { POINTS_PER_CORRECT } from '../utils/levels';

const QUESTIONS_PER_GAME = 10;

export default function GameScreen({ route, navigation }) {
  const { category } = route.params;
  const { user, addScore } = useAuth();
  const insets = useSafeAreaInsets();

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [shuffled, setShuffled] = useState(null);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const userLevel = user?.level || 'basico';

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      // 1. Calcular los niveles permitidos (el nivel actual y todos los inferiores)
      const userLevelIdx = LEVELS.indexOf(userLevel) >= 0 ? LEVELS.indexOf(userLevel) : 0;
      const allowedLevels = LEVELS.slice(0, userLevelIdx + 1); // Ej: ['basico', 'intermedio']

      // 2. Construir la consulta de Firebase condicionalmente
      const queryConstraints = [where('level', 'in', allowedLevels)];
      
      // Si no es el modo 'all' (De todo un poco), filtramos por categoría
      if (category.id !== 'all') {
        queryConstraints.push(where('categoryId', '==', category.id));
      }

      const q = query(collection(db, 'questions'), ...queryConstraints);
      const snapshot = await getDocs(q);
      const pool = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 3. Mezclar aleatoriamente y seleccionar las preguntas
      const selected = shuffleArray(pool).slice(0, QUESTIONS_PER_GAME);
      setQuestions(selected);
    } catch (e) {
      console.error('Error cargando preguntas desde Firestore:', e);
    } finally {
      setLoading(false);
      animateIn();
    }
  };

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (questions.length > 0 && questions[currentIdx]) {
      const q = questions[currentIdx];
      setShuffled(shuffleOptions(q.options, q.correctIndex));
      setSelected(null);
      setAnswered(false);
      animateIn();
    }
  }, [currentIdx, questions]);

  const handleOption = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === shuffled.correctShuffledIndex;
    if (isCorrect) {
      setCorrectCount(c => c + 1);
      setScore(s => s + POINTS_PER_CORRECT);
    }
  };

  const handleNext = async () => {
    if (currentIdx + 1 >= questions.length) {
      // Game over
      await addScore(score, correctCount);
      navigation.replace('Result', {
        category,
        totalQuestions: questions.length,
        correctCount,
        score,
      });
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.amarillo} />
        <Text style={styles.loadingText}>Cargando preguntas…</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyText}>No hay preguntas en esta categoría todavía.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const q = questions[currentIdx];
  const accentColor = categoryColors[category.id] || colors.amarillo;
  const isLast = currentIdx + 1 >= questions.length;

  const getOptionStyle = (idx) => {
    if (!answered) return [styles.option, { borderColor: accentColor + '55' }];
    if (idx === shuffled.correctShuffledIndex) return [styles.option, styles.optCorrect];
    if (idx === selected && idx !== shuffled.correctShuffledIndex) return [styles.option, styles.optWrong];
    return [styles.option, { borderColor: colors.border, opacity: 0.5 }];
  };

  return (
    <View style={styles.root}>
      {/* Header: paddingTop dinámico — el fondo del header cubre el notch */}
      <LinearGradient colors={[colors.surface, colors.bg]} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.exitBtn}>
          <Text style={styles.exitText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.catName}>{category.icon} {category.name}</Text>
          <Text style={styles.qCounter}>{currentIdx + 1} / {questions.length}</Text>
        </View>
        <View style={[styles.levelPill, { borderColor: levelColors[userLevel] }]}>
          <Text style={[styles.levelPillText, { color: levelColors[userLevel] }]}>{LEVEL_LABELS[userLevel]}</Text>
        </View>
      </LinearGradient>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, {
          width: `${((currentIdx) / questions.length) * 100}%`,
          backgroundColor: accentColor,
        }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Score mini */}
          <View style={styles.scoreMini}>
            <Text style={styles.scoreMiniText}>⭐ {score} pts  |  ✓ {correctCount} correctas</Text>
          </View>

          {/* Image (if any) */}
          {q.imageUrl ? (
            <Image source={{ uri: q.imageUrl }} style={styles.qImage} resizeMode="cover" />
          ) : null}

          {/* Level badge */}
          <View style={[styles.levelBadge, { backgroundColor: levelColors[q.level] + '25' }]}>
            <Text style={[styles.levelBadgeText, { color: levelColors[q.level] }]}>
              {LEVEL_LABELS[q.level]}
            </Text>
          </View>

          {/* Question */}
          <Text style={styles.qText}>{q.text}</Text>

          {/* Options */}
          {shuffled && shuffled.shuffledOptions.map((opt, idx) => (
            <TouchableOpacity
              key={idx}
              style={getOptionStyle(idx)}
              onPress={() => handleOption(idx)}
              activeOpacity={0.85}
            >
              <View style={[styles.optLetter, { backgroundColor: accentColor + '30' }]}>
                <Text style={[styles.optLetterText, { color: accentColor }]}>
                  {['A', 'B', 'C', 'D'][idx]}
                </Text>
              </View>
              <Text style={styles.optText}>{opt}</Text>
              {answered && idx === shuffled.correctShuffledIndex && (
                <Text style={styles.checkmark}>✓</Text>
              )}
              {answered && idx === selected && idx !== shuffled.correctShuffledIndex && (
                <Text style={styles.cross}>✗</Text>
              )}
            </TouchableOpacity>
          ))}

          {/* Feedback + Next */}
          {answered && (
            <Animated.View style={styles.feedback}>
              {selected === shuffled.correctShuffledIndex ? (
                <Text style={styles.feedbackCorrect}>🎉 ¡Correcto! +{POINTS_PER_CORRECT} pts</Text>
              ) : (
                <Text style={styles.feedbackWrong}>
                  ❌ Incorrecto. La respuesta era: {shuffled.shuffledOptions[shuffled.correctShuffledIndex]}
                </Text>
              )}
              <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
                <LinearGradient
                  colors={[accentColor, accentColor + 'CC']}
                  style={styles.nextGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.nextText}>{isLast ? 'Ver Resultados →' : 'Siguiente →'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loadingText: { color: colors.textSecondary, fontFamily: fonts.regular, marginTop: spacing.md },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { color: colors.textSecondary, fontFamily: fonts.regular, textAlign: 'center', marginBottom: spacing.lg },
  backBtn: { backgroundColor: colors.azul, padding: spacing.md, borderRadius: radius.md },
  backBtnText: { color: '#fff', fontFamily: fonts.bold },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
  },
  exitBtn: { padding: 8 },
  exitText: { color: colors.textMuted, fontSize: 18, fontFamily: fonts.bold },
  headerCenter: { alignItems: 'center' },
  catName: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: 15 },
  qCounter: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
  levelPill: { borderRadius: radius.full, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  levelPillText: { fontFamily: fonts.semiBold, fontSize: 11 },

  progressBar: { height: 3, backgroundColor: colors.border },
  progressFill: { height: '100%', borderRadius: radius.full },

  scroll: { padding: spacing.md, paddingBottom: 60 },
  scoreMini: { alignSelf: 'center', marginBottom: spacing.sm },
  scoreMiniText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 13 },

  qImage: { width: '100%', height: 180, borderRadius: radius.lg, marginBottom: spacing.md },

  levelBadge: { alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3, marginBottom: spacing.sm },
  levelBadgeText: { fontFamily: fonts.semiBold, fontSize: 11 },

  qText: {
    fontFamily: fonts.bold, color: colors.textPrimary, fontSize: 20,
    lineHeight: 30, marginBottom: spacing.lg,
  },

  option: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1.5, padding: spacing.md, marginBottom: spacing.sm,
  },
  optCorrect: { borderColor: colors.success, backgroundColor: colors.success + '18' },
  optWrong: { borderColor: colors.error, backgroundColor: colors.error + '18' },
  optLetter: { width: 32, height: 32, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  optLetterText: { fontFamily: fonts.bold, fontSize: 14 },
  optText: { fontFamily: fonts.medium, color: colors.textPrimary, fontSize: 15, flex: 1 },
  checkmark: { color: colors.success, fontSize: 18, fontFamily: fonts.bold },
  cross: { color: colors.error, fontSize: 18, fontFamily: fonts.bold },

  feedback: { marginTop: spacing.md },
  feedbackCorrect: { fontFamily: fonts.bold, color: colors.success, fontSize: 16, marginBottom: spacing.md, textAlign: 'center' },
  feedbackWrong: { fontFamily: fonts.medium, color: colors.error, fontSize: 14, marginBottom: spacing.md, textAlign: 'center' },
  nextBtn: { borderRadius: radius.md, overflow: 'hidden' },
  nextGrad: { padding: spacing.md + 2, alignItems: 'center' },
  nextText: { fontFamily: fonts.bold, color: '#fff', fontSize: 16 },
});
