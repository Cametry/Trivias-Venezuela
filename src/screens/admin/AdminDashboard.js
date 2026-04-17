import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getCategories } from '../../services/storage';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { colors, fonts, spacing, radius } from '../../theme/colors';

export default function AdminDashboard({ navigation }) {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({ categories: 0, questions: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const cats = await getCategories();
      const qsSnap = await getDocs(collection(db, 'questions'));
      setStats({ categories: cats.length, questions: qsSnap.size });
    } catch (e) {
      console.warn('Error loadStats', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const menuItems = [
    { label: '📂 Categorías', sub: `${stats.categories} categorías`, screen: 'ManageCategories', color: colors.azul },
    { label: '❓ Preguntas', sub: `${stats.questions} preguntas`, screen: 'ManageQuestions', color: colors.rojo },
  ];

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.surface, colors.bg]} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.title}>Panel Admin</Text>
          <Text style={styles.subtitle}>admin@admin.com</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.amarillo}
            colors={[colors.amarillo]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={colors.amarillo} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { val: stats.categories, label: 'Categorías', icon: '📂' },
                { val: stats.questions, label: 'Preguntas', icon: '❓' },
              ].map(({ val, label, icon }) => (
                <View key={label} style={styles.statCard}>
                  <Text style={styles.statIcon}>{icon}</Text>
                  <Text style={styles.statNum}>{val}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Menu */}
            {menuItems.map(({ label, sub, screen, color }) => (
              <TouchableOpacity
                key={screen}
                style={[styles.menuCard, { borderLeftColor: color }]}
                onPress={() => navigation.navigate(screen)}
              >
                <View>
                  <Text style={styles.menuLabel}>{label}</Text>
                  <Text style={styles.menuSub}>{sub}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.regular, color: colors.textMuted, fontSize: 13 },
  logoutBtn: { backgroundColor: colors.rojo + '22', borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.rojo + '55' },
  logoutText: { fontFamily: fonts.bold, color: colors.rojo, fontSize: 13 },

  scroll: { padding: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statNum: { fontFamily: fonts.bold, color: colors.amarillo, fontSize: 28 },
  statLabel: { fontFamily: fonts.regular, color: colors.textMuted, fontSize: 12 },

  menuCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  menuLabel: { fontFamily: fonts.bold, color: colors.textPrimary, fontSize: 16 },
  menuSub: { fontFamily: fonts.regular, color: colors.textMuted, fontSize: 13 },
  menuArrow: { fontFamily: fonts.bold, color: colors.textMuted, fontSize: 24 },
});
