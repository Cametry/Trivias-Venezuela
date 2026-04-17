import React, { useEffect, useState, useCallback, useRef } from 'react';
import { BlurView } from 'expo-blur';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal, Animated, Dimensions, Pressable, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getCategories } from '../services/storage';
import { colors, fonts, spacing, radius, categoryColors, levelColors } from '../theme/colors';
import { LEVEL_LABELS, getLevelFromCorrect, getQuestionsInLevel, QUESTIONS_PER_LEVEL } from '../utils/levels';

// Safe helpers — prevents undefined from reaching LinearGradient
const FALLBACK_COLOR = '#2ECC71';
const safeLevel = (v) => (v && levelColors[v.toLowerCase()] ? v.toLowerCase() : 'basico');
const safeLevelColor = (v) => levelColors[safeLevel(v)] || FALLBACK_COLOR;

function SideDrawer({ visible, onClose, side = 'left', children }) {
  const [show, setShow] = useState(visible);
  const slideAnim = useRef(new Animated.Value(side === 'left' ? -500 : 500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: side === 'left' ? -500 : 500, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
      ]).start(() => setShow(false));
    }
  }, [visible, side, slideAnim, fadeAnim]);

  if (!show) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999, elevation: 10 }]}>
      {/* Fondo oscuro y borroso */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          {Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
          ) : (
            <BlurView intensity={5} tint="dark" style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView" />
          )}
        </Pressable>
      </Animated.View>

      {/* El Cajón Deslizable */}
      <Animated.View style={{
        position: 'absolute',
        top: 0, bottom: 0,
        [side]: 0,
        width: '75%',
        maxWidth: 320, // Previene que sea gigante en tablets/web
        backgroundColor: colors.bgCard,
        borderRightWidth: side === 'left' ? 1 : 0,
        borderLeftWidth: side === 'right' ? 1 : 0,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        transform: [{ translateX: slideAnim }]
      }}>
        {children}
      </Animated.View>
    </View>
  );
}

