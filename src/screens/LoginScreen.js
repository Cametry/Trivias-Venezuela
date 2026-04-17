import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing, radius } from '../theme/colors';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Completa todos los campos.'); return; }
    setLoading(true); setError('');
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // El fondo del gradient llega al borde físico (sin paddingTop en el root)
    <LinearGradient colors={[colors.gradStart, colors.gradEnd]} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* El paddingTop dinámico va en el ScrollView para que el contenido respete el notch */}
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../../assets/logo de trivias(4k).png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Bienvenido</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            <LinearGradient
              colors={[colors.amarillo, '#FFA000']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color={colors.bg} />
                : <Text style={styles.btnText}>Ingresar</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
            <Text style={styles.linkText}>¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  logo: { width: 120, height: 120, marginBottom: spacing.lg },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.textPrimary, marginBottom: 4 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xl },
  errorBox: { backgroundColor: colors.error + '22', borderRadius: radius.sm, padding: spacing.md, width: '100%', marginBottom: spacing.md },
  errorText: { color: colors.error, fontFamily: fonts.medium, fontSize: 13 },
  inputGroup: { width: '100%', marginBottom: spacing.md },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  btn: { width: '100%', marginTop: spacing.md, borderRadius: radius.md, overflow: 'hidden' },
  btnGradient: { padding: spacing.md + 2, alignItems: 'center', borderRadius: radius.md },
  btnText: { fontFamily: fonts.bold, fontSize: 16, color: colors.bg },
  link: { marginTop: spacing.lg },
  linkText: { fontFamily: fonts.regular, color: colors.textSecondary, fontSize: 14 },
  linkBold: { fontFamily: fonts.bold, color: colors.amarillo },
});
