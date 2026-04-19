// =============================================================
//  🇻🇪 Trivias Venezuela — Sistema de Colores Pastel
//  Fondo base: #FFFDF5 (beige cálido, reemplazable por imagen)
//  Paleta inspirada en la bandera venezolana, tono pastel/suave
// =============================================================

const colors = {
  // ── Fondo principal ──────────────────────────────────────────
  bg: '#FFFDF5',
  bgCard: '#FFFFFF',
  bgInput: '#F5F2E8',
  surface: '#FBF9F0',

  // ── Colores Compatibles (¡VITAL para que las pantallas viejas no exploten!) ──
  // Se mantienen como texto plano para soportar cosas como: colors.amarillo + '55'
  amarillo: '#FFF3C4',
  azul: '#C4D9FF',
  rojo: '#FFD0CC',
  verde: '#C8F0D8',
  morado: '#E8D5FF',
  naranja: '#FFE0B8',

  // ── Paleta Completa (Para los nuevos componentes UI) ─────────
  // Las IAs deben usar colors.palette.amarillo.bg en el nuevo rediseño
  palette: {
    amarillo: { bg: '#FFF3C4', text: '#B8860B', dark: '#8B6508' },
    azul: { bg: '#C4D9FF', text: '#1A4A8A', dark: '#0F2E5E' },
    rojo: { bg: '#FFD0CC', text: '#C0392B', dark: '#8B1A13' },
    verde: { bg: '#C8F0D8', text: '#1E7A45', dark: '#0F4A28' },
    morado: { bg: '#E8D5FF', text: '#6A35B0', dark: '#3D1A70' },
    naranja: { bg: '#FFE0B8', text: '#C05A00', dark: '#7A3800' },
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
    deportes: { bg: '#C4D9FF', text: '#1A4A8A' },
    folklore: { bg: '#FFD0CC', text: '#C0392B' },
    gastronomia: { bg: '#FFE0B8', text: '#C05A00' },
    geografia: { bg: '#C8F0D8', text: '#1E7A45' },
    historia: { bg: '#E8D5FF', text: '#6A35B0' },
    musica: { bg: '#FFF3C4', text: '#B8860B' },
    naturaleza: { bg: '#C8F0D8', text: '#1E7A45' },
    personajes: { bg: '#FFE0B8', text: '#C05A00' },
    tv: { bg: '#FFD0CC', text: '#C0392B' },
    all: { bg: '#FFF3C4', text: '#B8860B' },
  },

  // ── Colores de Nivel ──────────────────────────────────────────
  level: {
    basico: { bg: '#C8F0D8', text: '#1E7A45' },
    intermedio: { bg: '#C4D9FF', text: '#1A4A8A' },
    avanzado: { bg: '#FFE0B8', text: '#C05A00' },
    experto: { bg: '#FFD0CC', text: '#C0392B' },
  },

  // ── Texto ─────────────────────────────────────────────────────
  textPrimary: '#2D2D2D',
  textSecondary: '#888888',
  textMuted: '#BBBBAA',

  // ── Bordes ────────────────────────────────────────────────────
  border: '#EDE9D8',
  borderLight: '#F5F2E8',

  // ── Feedback ──────────────────────────────────────────────────
  success: '#1E7A45',
  error: '#C0392B',
  warning: '#C05A00',

  // ── Tab Bar Flotante ─────────────────────────────────────────
  tabBar: {
    bg: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.10)',
    activeTab: '#FFF3C4',
    activeText: '#B8860B',
    inactiveText: '#BBBBAA',
  },

  // ── Drawer / Menú lateral ────────────────────────────────────
  drawer: {
    bg: '#FFFFFF',
    overlay: 'rgba(45, 45, 45, 0.30)',
  },
};

// Mantenemos tus importaciones separadas tal cual las tenías
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