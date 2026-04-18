// =============================================================
//  🇻🇪 Trivias Venezuela — Componente Card Universal
//  Card con borde redondeado + sombra suave + acento de color
//
//  USO:
//    // Card simple
//    <Card>
//      <Text>Contenido aquí</Text>
//    </Card>
//
//    // Card con acento de color (borde izquierdo)
//    <Card accentColor={colors.amarillo.text}>
//      <Text>Card con acento amarillo</Text>
//    </Card>
//
//    // Card presionable
//    <Card onPress={() => navigation.navigate('Game', { category })}>
//      <Text>Presióname</Text>
//    </Card>
// =============================================================

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import colors from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function Card({
  children,
  onPress,
  accentColor,           // color del borde izquierdo de acento
  accentWidth = 4,
  style,
  contentStyle,
}) {
  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress
    ? { onPress, activeOpacity: 0.85 }
    : {};

  return (
    <Container
      style={[
        styles.card,
        accentColor && {
          borderLeftWidth: accentWidth,
          borderLeftColor: accentColor,
        },
        style,
      ]}
      {...containerProps}
    >
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xxl,
    // Sombra iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    // Sombra Android
    elevation: 4,
    marginBottom: spacing.sm,
    // Borde sutil
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    padding: spacing.md,
  },
});
