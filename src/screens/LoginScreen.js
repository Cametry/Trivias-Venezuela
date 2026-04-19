import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors, { fonts, spacing, radius } from '../theme/colors';
import Button from '../components/ui/Button';

// ── Input con ícono ───────────────────────────────────────────
function IconInput({ icon, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View style={[s.inputWrap, focused && s.inputWrapFocused]}>
      <Ionicons
        name={icon}
        size={18}
        color={focused ? colors.palette.amarillo.text : colors.textMuted}
        style={s.inputIcon}
      />
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'none'}
        secureTextEntry={hidden}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={() => setHidden(!hidden)} style={s.eyeBtn}>
          <Ionicons
            name={hidden ? 'eye-outline' : 'eye-off-outline'}
            size={18}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

// =============================================================
//  LoginScreen — lógica 100% sin cambios
// =============================================================
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
    <View style={s.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Sección logo ── */}
          <View style={s.logoSection}>
            <View style={s.logoWrap}>
              <Image
                source={require('../../assets/logo de trivias(4k).png')}
                style={s.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* ── Tarjeta formulario ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Bienvenido de nuevo</Text>
            <Text style={s.cardSubtitle}>Inicia sesión para continuar</Text>

            {!!error && (
              <View style={s.errorBox}>
                <Ionicons name="warning" size={15} color={colors.palette.rojo.text} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <View style={s.inputGroup}>
              <Text style={s.label}>Correo electrónico</Text>
              <IconInput
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="correo@ejemplo.com"
                keyboardType="email-address"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>Contraseña</Text>
              <IconInput
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>

            <View style={{ marginTop: spacing.sm }}>
              <Button
                label="Ingresar"
                onPress={handleLogin}
                loading={loading}
                variant="primary"
              />
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={s.link}
              activeOpacity={0.7}
            >
              <Text style={s.linkText}>
                ¿No tienes cuenta?{' '}
                <Text style={s.linkBold}>Regístrate</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: insets.bottom + 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoWrap: {
    width: 200,
    height: 200,
    borderRadius: 80,
    backgroundColor: colors.palette.amarillo.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.palette.amarillo.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  logo: {
    width: 170,
    height: 170,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.palette.rojo.bg,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.palette.rojo.text,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputWrapFocused: {
    borderColor: colors.palette.amarillo.text,
    backgroundColor: colors.palette.amarillo.bg + '40',
  },
  inputIcon: {
    paddingLeft: spacing.md,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  eyeBtn: {
    padding: spacing.md,
  },
  link: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  linkText: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 14,
  },
  linkBold: {
    fontFamily: fonts.bold,
    color: colors.palette.amarillo.text,
  },
});