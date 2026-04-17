import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { getCategories, saveCategory, deleteCategory } from '../../services/storage';
import { colors, fonts, spacing, radius, categoryColors } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EMOJI_OPTIONS = ['🏛️', '🗺️', '⚽', '🎵', '🌿', '📺', '🌟', '🍽️', '🎭', '🎨', '📖', '🏆', '🎤', '🎬', '🔬'];

export default function ManageCategories({ navigation }) {
  const insets = useSafeAreaInsets();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '📂', color: colors.azul });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setCats(await getCategories());
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', icon: '📂', color: colors.azul });
    setModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, icon: cat.icon, color: cat.color });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Error', 'El nombre es requerido.'); return; }
    await saveCategory(editing ? { ...editing, ...form } : form);
    setModal(false);
    load();
  };

  const handleDelete = (cat) => {
    Alert.alert('Eliminar', `¿Eliminar "${cat.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteCategory(cat.id); load(); } },
    ]);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Categorías</Text>
        <TouchableOpacity onPress={openNew} style={styles.addBtn}>
          <Text style={styles.addText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={colors.amarillo} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={cats}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
                <Text style={styles.editText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.delBtn}>
                <Text style={styles.delText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editing ? 'Editar' : 'Nueva'} Categoría</Text>

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="Ej: Historia"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Icono</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map(e => (
                <TouchableOpacity key={e} onPress={() => setForm(f => ({ ...f, icon: e }))}
                  style={[styles.emojiOpt, form.icon === e && styles.emojiSelected]}>
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.saveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { padding: 4 },
  backText: { color: colors.amarillo, fontFamily: fonts.medium },
  title: { fontFamily: fonts.bold, color: colors.textPrimary, fontSize: 18 },
  addBtn: { backgroundColor: colors.azul + '30', borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.azul + '66' },
  addText: { color: colors.azul, fontFamily: fonts.bold, fontSize: 13 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  icon: { fontSize: 24, marginRight: spacing.sm },
  name: { fontFamily: fonts.semiBold, color: colors.textPrimary, flex: 1, fontSize: 15 },
  editBtn: { padding: 8 },
  editText: { fontSize: 18 },
  delBtn: { padding: 8 },
  delText: { fontSize: 18 },

  modalOverlay: { flex: 1, backgroundColor: '#000A', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.xl,
  },
  modalTitle: { fontFamily: fonts.bold, color: colors.textPrimary, fontSize: 20, marginBottom: spacing.md },
  label: { fontFamily: fonts.medium, color: colors.textSecondary, fontSize: 13, marginBottom: 6, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.md,
    color: colors.textPrimary, fontFamily: fonts.regular, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  emojiOpt: { padding: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  emojiSelected: { borderColor: colors.amarillo, backgroundColor: colors.amarillo + '22' },

  modalBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.bgInput, alignItems: 'center' },
  cancelText: { fontFamily: fonts.medium, color: colors.textSecondary },
  saveBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.azul, alignItems: 'center' },
  saveText: { fontFamily: fonts.bold, color: '#fff' },
});
