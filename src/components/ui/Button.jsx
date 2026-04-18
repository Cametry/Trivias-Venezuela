// =============================================================
//  🇻🇪 Trivias Venezuela — Componente Button Universal
//  Efecto 3D hundirse: translateY + sombra inferior
//
//  VARIANTES:
//    primary   → Amarillo pastel (acción principal)
//    secondary → Azul pastel (acción secundaria)
//    danger    → Rojo pastel (cerrar sesión, eliminar)
//    success   → Verde pastel (confirmar, aceptar)
//    ghost     → Transparente con borde morado (regresar)
//
//  USO:
//    <Button label="Jugar" variant="primary" onPress={() => {}} />
//    <Button label="Regresar" variant="ghost" icon="arrow-left" onPress={navigation.goBack} />
//    <Button label="Buscar" variant="secondary" loading={true} onPress={handleSearch} />
// =============================================================

import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { radius, spacing } from '../../theme/spacing';

// ── Definición de variantes ───────────────────────────────────
const VARIANTS = {
  primary:   { bg: colors.amarillo.bg,  text: colors.amarillo.text,  shadow: colors.amarillo.dark },
  secondary: { bg: colors.azul.bg,      text: colors.azul.text,      shadow: colors.azul.dark },
  danger:    { bg: colors.rojo.bg,      text: colors.rojo.text,      shadow: colors.rojo.dark },
  success:   { bg: colors.verde.bg,     text: colors.verde.text,     shadow: colors.verde.dark },
  ghost:     { bg: 'transparent',       text: colors.morado.text,    shadow: colors.morado.bg,
               border: colors.morado.bg, borderWidth: 2 },
};

const PRESS_DOWN   = 3;   // px que baja el botón al presionar
const SHADOW_REST  = 4;   // px de sombra en reposo
const ANIM_DURATION = 80; // ms de la animación

export default function Button({
  label,
  onPress,
  variant = 'primary',
  icon,             // nombre del ícono de @expo/vector-icons Ionicons
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,            // estilo adicional para el contenedor
}) {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const v = VARIANTS[variant] || VARIANTS.primary;

  const handlePressIn = () => {
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: ANIM_DURATION,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(pressAnim, {
      toValue: 0,
      duration: ANIM_DURATION,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PRESS_DOWN],
  });

  const shadowHeight = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHADOW_REST, 1],
  });

  const isDisabled = disabled || loading;

  return (
    <TouchableWithoutFeedback
      onPress={isDisabled ? null : onPress}
      onPressIn={isDisabled ? null : handlePressIn}
      onPressOut={isDisabled ? null : handlePressOut}
    >
      <View style={[styles.wrapper, fullWidth && styles.fullWidth, style]}>
        {/* Sombra 3D (capa inferior fija) */}
        <Animated.View
          style={[
            styles.shadow,
            {
              backgroundColor: v.shadow,
              height: shadowHeight,
              borderRadius: radius.xl,
            },
          ]}
        />

        {/* Cuerpo del botón (se mueve hacia abajo) */}
        <Animated.View
          style={[
            styles.body,
            {
              backgroundColor: v.bg,
              borderRadius: radius.xl,
              transform: [{ translateY }],
              opacity: isDisabled ? 0.55 : 1,
              borderWidth: v.borderWidth || 0,
              borderColor: v.border || 'transparent',
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={v.text} />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <Ionicons
                  name={icon}
                  size={18}
                  color={v.text}
                  style={styles.iconLeft}
                />
              )}
              <Text style={[styles.label, { color: v.text, fontFamily: fonts.bold }]}>
                {label}
              </Text>
              {icon && iconPosition === 'right' && (
                <Ionicons
                  name={icon}
                  size={18}
                  color={v.text}
                  style={styles.iconRight}
                />
              )}
            </>
          )}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  fullWidth: {
    width: '100%',
  },
  shadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  body: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
