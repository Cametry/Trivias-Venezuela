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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors, { fonts, spacing, radius } from '../theme/colors';
import Button from '../components/ui/Button';

// ── Input con ícono + toggle visibilidad ──────────────────────
function IconInput({ icon, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

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
//  RegisterScreen — lógica 100% sin cambios
// =============================================================
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
    if (name.trim().length < 3) { setError('El nombre debe tener al menos 3 caracteres.'); return; }
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
    <View style={s.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 16 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.palette.amarillo.text} />
            <Text style={s.backText}>Volver</Text>
          </TouchableOpacity>

          <View style={s.titleBlock}>
            <Text style={s.title}>Crear Cuenta</Text>
            <Text style={s.subtitle}>Únete a Trivias Venezuela</Text>
          </View>

          {!!error && (
            <View style={s.errorBox}>
              <Ionicons name="warning" size={15} color={colors.palette.rojo.text} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <View style={s.inputGroup}>
            <Text style={s.label}>Nombre de usuario</Text>
            <IconInput
              icon="person-outline"
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              keyboardType="default"
              autoCapitalize="words"
            />
          </View>

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
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>Confirmar contraseña</Text>
            <IconInput
              icon="lock-closed-outline"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repite tu contraseña"
              secureTextEntry
            />
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Button
              label="Crear cuenta"
              onPress={handleRegister}
              loading={loading}
              variant="primary"
            />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={s.link}
            activeOpacity={0.7}
          >
            <Text style={s.linkText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={s.linkBold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>

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
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: spacing.lg,
  },
  backText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.palette.amarillo.text,
  },
  titleBlock: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
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