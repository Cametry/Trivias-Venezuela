import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { colors, fonts, spacing, radius, levelColors } from '../../theme/colors';
import { LEVELS, LEVEL_LABELS } from '../../utils/levels';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QuestionForm({ route, navigation }) {
  const { question, categories } = route.params;
  const insets = useSafeAreaInsets();
  const isEdit = !!question;

  const [text, setText] = useState(question?.text || '');
  const [options, setOptions] = useState(question?.options || ['', '', '', '']);
  const [correctIndex, setCorrect] = useState(question?.correctIndex ?? 0);
  const [categoryId, setCategoryId] = useState(question?.categoryId || (categories[0]?.id || ''));
  const [level, setLevel] = useState(question?.level || 'basico');
  const [saving, setSaving] = useState(false);

  const setOption = (idx, val) => {
    const next = [...options];
    next[idx] = val;
    setOptions(next);
  };

  const handleSave = async () => {
    if (!text.trim()) { Alert.alert('Error', 'La pregunta no puede estar vacía.'); return; }
    if (options.some(o => !o.trim())) { Alert.alert('Error', 'Todas las opciones deben tener texto.'); return; }
    if (!categoryId) { Alert.alert('Error', 'Selecciona una categoría.'); return; }

    setSaving(true);
    try {
      const questionData = {
        text: text.trim(),
        options: options.map(o => o.trim()),
        correctIndex,
        categoryId,
        level,
        imageUrl: question?.imageUrl || null,
        updatedAt: new Date().toISOString()
      };

      if (isEdit) {
        await updateDoc(doc(db, 'questions', question.id), questionData);
      } else {
        questionData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'questions'), questionData);
      }

      Alert.alert('✅ Éxito', `Pregunta ${isEdit ? 'actualizada' : 'creada'} correctamente.`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('❌ Error', 'No se pudo guardar: ' + e.message);
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? 'Editar' : 'Nueva'} Pregunta</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Question text */}
        <Text style={styles.label}>Pregunta *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={text}
          onChangeText={setText}
          placeholder="Escribe la pregunta aquí…"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        {/* Category */}
        <Text style={styles.label}>Categoría *</Text>
        <View style={styles.chipRow}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategoryId(cat.id)}
              style={[styles.chip, categoryId === cat.id && styles.chipActive]}
            >
              <Text style={[styles.chipTxt, categoryId === cat.id && styles.chipTxtActive]}>
                {cat.icon} {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Level */}
        <Text style={styles.label}>Nivel *</Text>
        <View style={styles.chipRow}>
          {LEVELS.map(lv => {
            const lc = levelColors[lv];
            const active = level === lv;
            return (
              <TouchableOpacity
                key={lv}
                onPress={() => setLevel(lv)}
                style={[styles.chip, active && { borderColor: lc, backgroundColor: lc + '22' }]}
              >
                <Text style={[styles.chipTxt, active && { color: lc }]}>{LEVEL_LABELS[lv]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Options */}
        <Text style={styles.label}>Opciones (toca ✓ para marcar la correcta) *</Text>
        {options.map((opt, idx) => {
          const isCorrect = idx === correctIndex;
          return (
            <View key={idx} style={[styles.optRow, isCorrect && styles.optRowCorrect]}>
              <TouchableOpacity onPress={() => setCorrect(idx)} style={styles.checkBtn}>
                <Text style={[styles.checkTxt, isCorrect && { color: colors.success }]}>
                  {isCorrect ? '✓' : ['A', 'B', 'C', 'D'][idx]}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.optInput, isCorrect && { borderColor: colors.success + '88' }]}
                value={opt}
                onChangeText={v => setOption(idx, v)}
                placeholder={`Opción ${['A', 'B', 'C', 'D'][idx]}`}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          );
        })}

        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          <LinearGradient
            colors={[colors.amarillo, '#FFA000']}
            style={styles.saveGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {saving
              ? <ActivityIndicator color={colors.bg} />
              : <Text style={styles.saveTxt}>💾 {isEdit ? 'Actualizar' : 'Guardar'} Pregunta</Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { padding: 4 },
  backText: { color: colors.rojo, fontFamily: fonts.medium, fontSize: 14 },
  title: { fontFamily: fonts.bold, color: colors.textPrimary, fontSize: 18 },

  scroll: { padding: spacing.md, paddingBottom: 60 },
  label: { fontFamily: fonts.semiBold, color: colors.textSecondary, fontSize: 13, marginBottom: 6, marginTop: spacing.md },
  input: {
    backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.md,
    color: colors.textPrimary, fontFamily: fonts.regular, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { borderColor: colors.amarillo, backgroundColor: colors.amarillo + '22' },
  chipTxt: { fontFamily: fonts.medium, color: colors.textMuted, fontSize: 13 },
  chipTxtActive: { color: colors.amarillo },

  optRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: 8 },
  optRowCorrect: {},
  checkBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgInput, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  checkTxt: { fontFamily: fonts.bold, color: colors.textMuted, fontSize: 16 },
  optInput: { flex: 1 },

  saveBtn: { marginTop: spacing.lg, borderRadius: radius.md, overflow: 'hidden' },
  saveGrad: { padding: spacing.md + 2, alignItems: 'center' },
  saveTxt: { fontFamily: fonts.bold, color: colors.bg, fontSize: 16 },
});
