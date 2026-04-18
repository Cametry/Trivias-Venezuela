// =============================================================
//  🇻🇪 Trivias Venezuela — Sistema de Colores Pastel
//  Fondo base: #FFFDF5 (beige cálido, reemplazable por imagen)
//  Paleta inspirada en la bandera venezolana, tono pastel/suave
// =============================================================

const colors = {

  // ── Fondo principal ──────────────────────────────────────────
  // Este color es el "placeholder" del fondo.
  // Cuando tengas imágenes reales, usa <ImageBackground> encima.
  bg:         '#FFFDF5',   // Beige cálido — fondo de todas las pantallas
  bgCard:     '#FFFFFF',   // Blanco puro — cards y modales
  bgInput:    '#F5F2E8',   // Beige ligeramente más oscuro — inputs
  surface:    '#FBF9F0',   // Superficie secundaria — headers, secciones

  // ── Colores de la Bandera (Pastel) ───────────────────────────
  // Cada color tiene: bg (fondo del elemento) y text (texto/sombra)
  amarillo: {
    bg:     '#FFF3C4',   // Botón primario, tab activo, highlights
    text:   '#B8860B',   // Texto sobre fondo amarillo, sombra 3D
    dark:   '#8B6508',   // Sombra más oscura para efecto 3D profundo
  },
  azul: {
    bg:     '#C4D9FF',   // Botón secundario, avatares, info
    text:   '#1A4A8A',   // Texto sobre fondo azul
    dark:   '#0F2E5E',   // Sombra 3D
  },
  rojo: {
    bg:     '#FFD0CC',   // Botón destructivo, respuesta A del quiz
    text:   '#C0392B',   // Texto sobre fondo rojo
    dark:   '#8B1A13',   // Sombra 3D
  },

  // ── Colores Complementarios (Pastel) ─────────────────────────
  verde: {
    bg:     '#C8F0D8',   // Confirmaciones, respuesta C del quiz
    text:   '#1E7A45',
    dark:   '#0F4A28',
  },
  morado: {
    bg:     '#E8D5FF',   // Botón ghost/secundario, bordes suaves
    text:   '#6A35B0',
    dark:   '#3D1A70',
  },
  naranja: {
    bg:     '#FFE0B8',   // Nivel avanzado, respuesta D alternativa
    text:   '#C05A00',
    dark:   '#7A3800',
  },

  // ── Asignación por Respuesta de Quiz ─────────────────────────
  quiz: {
    A: { bg: '#FFD0CC', text: '#C0392B', badge: '#C0392B' },
    B: { bg: '#C4D9FF', text: '#1A4A8A', badge: '#1A4A8A' },
    C: { bg: '#C8F0D8', text: '#1E7A45', badge: '#1E7A45' },
    D: { bg: '#FFF3C4', text: '#B8860B', badge: '#B8860B' },
  },

  // ── Asignación por Categoría ──────────────────────────────────
  category: {
    deportes:    { bg: '#C4D9FF', text: '#1A4A8A' },
    folklore:    { bg: '#FFD0CC', text: '#C0392B' },
    gastronomia: { bg: '#FFE0B8', text: '#C05A00' },
    geografia:   { bg: '#C8F0D8', text: '#1E7A45' },
    historia:    { bg: '#E8D5FF', text: '#6A35B0' },
    musica:      { bg: '#FFF3C4', text: '#B8860B' },
    naturaleza:  { bg: '#C8F0D8', text: '#1E7A45' },
    personajes:  { bg: '#FFE0B8', text: '#C05A00' },
    tv:          { bg: '#FFD0CC', text: '#C0392B' },
    all:         { bg: '#FFF3C4', text: '#B8860B' }, // "De todo un poco"
  },

  // ── Colores de Nivel ──────────────────────────────────────────
  level: {
    basico:      { bg: '#C8F0D8', text: '#1E7A45' },
    intermedio:  { bg: '#C4D9FF', text: '#1A4A8A' },
    avanzado:    { bg: '#FFE0B8', text: '#C05A00' },
    experto:     { bg: '#FFD0CC', text: '#C0392B' },
  },

  // ── Texto ─────────────────────────────────────────────────────
  textPrimary:   '#2D2D2D',   // Texto principal (casi negro, no negro puro)
  textSecondary: '#888888',   // Texto secundario / subtítulos
  textMuted:     '#BBBBAA',   // Texto muy suave / placeholders

  // ── Bordes ────────────────────────────────────────────────────
  border:        '#EDE9D8',   // Borde estándar
  borderLight:   '#F5F2E8',   // Borde muy suave

  // ── Feedback ──────────────────────────────────────────────────
  success:       '#1E7A45',
  error:         '#C0392B',
  warning:       '#C05A00',

  // ── Tab Bar Flotante ─────────────────────────────────────────
  tabBar: {
    bg:           '#FFFFFF',
    shadow:       'rgba(0, 0, 0, 0.10)',
    activeTab:    '#FFF3C4',
    activeText:   '#B8860B',
    inactiveText: '#BBBBAA',
  },

  // ── Drawer / Menú lateral ────────────────────────────────────
  drawer: {
    bg:           '#FFFFFF',
    overlay:      'rgba(45, 45, 45, 0.30)',
  },
};

import { spacing, radius } from './spacing';
import { fonts } from './fonts';

export { colors, spacing, radius, fonts };

export const levelColors = {
  basico: colors.level.basico.bg,
  intermedio: colors.level.intermedio.bg,
  avanzado: colors.level.avanzado.bg,
  experto: colors.level.experto.bg,
};

export const categoryColors = {
  historia: colors.category.historia.bg,
  geografia: colors.category.geografia.bg,
  deportes: colors.category.deportes.bg,
  musica: colors.category.musica.bg,
  naturaleza: colors.category.naturaleza.bg,
  tv: colors.category.tv.bg,
  personajes: colors.category.personajes.bg,
  gastronomia: colors.category.gastronomia.bg,
  folklore: colors.category.folklore.bg,
  all: colors.category.all.bg,
};

export default colors;
