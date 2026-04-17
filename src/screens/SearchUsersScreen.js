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
import { db, auth } from '../config/firebase'; // Importar auth
import { colors, fonts, spacing, radius } from '../theme/colors';

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
    <View style={styles.userCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userPoints}>{item.points || 0} pts</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      >
        <Text style={styles.addButtonText}>Ver Perfil</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Personalizado Equilibrado */}
      <View style={styles.customHeader}>
        {/* Botón de Regresar (Posicionamiento Absoluto) */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.bubbleBackButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backText} numberOfLines={1}>Regresar</Text>
        </TouchableOpacity>

        {/* Centro: Título */}
        <Text style={styles.headerTitle}>Buscar Amigos</Text>
      </View>

      {/* Subtítulo Disimulado */}
      <Text style={styles.screenSubtitle}>Encuentra otros jugadores para competir</Text>

      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
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

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.searchButtonText}>Buscar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Resultados */}
      {hasSearched && users.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No se encontraron jugadores.</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
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
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  bubbleBackButton: {
    position: 'absolute',
    left: 10,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backText: {
    color: colors.textPrimary,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  screenSubtitle: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginBottom: 20,
  },
  searchSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchInputContainer: {
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.bgCard,
    color: colors.textPrimary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchButton: {
    backgroundColor: colors.azul,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.azul,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  searchButtonText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.azul,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textPrimary,
  },
  userPoints: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.amarillo,
  },
  addButton: {
    backgroundColor: colors.bgInput,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  addButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
});