function ScoreBar({ user, paddingTop, pendingRequests, onOpenMenu, onOpenNotifications }) {
  const navigation = useNavigation();
  const level = safeLevel(user.level);
  const lc = safeLevelColor(user.level);
  return (
    <LinearGradient colors={[colors.surface, colors.bgCard]} style={[styles.scoreBar, { paddingTop }]}>
      <View style={styles.scoreLeft}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.iconBtn}>
          <Text style={{ fontSize: 24, color: colors.textPrimary }}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.scorePts}>⭐ {user.points || 0} pts</Text>
        <View style={[styles.levelBadge, { backgroundColor: lc + '30', borderColor: lc }]}>
          <Text style={[styles.levelText, { color: lc }]}>{LEVEL_LABELS[level]}</Text>
        </View>
      </View>
      <View style={styles.scoreRight}>
        <TouchableOpacity onPress={onOpenNotifications} style={styles.iconBtn}>
          <Text style={{ fontSize: 22 }}>🔔</Text>
          {pendingRequests > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{pendingRequests}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function CategoryCard({ cat, onPress }) {
  const bgColor = (categoryColors[cat.id] || colors.azul) + '18';
  const border = categoryColors[cat.id] || colors.azul;
  return (
    <TouchableOpacity onPress={onPress} style={[styles.catCard, { backgroundColor: bgColor, borderColor: border + '55' }]}>
      <Text style={styles.catIcon}>{cat.icon}</Text>
      <Text style={styles.catName}>{cat.name}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);

  const load = useCallback(async () => {
    const cats = await getCategories();
    setCategories(cats);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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

  const startGame = (category) => {
    navigation.navigate('Game', { category });
  };

  return (
    <View style={styles.root}>
      {/* El paddingTop va SOLO en el ScoreBar (header), no en el root */}
      <ScoreBar 
        user={user} 
        paddingTop={insets.top + 10} 
        pendingRequests={pendingRequests} 
        onOpenMenu={() => setMenuVisible(true)}
        onOpenNotifications={() => setNotifVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, <Text style={styles.name}>{user.name}</Text> 👋</Text>
        </View>

        <Text style={styles.sectionTitle}>Elige una categoría</Text>

        {loading ? (
          <ActivityIndicator color={colors.amarillo} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.grid}>
            {categories.map(cat => (
              <CategoryCard key={cat.id} cat={cat} onPress={() => startGame(cat)} />
            ))}
          </View>
        )}

        {!loading && (
          <View style={{ marginTop: Platform.OS === 'web' ? 25 : (Platform.OS === 'android' ? -15 : 15) }}>
            <TouchableOpacity 
              style={{ backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.amarillo + '55', flexDirection: 'row', alignItems: 'center' }}
              onPress={() => startGame({ id: 'all', name: 'De todo un poco', icon: '🎲' })}
            >
              <Text style={{ fontSize: 32, marginRight: spacing.md }}>🎲</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bold, color: colors.textPrimary, fontSize: 16 }}>De todo un poco</Text>
                <Text style={{ fontFamily: fonts.regular, color: colors.textMuted, fontSize: 12 }}>Un mix de todas las categorías adaptado a tu nivel.</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Drawer Menu */}
      <SideDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} side="left">
        <View style={[styles.drawerHeader, { paddingTop: Platform.OS === 'web' ? 30 : insets.top + 10 }]}>
          <Text style={styles.drawerTitle}>Menú</Text>
        </View>
        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate('Settings');
          }}
        >
          <Text style={styles.drawerItemIcon}>⚙️</Text>
          <Text style={styles.drawerItemText}>Ajustes</Text>
        </TouchableOpacity>
      </SideDrawer>

      {/* Drawer Notifications */}
      <SideDrawer visible={notifVisible} onClose={() => setNotifVisible(false)} side="right">
        <View style={[styles.drawerHeader, { paddingTop: Platform.OS === 'web' ? 30 : insets.top + 10 }]}>
          <Text style={styles.drawerTitle}>Notificaciones</Text>
        </View>
        {pendingRequests > 0 ? (
          <TouchableOpacity 
            style={styles.notifCard}
            onPress={() => {
              setNotifVisible(false);
              navigation.navigate('ManageFriends');
            }}
          >
            <Text style={styles.notifCardText}>Tienes solicitudes de amistad pendientes</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.emptyNotifText}>No hay notificaciones nuevas</Text>
        )}
      </SideDrawer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: 100 },
  scoreBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scoreLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scorePts: { fontFamily: fonts.bold, color: colors.amarillo, fontSize: 16 },
  levelBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
  },
  levelText: { fontFamily: fonts.semiBold, fontSize: 11 },
  scoreRight: { flexDirection: 'row', gap: 15, alignItems: 'center', justifyContent: 'flex-end', flex: 1 },
  iconBtn: { padding: 4, position: 'relative' },
  notificationBadge: {
    position: 'absolute', top: -5, right: -5, width: 18, height: 18, 
    borderRadius: 9, backgroundColor: colors.rojo, justifyContent: 'center', alignItems: 'center',
  },
  notificationText: { color: '#fff', fontSize: 10, fontFamily: fonts.bold },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.md },
  greeting: { fontFamily: fonts.regular, color: colors.textSecondary, fontSize: 16 },
  name: { fontFamily: fonts.bold, color: colors.textPrimary },
  sectionTitle: { fontFamily: fonts.bold, color: colors.textPrimary, fontSize: 20, marginBottom: spacing.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  catCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
  },
  catIcon: { fontSize: 28, marginBottom: 6 },
  catName: { fontFamily: fonts.semiBold, color: colors.textPrimary, fontSize: 11, textAlign: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawerContainer: {
    position: 'absolute', top: 0, bottom: 0, width: '75%',
    backgroundColor: colors.bgCard,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
  drawerHeader: {
    paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.sm,
  },
  drawerTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.textPrimary },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
  },
  drawerItemIcon: { fontSize: 20, marginRight: spacing.md },
  drawerItemText: { fontFamily: fonts.medium, fontSize: 16, color: colors.textPrimary },
  notifCard: {
    margin: spacing.md, padding: spacing.md, backgroundColor: colors.bgInput,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  notifCardText: { fontFamily: fonts.medium, color: colors.textPrimary, fontSize: 14 },
  emptyNotifText: { fontFamily: fonts.regular, color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: spacing.xl },
});
