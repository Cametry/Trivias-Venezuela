import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors, { fonts, spacing, radius } from '../theme/colors';

// ── Botón 3D reutilizable (inline para no depender de imports externos) ──
function Button3D({ label, onPress, loading, variant = 'primary' }) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const VARIANTS = {
    primary: {
      bg: colors.palette.amarillo.bg,
      text: colors.palette.amarillo.text,
      shadow: colors.palette.amarillo.dark,
    },
  };
  const v = VARIANTS[variant];

  const handlePressIn = () =>
    Animated.timing(pressAnim, {
      toValue: 1, duration: 80,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

  const handlePressOut = () =>
    Animated.timing(pressAnim, {
      toValue: 0, duration: 80,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

  const translateY = pressAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 3],
  });
  const shadowH = pressAnim.interpolate({
    inputRange: [0, 1], outputRange: [4, 1],
  });

  return (
    <TouchableWithoutFeedback
      onPress={loading ? null : onPress}
      onPressIn={loading ? null : handlePressIn}
      onPressOut={loading ? null : handlePressOut}
    >
      <View style={s.btnWrapper}>
        <Animated.View
          style={[
            s.btnBody,
            { backgroundColor: v.bg, transform: [{ translateY }], opacity: loading ? 0.7 : 1 },
          ]}
        >
          {loading
            ? <ActivityIndicator color={v.text} />
            : <Text style={[s.btnLabel, { color: v.text }]}>{label}</Text>
          }
        </Animated.View>
        <View style={[s.btnShadow, { backgroundColor: v.shadow }]} />
      </View>
    </TouchableWithoutFeedback>
  );
}

// ── Input con ícono ───────────────────────────────────────────────────────
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

            {/* Error */}
            {!!error && (
              <View style={s.errorBox}>
                <Ionicons name="warning" size={15} color={colors.palette.rojo.text} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Correo */}
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

            {/* Contraseña */}
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

            {/* Botón ingresar */}
            <View style={{ marginTop: spacing.sm }}>
              <Button3D
                label="Ingresar"
                onPress={handleLogin}
                loading={loading}
                variant="primary"
              />
            </View>

            {/* Link registro */}
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

// =============================================================
//  Estilos
// =============================================================
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

  // ── Logo section ─────────────────────────────────────────────
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
    // Sombra iOS
    shadowColor: colors.palette.amarillo.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    // Sombra Android
    elevation: 6,
  },
  logo: {
    width: 170,
    height: 170,
  },
  appName: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // ── Tarjeta formulario ───────────────────────────────────────
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    // Sombra iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    // Sombra Android
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

  // ── Error ────────────────────────────────────────────────────
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

  // ── Input ────────────────────────────────────────────────────
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

  // ── Botón 3D ─────────────────────────────────────────────────
  btnWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: spacing.md,
    paddingBottom: 0,
  },
  btnShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
    borderRadius: radius.xl,
  },
  btnBody: {
    borderTopLeftRadius: radius.xl,     // ← esquina superior izquierda
    borderTopRightRadius: radius.xl,    // ← esquina superior derecha
    borderBottomLeftRadius: 0,          // ← esquina inferior izquierda
    borderBottomRightRadius: 0,         // ← esquina inferior derecha
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },

  // ── Link ─────────────────────────────────────────────────────
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