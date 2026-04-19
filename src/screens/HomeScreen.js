import React, { useEffect, useState, useCallback, useRef } from "react";
import { BlurView } from "expo-blur";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import colors, {
  fonts,
  spacing,
  radius,
  levelColors,
} from "../theme/colors";
import {
  LEVEL_LABELS,
  getLevelFromCorrect,
  getQuestionsInLevel,
  QUESTIONS_PER_LEVEL,
} from "../utils/levels";
import IconMapper from "../utils/IconMapper";

// ── Safe helpers ──────────────────────────────────────────────
const safeLevel = (v) =>
  v && levelColors[v.toLowerCase()] ? v.toLowerCase() : "basico";

// ── Helper: color de categoría ────────────────────────────────
const getCatColors = (catId) =>
  colors.category[catId] || { bg: colors.palette.azul.bg, text: colors.palette.azul.text };

// ── Helper: colores pastel por nivel ─────────────────────────
const LEVEL_PASTEL = {
  basico:     () => colors.palette.verde,
  intermedio: () => colors.palette.azul,
  avanzado:   () => colors.palette.naranja,
  experto:    () => colors.palette.rojo,
};
const getLevelPastel = (level) =>
  (LEVEL_PASTEL[safeLevel(level)] || LEVEL_PASTEL.basico)();

// =============================================================
//  SideDrawer
// =============================================================
function SideDrawer({ visible, onClose, side = "left", children }) {
  const [show, setShow] = useState(visible);
  const slideAnim = useRef(new Animated.Value(side === "left" ? -500 : 500)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const insets    = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0,   duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1,   duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: side === "left" ? -500 : 500, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0,   duration: 250, useNativeDriver: true }),
      ]).start(() => setShow(false));
    }
  }, [visible, side, slideAnim, fadeAnim]);

  if (!show) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999, elevation: 10 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          {Platform.OS === "web" ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(45,45,45,0.35)" }]} />
          ) : (
            <BlurView intensity={5} tint="light" style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView" />
          )}
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            [side]: 0,
            borderRightWidth: side === "left" ? 1 : 0,
            borderLeftWidth:  side === "right" ? 1 : 0,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// =============================================================
//  ScoreBar
// =============================================================
function ScoreBar({ user, paddingTop, pendingRequests, onOpenMenu, onOpenNotifications }) {
  const lp    = getLevelPastel(user.level);
  const level = safeLevel(user.level);

  return (
    <View style={[styles.scoreBar, { paddingTop }]}>
      <View style={styles.scoreLeft}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.iconBtn}>
          <Ionicons name="menu" size={26} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.ptsChip}>
          <Ionicons name="star" size={13} color={colors.palette.amarillo.text} />
          <Text style={styles.scorePts}>{user.points || 0} pts</Text>
        </View>

        <View style={[styles.levelBadge, { backgroundColor: lp.bg }]}>
          <Text style={[styles.levelText, { color: lp.text }]}>{LEVEL_LABELS[level]}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={onOpenNotifications} style={styles.bellBtn}>
        <Ionicons
          name={pendingRequests > 0 ? "notifications" : "notifications-outline"}
          size={24}
          color={pendingRequests > 0 ? colors.palette.rojo.text : colors.textSecondary}
        />
        {pendingRequests > 0 && (
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>{pendingRequests}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// =============================================================
//  CategoryCard — usa IconMapper con etiquetas de Firestore
// =============================================================
function CategoryCard({ cat, onPress }) {
  const cc = getCatColors(cat.id);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.catCard, { backgroundColor: cc.bg }]}
    >
      <View style={[styles.catIconWrap, { backgroundColor: cc.text + "20" }]}>
        <IconMapper iconName={cat.icon} color={cc.text} size={26} />
      </View>
      <Text style={[styles.catName, { color: cc.text }]}>{cat.name}</Text>
    </TouchableOpacity>
  );
}

