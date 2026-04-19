// =============================================================
//  🇻🇪 Trivias Venezuela — Componente Button Universal
//  Efecto 3D hundirse: el cuerpo se mueve sobre la sombra fija
//
//  ⚠️ NO acepta children — solo props:
//     label, variant, onPress, icon, iconPosition, loading, disabled, fullWidth
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

const VARIANTS = {
  primary:   { bg: colors.palette.amarillo.bg,  text: colors.palette.amarillo.text,  shadow: colors.palette.amarillo.dark },
  secondary: { bg: colors.palette.azul.bg,      text: colors.palette.azul.text,      shadow: colors.palette.azul.dark },
  danger:    { bg: colors.palette.rojo.bg,       text: colors.palette.rojo.text,      shadow: colors.palette.rojo.dark },
  success:   { bg: colors.palette.verde.bg,      text: colors.palette.verde.text,     shadow: colors.palette.verde.dark },
  ghost:     { bg: 'transparent',               text: colors.palette.morado.text,    shadow: colors.palette.morado.bg,
               border: colors.palette.morado.bg, borderWidth: 2 },
};

const SHADOW_OFFSET  = 4;  // px que la sombra sobresale debajo del cuerpo
const PRESS_DOWN     = 4;  // px que el cuerpo baja al presionar (= SHADOW_OFFSET para taparlo)
const ANIM_DURATION  = 80;

export default function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}) {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const v = VARIANTS[variant] || VARIANTS.primary;

  const handlePressIn = () =>
    Animated.timing(pressAnim, {
      toValue: 1, duration: ANIM_DURATION,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

  const handlePressOut = () =>
    Animated.timing(pressAnim, {
      toValue: 0, duration: ANIM_DURATION,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

  // El cuerpo baja al presionar, cubriendo la sombra por completo
  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PRESS_DOWN],
  });

  const isDisabled = disabled || loading;

  return (
    <TouchableWithoutFeedback
      onPress={isDisabled ? null : onPress}
      onPressIn={isDisabled ? null : handlePressIn}
      onPressOut={isDisabled ? null : handlePressOut}
    >
      {/*
        Wrapper con paddingBottom = SHADOW_OFFSET para reservar espacio a la sombra.
        La sombra es IDÉNTICA al cuerpo pero desplazada hacia abajo — así
        tiene exactamente la misma forma redondeada que el botón.
      */}
      <View style={[styles.wrapper, fullWidth && styles.fullWidth, style]}>

        {/* Sombra: misma forma que el cuerpo, fija en la parte baja del wrapper */}
        <View
          style={[
            styles.shadow,
            {
              backgroundColor: v.shadow,
              borderRadius: radius.xl,
              borderWidth: v.borderWidth || 0,
              borderColor: v.border || 'transparent',
            },
          ]}
        />

        {/* Cuerpo: se mueve hacia abajo al presionar, tapando la sombra */}
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
                <Ionicons name={icon} size={18} color={v.text} style={styles.iconLeft} />
              )}
              <Text style={[styles.label, { color: v.text, fontFamily: fonts.bold }]}>
                {label}
              </Text>
              {icon && iconPosition === 'right' && (
                <Ionicons name={icon} size={18} color={v.text} style={styles.iconRight} />
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
    // paddingBottom reserva el espacio visual de la sombra
    paddingBottom: SHADOW_OFFSET,
    marginBottom: spacing.md,
  },
  fullWidth: {
    width: '100%',
  },

  // La sombra ocupa todo el wrapper (incluyendo el paddingBottom)
  // gracias a StyleSheet.absoluteFillObject + el mismo borderRadius del cuerpo
  shadow: {
    ...StyleSheet.absoluteFillObject,
    top: SHADOW_OFFSET,  // desplazada SHADOW_OFFSET px hacia abajo respecto al cuerpo
  },

  // El cuerpo flota encima de la sombra; al bajar (translateY) la tapa
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
  iconLeft:  { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});