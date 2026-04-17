import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing, radius } from '../theme/colors';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [soundEffects, setSoundEffects] = useState(true);
  const [bgMusic, setBgMusic] = useState(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>◀ Regresar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Efectos de sonido</Text>
            <Switch
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: colors.border, true: colors.amarillo }}
              thumbColor={colors.bgCard}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Música de fondo</Text>
            <Switch
              value={bgMusic}
              onValueChange={setBgMusic}
              trackColor={{ false: colors.border, true: colors.amarillo }}
              thumbColor={colors.bgCard}
            />
          </View>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>⎋ Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  backBtn: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 10,
    justifyContent: 'center',
    height: '100%',
  },
  backBtnText: {
    color: colors.amarillo,
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingText: {
    color: colors.textPrimary,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  logoutBtn: {
    backgroundColor: colors.rojo + '18',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.rojo + '55',
  },
  logoutText: {
    fontFamily: fonts.bold,
    color: colors.rojo,
    fontSize: 15,
  },
});