// =============================================================
//  HomeScreen — lógica 100% sin cambios
// =============================================================
export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [categories,      setCategories]      = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [menuVisible,     setMenuVisible]     = useState(false);
  const [notifVisible,    setNotifVisible]    = useState(false);

  const load = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, "categories"));
      const cats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategories(cats);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "friendships"),
      where("receiverId", "==", user.uid),
      where("status", "==", "pending")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingRequests(snapshot.size);
    });
    return unsubscribe;
  }, [user]);

  if (!user) return null;

  const startGame = (category) => navigation.navigate("Game", { category });

  return (
    <View style={styles.root}>
      <ScoreBar
        user={user}
        paddingTop={insets.top + 10}
        pendingRequests={pendingRequests}
        onOpenMenu={() => setMenuVisible(true)}
        onOpenNotifications={() => setNotifVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, 👋</Text>
          <Text style={styles.name}>{user.name}</Text>
        </View>

        <Text style={styles.sectionTitle}>Elige una categoría</Text>

        {loading ? (
          <ActivityIndicator color={colors.palette.amarillo.text} size="large" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.grid}>
            {categories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} onPress={() => startGame(cat)} />
            ))}
          </View>
        )}

        {!loading && (
          <TouchableOpacity
            style={styles.allCard}
            activeOpacity={0.85}
            onPress={() => startGame({ id: "all", name: "De todo un poco", icon: "all" })}
          >
            <View style={styles.allCardIconWrap}>
              <IconMapper iconName="all" color={colors.palette.amarillo.text} size={28} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.allCardTitle}>De todo un poco</Text>
              <Text style={styles.allCardSub}>Un mix de todas las categorías adaptado a tu nivel.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.palette.amarillo.text} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Drawer Menú ── */}
      <SideDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} side="left">
        <View style={[styles.drawerHeader, { paddingTop: Platform.OS === "web" ? 30 : insets.top + 10 }]}>
          <Text style={styles.drawerTitle}>Menú</Text>
        </View>
        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => { setMenuVisible(false); navigation.navigate("Settings"); }}
        >
          <View style={[styles.drawerItemIcon, { backgroundColor: colors.palette.azul.bg }]}>
            <Ionicons name="settings" size={18} color={colors.palette.azul.text} />
          </View>
          <Text style={styles.drawerItemText}>Ajustes</Text>
        </TouchableOpacity>
      </SideDrawer>

      {/* ── Drawer Notificaciones ── */}
      <SideDrawer visible={notifVisible} onClose={() => setNotifVisible(false)} side="right">
        <View style={[styles.drawerHeader, { paddingTop: Platform.OS === "web" ? 30 : insets.top + 10 }]}>
          <Text style={styles.drawerTitle}>Notificaciones</Text>
        </View>
        {pendingRequests > 0 ? (
          <TouchableOpacity
            style={styles.notifCard}
            onPress={() => { setNotifVisible(false); navigation.navigate("ManageFriends"); }}
          >
            <Ionicons name="people" size={20} color={colors.palette.azul.text} style={{ marginBottom: 6 }} />
            <Text style={styles.notifCardText}>
              Tienes {pendingRequests} solicitud{pendingRequests > 1 ? "es" : ""} de amistad pendiente{pendingRequests > 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyNotif}>
            <Ionicons name="notifications-off-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyNotifText}>No hay notificaciones nuevas</Text>
          </View>
        )}
      </SideDrawer>
    </View>
  );
}

// =============================================================
//  Estilos
// =============================================================
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  scoreBar: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreLeft:  { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  iconBtn:    { padding: 4 },
  ptsChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.palette.amarillo.bg,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scorePts:   { fontFamily: fonts.bold, color: colors.palette.amarillo.text, fontSize: 13 },
  levelBadge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  levelText:  { fontFamily: fonts.bold, fontSize: 11 },
  bellBtn:    { padding: 6, position: "relative" },
  notifBadge: {
    position: "absolute", top: 2, right: 2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.palette.rojo.text,
    justifyContent: "center", alignItems: "center",
  },
  notifBadgeText: { color: "#fff", fontSize: 9, fontFamily: fonts.bold },

  scroll:       { padding: spacing.md, paddingBottom: 120 },
  header:       { marginTop: spacing.sm, marginBottom: spacing.lg },
  greeting:     { fontFamily: fonts.regular, color: colors.textSecondary, fontSize: 15 },
  name:         { fontFamily: fonts.extraBold, color: colors.textPrimary, fontSize: 22, marginTop: 2 },
  sectionTitle: { fontFamily: fonts.bold, color: colors.textPrimary, fontSize: 18, marginBottom: spacing.md },

  grid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: spacing.sm, justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  catCard: {
    width: "31%", aspectRatio: 1, borderRadius: radius.xl,
    justifyContent: "center", alignItems: "center", padding: spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  catIconWrap: {
    width: 46, height: 46, borderRadius: radius.lg,
    justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  catName: { fontFamily: fonts.bold, fontSize: 11, textAlign: "center" },

  allCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.xxl,
    padding: spacing.md, flexDirection: "row", alignItems: "center",
    gap: spacing.md, borderWidth: 2, borderColor: colors.palette.amarillo.bg,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3, marginTop: spacing.sm,
  },
  allCardIconWrap: {
    width: 54, height: 54, borderRadius: radius.xl,
    backgroundColor: colors.palette.amarillo.bg,
    justifyContent: "center", alignItems: "center",
  },
  allCardTitle: { fontFamily: fonts.bold, color: colors.textPrimary, fontSize: 16, marginBottom: 3 },
  allCardSub:   { fontFamily: fonts.regular, color: colors.textMuted, fontSize: 12, lineHeight: 17 },

  drawer: {
    position: "absolute", top: 0, bottom: 0,
    width: "75%", maxWidth: 320,
    backgroundColor: colors.bgCard, borderColor: colors.border,
    paddingHorizontal: spacing.md,
    shadowColor: "#000", shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.10, shadowRadius: 16, elevation: 10,
  },
  drawerHeader: {
    paddingHorizontal: spacing.sm, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.sm,
  },
  drawerTitle:    { fontFamily: fonts.extraBold, fontSize: 22, color: colors.textPrimary },
  drawerItem:     { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, paddingHorizontal: spacing.sm, gap: spacing.md, borderRadius: radius.lg },
  drawerItemIcon: { width: 38, height: 38, borderRadius: radius.md, justifyContent: "center", alignItems: "center" },
  drawerItemText: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.textPrimary },

  notifCard:     { margin: spacing.sm, padding: spacing.md, backgroundColor: colors.palette.azul.bg, borderRadius: radius.xl },
  notifCardText: { fontFamily: fonts.semiBold, color: colors.palette.azul.text, fontSize: 14, lineHeight: 20 },
  emptyNotif:    { alignItems: "center", marginTop: 48, gap: spacing.sm },
  emptyNotifText:{ fontFamily: fonts.regular, color: colors.textMuted, fontSize: 14, textAlign: "center" },
});
