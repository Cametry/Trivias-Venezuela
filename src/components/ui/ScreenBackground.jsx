// =============================================================
//  🇻🇪 Trivias Venezuela — Fondo de Pantalla
//  Ahora: color sólido beige (#FFFDF5)
//  Futuro: reemplaza backgroundSource con una imagen real
//
//  USO ACTUAL (color sólido):
//    <ScreenBackground>
//      <Text>Contenido de la pantalla</Text>
//    </ScreenBackground>
//
//  USO FUTURO (con imagen):
//    <ScreenBackground backgroundSource={require('../../assets/bg/home.jpg')}>
//      <Text>Contenido de la pantalla</Text>
//    </ScreenBackground>
// =============================================================

import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';

export default function ScreenBackground({
  children,
  backgroundSource,     // imagen opcional (require(...))
  overlayOpacity = 0.3, // opacidad del overlay cuando hay imagen
  style,
}) {
  const insets = useSafeAreaInsets();

  // ── Con imagen de fondo ───────────────────────────────────────
  if (backgroundSource) {
    return (
      <ImageBackground
        source={backgroundSource}
        style={[styles.bg, style]}
        resizeMode="cover"
      >
        {/* Overlay para legibilidad del texto */}
        <View style={[styles.overlay, { opacity: overlayOpacity }]} />
        <View style={[styles.content, { paddingTop: insets.top }]}>
          {children}
        </View>
      </ImageBackground>
    );
  }

  // ── Sin imagen (color sólido beige) ───────────────────────────
  return (
    <View style={[styles.bg, { backgroundColor: colors.bg }, style]}>
      <View style={[styles.content, { paddingTop: insets.top }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFDF5',
  },
  content: {
    flex: 1,
  },
});
