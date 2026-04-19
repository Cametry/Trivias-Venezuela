import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors, { fonts, spacing, radius } from '../theme/colors';

// Nuevos componentes UI
import ScreenBackground from '../components/ui/ScreenBackground';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // La lógica de negocio se mantiene intacta
  const [soundEffects, setSoundEffects] = useState(true);
  const [bgMusic, setBgMusic] = useState(true);

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header Rediseñado */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color={colors.palette.azul.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajustes</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Usamos Card con un acento sutil */}
          <Card accentColor={colors.palette.amarillo.bg} style={styles.cardContainer}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <Ionicons name="musical-notes" size={24} color={colors.palette.amarillo.text} style={styles.icon} />
                <Text style={styles.settingText}>Efectos de sonido</Text>
              </View>
              <Switch
                value={soundEffects}
                onValueChange={setSoundEffects}
                // Uso estricto de la paleta
                trackColor={{ false: colors.surface, true: colors.palette.amarillo.bg }}
                thumbColor={soundEffects ? colors.palette.amarillo.text : colors.bgCard}
              />
            </View>

            <View style={[styles.settingRow, styles.lastRow]}>
              <View style={styles.settingLabel}>
                <Ionicons name="headset" size={24} color={colors.palette.azul.text} style={styles.icon} />
                <Text style={styles.settingText}>Música de fondo</Text>
              </View>
              <Switch
                value={bgMusic}
                onValueChange={setBgMusic}
                trackColor={{ false: colors.surface, true: colors.palette.azul.bg }}
                thumbColor={bgMusic ? colors.palette.azul.text : colors.bgCard}
              />
            </View>
          </Card>

          {/* Usamos el Botón universal 3D con la variante danger */}
          <View style={styles.logoutWrapper}>
            <Button
              label="Cerrar sesión"
              variant="danger"
              icon="log-out-outline"
              onPress={logout}
            />
          </View>
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    color: colors.palette.azul.text,
    fontFamily: fonts.extraBold,
    fontSize: 22,
  },
  headerSpacer: {
    width: 36, // Equilibra el espacio del botón para centrar el título
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  cardContainer: {
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgInput, 
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  settingText: {
    color: colors.palette.azul.text,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  logoutWrapper: {
    marginTop: 'auto', // Empuja el botón hacia el final de la pantalla
    marginBottom: spacing.xxl,
  },
});