import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, getDocs, orderBy, query, where, doc, getDoc, documentId } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing, radius, levelColors } from '../theme/colors';
import { LEVEL_LABELS } from '../utils/levels';
import ScreenBackground from '../components/ui/ScreenBackground';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

// Safe helpers — mantiene compatibilidad con niveles
const FALLBACK_COLOR = '#2ECC71';
const safeLevel = (v) => (v && levelColors[v.toLowerCase()] ? v.toLowerCase() : 'basico');
const safeLevelColor = (v) => levelColors[safeLevel(v)] || FALLBACK_COLOR;

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scope, setScope] = useState('global');

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      if (scope === 'global') {
        const q = query(collection(db, 'users'), orderBy('points', 'desc'));
        const snapshot = await getDocs(q);
        const all = snapshot.docs
          .map(d => ({ uid: d.id, ...d.data() }))
          .filter(u => u.role !== 'admin' && !u.isAdmin);
        setUsers(all);
      } else if (scope === 'friends') {
        if (!user?.uid) {
          setLoading(false);
          return;
        }

        // Obtener el documento del usuario actual y su array friends (con fallback)
        const currentUserRef = doc(db, 'users', user.uid);
        const currentUserSnap = await getDoc(currentUserRef);
        if (!currentUserSnap.exists()) {
          setUsers([]);
          return;
        }
        const currentUserData = currentUserSnap.data();
        const friendsArray = currentUserData.friends || [];

        // Si no tiene amigos, incluir solo al usuario actual
        const idsToFetch = [user.uid, ...friendsArray];

        if (idsToFetch.length === 1) {
          // Solo el usuario actual
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const all = userDoc.exists()
            ? [{ uid: userDoc.id, ...userDoc.data() }].filter(u => u.role !== 'admin' && !u.isAdmin)
            : [];
          setUsers(all);
          return;
        }

        // Dividir en chunks de 30 (límite de Firebase 'in')
        const chunkSize = 30;
        const chunks = [];
        for (let i = 0; i < idsToFetch.length; i += chunkSize) {
          chunks.push(idsToFetch.slice(i, i + chunkSize));
        }

        const allUsers = [];
        for (const chunk of chunks) {
          const q = query(collection(db, 'users'), where(documentId(), 'in', chunk));
          const snapshot = await getDocs(q);
          snapshot.forEach(docSnap => {
            allUsers.push({ uid: docSnap.id, ...docSnap.data() });
          });
        }

        // Filtrar admins, agregar usuario actual si no está incluido, ordenar por puntos
        const filtered = allUsers.filter(u => u.role !== 'admin' && !u.isAdmin);
        const sorted = filtered.sort((a, b) => (b.points || 0) - (a.points || 0));
        setUsers(sorted);
      }
    } catch (e) {
      console.error('Error cargando ranking:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [scope]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  };

  const medals = [
    { icon: 'trophy', color: colors.palette.amarillo.text },
    { icon: 'medal', color: colors.palette.azul.text },
    { icon: 'ribbon', color: colors.palette.rojo.text }
  ];

  const renderItem = ({ item, index }) => {
    const isMe = item.uid === user?.uid;
    const lc = safeLevelColor(item.level);
    const levelKey = safeLevel(item.level);
    const levelColorObj = colors.level[levelKey] || colors.level.basico;

    return (
      <Card
        accentColor={levelColorObj.text}
        style={[styles.rowCard, isMe && styles.rowMe]}
        onPress={() => navigation.navigate('UserProfile', { userId: item.uid })}
      >
        <View style={styles.rowContent}>
          <View style={styles.rankContainer}>
            {index < 3 ? (
              <Ionicons
                name={medals[index].icon}
                size={24}
                color={medals[index].color}
              />
            ) : (
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            )}
          </View>

          <View style={[styles.avatar, { borderColor: levelColorObj.text }]}>
            <Text style={styles.avatarLetter}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>

          <View style={styles.info}>
            <Text style={[styles.name, isMe && { color: colors.palette.amarillo.text }]}>
              {item.name} {isMe ? '(Tú)' : ''}
            </Text>
            <View style={[styles.levelPill, { backgroundColor: levelColorObj.bg + '40' }]}>
              <Text style={[styles.levelText, { color: levelColorObj.text }]}>
                {LEVEL_LABELS[levelKey]}
              </Text>
            </View>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={styles.score}>{item.points || 0}</Text>
            <Text style={styles.pts}>pts</Text>
          </View>
        </View>
      </Card>
    );
  };

  const categories = [
    { id: 'global', label: 'Global', icon: 'globe-outline' },
    { id: 'friends', label: 'Mis Amigos', icon: 'people-outline' }
  ];

  return (
    <ScreenBackground>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
        <View style={styles.headerTitleRow}>
          <View style={styles.titleContainer}>
            <Ionicons name="trophy" size={28} color={colors.palette.amarillo.text} />
            <Text style={styles.headerTitle}>Ranking</Text>
          </View>
          {/* Botón eliminado - se migra a ManageFriendsScreen */}
        </View>
        <Text style={styles.headerSub}>Los mejores trivieros venezolanos</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setScope(cat.id)}
              style={[
                styles.categoryTab,
                scope === cat.id && styles.categoryTabActive
              ]}
            >
              <Ionicons
                name={cat.icon}
                size={16}
                color={scope === cat.id ? colors.palette.amarillo.text : colors.textMuted}
                style={styles.categoryIcon}
              />
              <Text style={[
                styles.categoryLabel,
                scope === cat.id && styles.categoryLabelActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.palette.amarillo.text} size="large" />
      ) : users.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Aún no hay jugadores registrados.</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={i => i.uid}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.palette.amarillo.text]}
            />
          }
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    color: colors.textPrimary
  },
  headerSub: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.md
  },
  categoriesScroll: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoriesContainer: {
    paddingRight: spacing.md,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginRight: spacing.sm,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryTabActive: {
    backgroundColor: colors.palette.amarillo.bg + '40',
    borderColor: colors.palette.amarillo.text,
  },
  categoryIcon: {
    marginRight: spacing.xs,
  },
  categoryLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  categoryLabelActive: {
    color: colors.palette.amarillo.text,
    fontFamily: fonts.semiBold,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 100
  },
  rowCard: {
    marginBottom: spacing.sm,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textSecondary,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: colors.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginLeft: spacing.sm,
  },
  avatarLetter: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: fonts.semiBold,
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: 2
  },
  levelPill: {
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2
  },
  levelText: {
    fontFamily: fonts.medium,
    fontSize: 11
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontFamily: fonts.bold,
    color: colors.palette.amarillo.text,
    fontSize: 18
  },
  pts: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
    fontSize: 12
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  emptyText: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: spacing.md,
  },
  rowMe: {
    borderLeftWidth: 4,
    borderLeftColor: colors.palette.amarillo.text,
  },
});
