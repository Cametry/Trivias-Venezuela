import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing, radius } from '../theme/colors';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) { setError('Completa todos los campos.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener mínimo 6 caracteres.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true); setError('');
    try {
      await register(email.trim(), password, name.trim());
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
        {/* El paddingTop dinámico va en el contenedor del scroll para respetar el notch */}
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 10 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
              <Text style={styles.backText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a Trivias Venezuela</Text>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {[
            { label: 'Nombre de usuario', val: name, set: setName, ph: 'Tu nombre', type: 'default' },
            { label: 'Correo electrónico', val: email, set: setEmail, ph: 'correo@ejemplo.com', type: 'email-address' },
            { label: 'Contraseña', val: password, set: setPassword, ph: '••••••••', secure: true },
            { label: 'Confirmar contraseña', val: confirm, set: setConfirm, ph: '••••••••', secure: true },
          ].map(({ label, val, set, ph, type, secure }) => (
            <View style={styles.inputGroup} key={label}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={val}
                onChangeText={set}
                placeholder={ph}
                placeholderTextColor={colors.textMuted}
                keyboardType={type}
                autoCapitalize="none"
                secureTextEntry={!!secure}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            <LinearGradient
              colors={[colors.azul, '#0050CC']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color={colors.textPrimary} />
                : <Text style={styles.btnText}>Crear cuenta</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
            <Text style={styles.linkText}>¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.lg },
  header: { marginBottom: spacing.xl },
  back: { marginBottom: spacing.md },
  backText: { color: colors.amarillo, fontFamily: fonts.medium, fontSize: 14 },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.textPrimary, marginBottom: 4 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  errorBox: { backgroundColor: colors.error + '22', borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.md },
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
  },
  btn: { marginTop: spacing.md, borderRadius: radius.md, overflow: 'hidden' },
  btnGradient: { padding: spacing.md + 2, alignItems: 'center', borderRadius: radius.md },
  btnText: { fontFamily: fonts.bold, fontSize: 16, color: colors.textPrimary },
  link: { marginTop: spacing.lg, alignSelf: 'center' },
  linkText: { fontFamily: fonts.regular, color: colors.textSecondary, fontSize: 14 },
  linkBold: { fontFamily: fonts.bold, color: colors.amarillo },
});
