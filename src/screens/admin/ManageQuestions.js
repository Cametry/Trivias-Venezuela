import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { collection, onSnapshot, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { colors, fonts, spacing, radius, levelColors } from '../../theme/colors';
import { LEVEL_LABELS, LEVELS } from '../../utils/levels';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ManageQuestions({ navigation }) {
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCat, setFilterCat] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  let unsubscribeSnap;

  const init = async () => {
    try {
      // Cargar categorías desde Firestore
      const catsSnapshot = await getDocs(collection(db, 'categories'));
      const cats = catsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(cats);

      if (unsubscribeSnap) unsubscribeSnap();

      unsubscribeSnap = onSnapshot(
        collection(db, 'questions'),
        (snapshot) => {
          // Spread data FIRST, then overwrite id with doc.id to fix migration bug
          const qs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setQuestions(qs);
          setLoading(false);
          setRefreshing(false);
        },
        (error) => {
          Alert.alert('Error', 'Fallo al cargar preguntas: ' + error.message);
          setLoading(false);
          setRefreshing(false);
        }
      );
    } catch (e) {
      console.warn(e);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    init();
    return () => {
      if (unsubscribeSnap) unsubscribeSnap();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    init();
  };

  const getCatName = (id) => categories.find(c => c.id === id)?.name || id;

  const filtered = questions.filter(q => {
    if (filterCat !== 'all' && q.categoryId !== filterCat) return false;
    if (filterLevel !== 'all' && q.level !== filterLevel) return false;
    if (search && !q.text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = (q) => {
    Alert.alert('Eliminar', '¿Eliminar esta pregunta completamente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await deleteDoc(doc(db, 'questions', q.id));
            // No need to call load() because onSnapshot will auto-update the list
          } catch (e) {
            Alert.alert('Error', 'No se pudo eliminar: ' + e.message);
            setLoading(false);
          }
        }
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Preguntas</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('QuestionForm', { question: null, categories })}
          style={styles.addBtn}
        >
          <Text style={styles.addText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar preguntas…"
        placeholderTextColor={colors.textMuted}
      />

      {/* Filter by category */}
      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'Todas' }, ...categories]}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilterCat(item.id)}
              style={[styles.chip, filterCat === item.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, filterCat === item.id && styles.chipTextActive]}>
                {item.icon ? `${item.icon} ` : ''}{item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Filter by level */}
      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', label: 'Todos' }, ...LEVELS.map(l => ({ id: l, label: LEVEL_LABELS[l] }))]}
          keyExtractor={i => i.id}
          renderItem={({ item }) => {
            const lc = item.id !== 'all' ? levelColors[item.id] : colors.amarillo;
            return (
              <TouchableOpacity
                onPress={() => setFilterLevel(item.id)}
                style={[styles.chip, filterLevel === item.id && { borderColor: lc, backgroundColor: lc + '22' }]}
              >
                <Text style={[styles.chipText, filterLevel === item.id && { color: lc }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <Text style={styles.countText}>{filtered.length} pregunta(s)</Text>

      {loading ? (
        <ActivityIndicator color={colors.amarillo} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.amarillo}
              colors={[colors.amarillo]}
            />
          }
          renderItem={({ item }) => {
            const lc = levelColors[item.level] || colors.azul;
            return (
              <View style={styles.row}>
                <View style={styles.rowTop}>
                  <View style={[styles.levelDot, { backgroundColor: lc }]} />
                  <Text style={styles.catTag}>{getCatName(item.categoryId)}</Text>
                  <Text style={[styles.levelTag, { color: lc }]}>{LEVEL_LABELS[item.level]}</Text>
                </View>
                <Text style={styles.qText} numberOfLines={2}>{item.text}</Text>
                <View style={styles.rowActions}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('QuestionForm', { question: item, categories })}
                    style={styles.editBtn}
                  >
                    <Text style={styles.editText}>✏️ Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)} style={styles.delBtn}>
                    <Text style={styles.delText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { padding: 4 },
  backText: { color: colors.amarillo, fontFamily: fonts.medium },
  title: { fontFamily: fonts.bold, color: colors.textPrimary, fontSize: 18 },
  addBtn: { backgroundColor: colors.rojo + '25', borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.rojo + '66' },
  addText: { color: colors.rojo, fontFamily: fonts.bold, fontSize: 13 },

  search: { margin: spacing.md, marginBottom: 4, backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.sm + 4, color: colors.textPrimary, fontFamily: fonts.regular, borderWidth: 1, borderColor: colors.border },
  filters: { paddingHorizontal: spacing.md, paddingVertical: 4 },
  chip: { borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 5, marginRight: 6 },
  chipActive: { borderColor: colors.amarillo, backgroundColor: colors.amarillo + '22' },
  chipText: { fontFamily: fonts.medium, color: colors.textMuted, fontSize: 12 },
  chipTextActive: { color: colors.amarillo },
  countText: { fontFamily: fonts.regular, color: colors.textMuted, fontSize: 12, paddingHorizontal: spacing.md, paddingVertical: 4 },

  row: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  levelDot: { width: 8, height: 8, borderRadius: 4 },
  catTag: { fontFamily: fonts.medium, color: colors.textMuted, fontSize: 12, flex: 1 },
  levelTag: { fontFamily: fonts.semiBold, fontSize: 11 },
  qText: { fontFamily: fonts.regular, color: colors.textPrimary, fontSize: 14, marginBottom: 8, lineHeight: 20 },
  rowActions: { flexDirection: 'row', gap: spacing.sm },
  editBtn: { backgroundColor: colors.azul + '25', borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  editText: { color: colors.azul, fontFamily: fonts.medium, fontSize: 12 },
  delBtn: { padding: 5 },
  delText: { fontSize: 16 },
});
