import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, orderBy, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing, radius, levelColors } from '../theme/colors';
import { LEVEL_LABELS } from '../utils/levels';

// Safe helpers — prevents undefined from reaching LinearGradient
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
        
        const qReq = query(collection(db, 'friendships'), where('requesterId', '==', user.uid), where('status', '==', 'accepted'));
        const qRec = query(collection(db, 'friendships'), where('receiverId', '==', user.uid), where('status', '==', 'accepted'));
        const [snapReq, snapRec] = await Promise.all([getDocs(qReq), getDocs(qRec)]);
        
        const friendIds = new Set();
        friendIds.add(user.uid);
        
        snapReq.docs.forEach(d => friendIds.add(d.data().receiverId));
        snapRec.docs.forEach(d => friendIds.add(d.data().requesterId));
        
        const idsArray = Array.from(friendIds);
        const userDocs = await Promise.all(idsArray.map(id => getDoc(doc(db, 'users', id))));
        
        const all = userDocs
          .filter(d => d.exists())
          .map(d => ({ uid: d.id, ...d.data() }))
          .filter(u => !u.isAdmin && u.role !== 'admin')
          .sort((a, b) => (b.points || 0) - (a.points || 0));
          
        setUsers(all);
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

  const medals = ['🥇', '🥈', '🥉'];

  const renderItem = ({ item, index }) => {
    const isMe = item.uid === user?.uid;
    const lc = safeLevelColor(item.level);
    const levelKey = safeLevel(item.level);
    return (
      <View style={[styles.row, isMe && styles.rowMe]}>
        <Text style={styles.rank}>
          {index < 3 ? medals[index] : `#${index + 1}`}
        </Text>
        <View style={[styles.avatar, { borderColor: lc }]}>
          <Text style={styles.avatarLetter}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, isMe && { color: colors.amarillo }]}>
            {item.name} {isMe ? '(Tú)' : ''}
          </Text>
          <View style={[styles.levelPill, { borderColor: lc }]}>
            <Text style={[styles.levelText, { color: lc }]}>{LEVEL_LABELS[levelKey]}</Text>
          </View>
        </View>
        <Text style={styles.score}>{item.points || 0} <Text style={styles.pts}>pts</Text></Text>
      </View>
    );
  };

  const categories = [
    { id: 'global', label: '🌎 Global' },
    { id: 'friends', label: '👥 Mis Amigos' }
  ];

  return (
    <View style={styles.root}>
      {/* El paddingTop va SOLO en el header, no en el root */}
      <LinearGradient
        colors={[colors.surface, colors.bg]}
        style={[styles.headerBg, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>🏆 Ranking</Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => navigation.navigate('SearchUsers')}
          >
            <Text style={styles.searchButtonIcon}>🔍</Text>
            <Text style={styles.searchButtonText}>Buscar Amigos</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Los mejores trivieros venezolanos</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 15, marginBottom: 5 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setScope(cat.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 10,
                borderWidth: 1,
                backgroundColor: scope === cat.id ? colors.amarillo + '20' : colors.bgInput,
                borderColor: scope === cat.id ? colors.amarillo : colors.border
              }}
            >
              <Text style={{ color: scope === cat.id ? colors.amarillo : colors.textMuted }}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.amarillo} size="large" />
      ) : users.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👥</Text>
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
              colors={[colors.amarillo]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerBg: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontFamily: fonts.bold, fontSize: 26, color: colors.textPrimary },
  headerSub: { fontFamily: fonts.regular, color: colors.textMuted, fontSize: 13, marginTop: 2 },
  list: { padding: spacing.md, paddingBottom: 80 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  rowMe: { borderColor: colors.amarillo + '55', backgroundColor: colors.amarillo + '0A' },
  rank: { fontSize: 20, width: 36, textAlign: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 2,
    backgroundColor: colors.bgInput, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  avatarLetter: { fontFamily: fonts.bold, fontSize: 18, color: colors.textPrimary },
  info: { flex: 1 },
  name: { fontFamily: fonts.semiBold, color: colors.textPrimary, fontSize: 15, marginBottom: 3 },
  levelPill: { borderRadius: radius.full, borderWidth: 1, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2 },
  levelText: { fontFamily: fonts.medium, fontSize: 10 },
  score: { fontFamily: fonts.bold, color: colors.amarillo, fontSize: 18 },
  pts: { fontFamily: fonts.regular, color: colors.textMuted, fontSize: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontFamily: fonts.regular, color: colors.textSecondary },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchButtonIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchButtonText: {
    fontFamily: fonts.medium,
    color: colors.textPrimary,
    fontSize: 12,
  },
});
