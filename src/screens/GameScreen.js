import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { shuffleOptions, shuffleArray } from '../utils/shuffle';
import colors, { fonts, spacing, radius } from '../theme/colors';
import { LEVEL_LABELS, getLevelFromCorrect, LEVELS, POINTS_PER_CORRECT } from '../utils/levels';
import Button from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import IconMapper from '../utils/IconMapper';
import ScreenBackground from '../components/ui/ScreenBackground';

const QUESTIONS_PER_GAME = 10;

const CATEGORY_COLORS = {
  deportes:    colors.palette.azul,
  folklore:    colors.palette.rojo,
  gastronomia: colors.palette.naranja,
  geografia:   colors.palette.verde,
  historia:    colors.palette.morado,
  musica:      colors.palette.amarillo,
  naturaleza:  colors.palette.verde,
  personajes:  colors.palette.naranja,
  tv:          colors.palette.rojo,
  all:         colors.palette.amarillo,
};

const BG_MAP = {
  deportes:    require('../../assets/backgrounds/game_deportes.jpg'),
  folklore:    require('../../assets/backgrounds/game_folklore.jpg'),
  gastronomia: require('../../assets/backgrounds/game_gastronomia.jpg'),
  geografia:   require('../../assets/backgrounds/game_geografia.jpg'),
  historia:    require('../../assets/backgrounds/game_historia.jpg'),
  musica:      require('../../assets/backgrounds/game_musica.jpg'),
  naturaleza:  require('../../assets/backgrounds/game_naturaleza.jpg'),
  personajes:  require('../../assets/backgrounds/game_personajes.jpg'),
  tv:          require('../../assets/backgrounds/game_tv.jpg'),
  all:         null,  // pendiente — usará fondo beige por ahora
};

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
  const catColor = CATEGORY_COLORS[category.id] || colors.palette.amarillo;
  const currentLevelInfo = colors.level[userLevel] || colors.level.basico;
  const questionLevelInfo = colors.level[q.level] || colors.level.basico;
  const isLast = currentIdx + 1 >= questions.length;

  const bg = BG_MAP[category?.id] ?? null;

  return (
    <ScreenBackground backgroundSource={bg} overlayOpacity={0.15}>
      {/* Header: paddingTop dinámico — el fondo del header cubre el notch */}
      <View style={[styles.header, { paddingTop: insets.top + 10, marginTop: -insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.exitBtn}>
          <Ionicons name="close" size={26} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.catTitleContainer}>
            <IconMapper iconName={category.icon} color={colors.textPrimary} size={18} />
            <Text style={styles.catName}>{category.name}</Text>
          </View>
          <Text style={styles.qCounter}>{currentIdx + 1} / {questions.length}</Text>
        </View>
        <View style={[styles.levelPill, { backgroundColor: currentLevelInfo.bg }]}>
          <Text style={[styles.levelPillText, { color: currentLevelInfo.text }]}>{LEVEL_LABELS[userLevel]}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, {
          width: `${((currentIdx) / questions.length) * 100}%`,
          backgroundColor: catColor.bg,
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

          {/* Level badge + Question */}
          <View style={styles.questionCard}>
            <View style={[styles.levelBadge, { backgroundColor: questionLevelInfo.bg }]}>
              <Text style={[styles.levelBadgeText, { color: questionLevelInfo.text }]}>
                {LEVEL_LABELS[q.level]}
              </Text>
            </View>
            <Text style={styles.qText}>{q.text}</Text>
          </View>

          {/* Options */}
          {shuffled && shuffled.shuffledOptions.map((opt, idx) => {
            let isCorrect = idx === shuffled.correctShuffledIndex;
            let isSelected = idx === selected;
            
            let currentBg = colors.bgCard;
            let currentBorder = catColor.bg;
            let finalOpacity = answered && !isSelected && !isCorrect ? 0.5 : 1;

            if (answered) {
              if (isCorrect) currentBg = colors.palette.verde.bg;
              else if (isSelected) currentBg = colors.palette.rojo.bg;
            }

            return (
              <View
                key={idx}
                style={[styles.optionWrapper, { opacity: finalOpacity }]}
              >
                <View style={[styles.optionShadow, { backgroundColor: catColor.dark }]} />
                <TouchableOpacity
                  style={[
                    styles.optionBody,
                    { backgroundColor: currentBg, borderColor: currentBorder }
                  ]}
                  onPress={() => handleOption(idx)}
                  activeOpacity={answered ? 1 : 0.85}
                >
                  <View style={[styles.optLetter, { backgroundColor: catColor.bg }]}>
                    <Text style={[styles.optLetterText, { color: catColor.text }]}>
                      {['A', 'B', 'C', 'D'][idx]}
                    </Text>
                  </View>
                  <Text style={styles.optText}>{opt}</Text>
                  
                  {answered && isCorrect && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.palette.verde.text} style={styles.feedbackIcon} />
                  )}
                  {answered && isSelected && !isCorrect && (
                    <Ionicons name="close-circle" size={24} color={colors.palette.rojo.text} style={styles.feedbackIcon} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

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
              <Button 
                label={isLast ? 'Ver Resultados' : 'Siguiente'} 
                variant="primary" 
                icon="arrow-forward-outline" 
                iconPosition="right"
                onPress={handleNext} 
                fullWidth 
              />
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </ScreenBackground>
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
    backgroundColor: colors.surface,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  exitBtn: { padding: 4 },
  headerCenter: { alignItems: 'center' },
  catTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catName: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: 16 },
  qCounter: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  levelPill: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  levelPillText: { fontFamily: fonts.bold, fontSize: 11 },

  progressBar: { height: 4, backgroundColor: colors.border },
  progressFill: { height: '100%', borderRadius: radius.full },

  scroll: { padding: spacing.md, paddingBottom: 60 },
  scoreMini: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreMiniText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 13 },

  qImage: { width: '100%', height: 180, borderRadius: radius.lg, marginBottom: spacing.md },

  questionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  levelBadge: { alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm },
  levelBadgeText: { fontFamily: fonts.bold, fontSize: 11 },

  qText: {
    fontFamily: fonts.bold, color: colors.textPrimary, fontSize: 20,
    lineHeight: 30, marginBottom: 0,
  },

  optionWrapper: {
    paddingBottom: 4,
    marginBottom: spacing.sm,
  },
  optionShadow: {
    ...StyleSheet.absoluteFillObject,
    top: 4,
    borderRadius: radius.md,
  },
  optionBody: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 2, padding: spacing.md,
  },
  optLetter: { width: 32, height: 32, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  optLetterText: { fontFamily: fonts.bold, fontSize: 14 },
  optText: { fontFamily: fonts.bold, color: colors.textPrimary, fontSize: 15, flex: 1 },
  feedbackIcon: { marginLeft: spacing.sm },

  feedback: { marginTop: spacing.md },
  feedbackCorrect: { fontFamily: fonts.bold, color: colors.success, fontSize: 16, marginBottom: spacing.md, textAlign: 'center' },
  feedbackWrong: { fontFamily: fonts.bold, color: colors.error, fontSize: 14, marginBottom: spacing.md, textAlign: 'center' },
});
