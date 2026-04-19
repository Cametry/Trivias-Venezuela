import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../config/firebase';
import { colors, fonts, spacing, radius } from '../theme/colors';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function SearchUsersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // Para mostrar "no hay resultados" solo después de buscar

  // Ocultar el header nativo para usar el personalizado
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleSearch = async () => {
    const text = searchText.trim();
    if (!text) {
      setUsers([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      let q;
      if (text.includes('@')) {
        // Búsqueda por correo parcial
        const emailQuery = text.toLowerCase();
        q = query(
          collection(db, 'users'),
          where('email', '>=', emailQuery),
          where('email', '<=', emailQuery + '\uf8ff'),
          limit(20)
        );
      } else {
        // Búsqueda por prefijo de nombre
        q = query(
          collection(db, 'users'),
          where('name', '>=', text),
          where('name', '<=', text + '\uf8ff'),
          limit(20)
        );
      }

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 1. Filtrar al usuario actual y admins
      const currentUserId = auth.currentUser?.uid;
      const filtered = results.filter(u =>
        u.id !== currentUserId &&
        u.role !== 'admin' &&
        !u.isAdmin
      );

      setUsers(filtered);
    } catch (error) {
      console.error('Error buscando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <Card
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      accentColor={colors.palette.azul.text}
      style={styles.userCard}
    >
      <View style={styles.userCardContent}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.palette.azul.bg }]}>
            <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <View style={styles.pointsContainer}>
            <Ionicons name="trophy" size={14} color={colors.palette.amarillo.text} />
            <Text style={styles.userPoints}>{item.points || 0} pts</Text>
          </View>
        </View>
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.palette.azul.text} />
        </View>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Personalizado */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.palette.azul.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Buscar Amigos</Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Subtítulo */}
      <Text style={styles.screenSubtitle}>Encuentra otros jugadores para competir</Text>

      {/* Sección de búsqueda */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.palette.azul.text} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nombre o correo..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
          />
        </View>

        <Button
          label="Buscar"
          variant="secondary"
          onPress={handleSearch}
          loading={loading}
          disabled={loading}
          icon="search"
          iconPosition="right"
        />
      </View>

      {/* Resultados */}
      {hasSearched && users.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color={colors.palette.azul.bg} />
          <Text style={styles.emptyText}>No se encontraron jugadores</Text>
          <Text style={styles.emptySubtext}>Intenta con otro nombre o correo</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.palette.azul.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.palette.azul.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  screenSubtitle: {
    color: colors.palette.azul.text,
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginBottom: spacing.xl,
    opacity: 0.8,
  },
  searchSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.palette.azul.bg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  userCard: {
    marginBottom: spacing.sm,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.palette.azul.text,
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userPoints: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.palette.amarillo.text,
    marginLeft: 4,
  },
  arrowContainer: {
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: colors.palette.azul.text,
    fontFamily: fonts.semiBold,
    fontSize: 18,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
