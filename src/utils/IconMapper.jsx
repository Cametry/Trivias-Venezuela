import React from 'react';
import {
  Football,
  MaskHappy,
  ForkKnife,
  Globe,
  ClockCounterClockwise,
  MusicNote,
  Leaf,
  Users,
  Television,
  GridFour,
  Question,
  GridNine,
  Baseball,
  GlobeHemisphereWest,
  Tree,
  Books,
} from 'phosphor-react-native';

// =============================================================
//  🇻🇪 Trivias Venezuela — IconMapper
//  Mapea las etiquetas de Firestore a íconos de Phosphor
//
//  ¿Quieres cambiar un ícono? Solo cambia el componente
//  en la tabla ICON_MAP de abajo. Ejemplo:
//    musica: { Component: Guitar, ... }
//
//  Pesos disponibles: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"
//  Documentación: https://phosphoricons.com
// =============================================================

// ── Tabla maestra: etiqueta de Firestore → ícono de Phosphor ──
//
//  Para cambiar el ícono de una categoría:
//  1. Ve a https://phosphoricons.com y busca el ícono que quieres
//  2. Agrégalo al import de arriba
//  3. Cambia el "Component" en la fila correspondiente
//
const ICON_MAP = {
  // Categorías actuales
  sports:   { Component: Baseball,               weight: 'bold' },
  mask:     { Component: MaskHappy,              weight: 'fill' },
  utensils: { Component: ForkKnife,              weight: 'fill' },
  globe:    { Component: GlobeHemisphereWest,    weight: 'fill' },
  history:  { Component: Books,                  weight: 'fill' },
  music:    { Component: MusicNote,              weight: 'fill' },
  leaf:     { Component: Tree,                   weight: 'fill' },
  user:     { Component: Users,                  weight: 'fill' },
  tv:       { Component: Television,             weight: 'fill' },
  all:      { Component: GridNine,               weight: 'fill' },
};

// ── Componente principal ──────────────────────────────────────
export default function IconMapper({
  iconName,
  color  = '#888888',
  size   = 24,
  weight,          // si no se pasa, usa el weight de la tabla
}) {
  const config = ICON_MAP[iconName];

  // Si no existe la etiqueta en la tabla, muestra un signo de interrogación
  if (!config) {
    return <Question size={size} color={color} weight="fill" />;
  }

  const { Component, weight: defaultWeight } = config;
  return (
    <Component
      size={size}
      color={color}
      weight={weight || defaultWeight}
    />
  );
}
