// =============================================================
//  🇻🇪 Trivias Venezuela — Sistema de Fuentes (Nunito)
//  Para usar Nunito, instala: expo install @expo-google-fonts/nunito
// =============================================================

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';

// ── Nombre de la fuente (para usar en fontFamily) ─────────────
export const fonts = {
  regular:   'Nunito_400Regular',
  semiBold:  'Nunito_600SemiBold',
  bold:      'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
};

// ── Hook para cargar fuentes (úsalo en App.js) ────────────────
export function useNunito() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  return fontsLoaded;
}

// ── Estilos tipográficos predefinidos ─────────────────────────
export const typography = {
  display: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    lineHeight: 34,
  },
  heading: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    lineHeight: 26,
  },
  subheading: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
};
