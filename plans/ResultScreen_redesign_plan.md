# Plan de Rediseño - ResultScreen.js

## 📋 Análisis del Código Actual

**Archivo:** [`src/screens/ResultScreen.js`](src/screens/ResultScreen.js)

### Elementos que violan las reglas del rediseño:

1. **LinearGradient** (línea 6, 30, 65-71) - Prohibido según regla #3
2. **Colores legacy** - Usa `colors.amarillo`, `colors.azul`, `colors.success`, `colors.error` (strings) en lugar de `colors.palette.*`
3. **Fuente Inter** - El archivo importa `fonts` pero no se especifica si usa Nunito
4. **Botón personalizado** - Usa `TouchableOpacity` con `LinearGradient` en lugar del componente universal `Button`
5. **Ícono de categoría** - Muestra `{category.icon}` como texto (emoji) en lugar de usar `<IconMapper>`
6. **Fondo gradient** - Usa `colors.gradStart` y `colors.gradEnd` que no existen en el nuevo sistema

### Estructura actual:
- Fondo: LinearGradient con colores de gradiente
- Card central con animaciones de escala/fade
- Estadísticas en fila (puntos, correctas, incorrectas)
- Círculo de porcentaje con borde de color de categoría
- Botón "Jugar de nuevo" con gradient
- Enlace "← Categorías"

## 🎨 Propuesta de Rediseño

### 1. Fondo y Layout
- **Eliminar** `LinearGradient` completamente
- **Usar** fondo beige sólido `colors.bg` (`#FFFDF5`)
- **Mantener** animaciones de escala/fade (son válidas)
- **Aplicar** `useSafeAreaInsets()` correctamente

### 2. Sistema de Colores
- **Reemplazar** `colors.amarillo` → `colors.palette.amarillo.text`
- **Reemplazar** `colors.azul` → `colors.palette.azul.text` (para accentColor)
- **Reemplazar** `colors.success` → `colors.palette.verde.text`
- **Reemplazar** `colors.error` → `colors.palette.rojo.text`
- **Usar** `colors.category[category.id]` para colores de categoría

### 3. Tipografía
- **Asegurar** que todos los textos usen `fonts.regular`, `fonts.medium`, `fonts.bold`, etc.
- **Verificar** que Nunito esté cargada correctamente

### 4. Componentes UI
- **Reemplazar** botón personalizado por `<Button>` universal
- **Variant** del botón: `primary` (amarillo) o usar color de categoría
- **Icono** del botón: `refresh-outline` (Ionicons)
- **Usar** `<IconMapper>` para mostrar ícono de categoría
- **Mantener** card con `colors.bgCard` y bordes redondeados

### 5. Elementos Visuales
- **Círculo de porcentaje**: mantener pero con colores de palette
- **Estadísticas**: mejorar diseño con tarjetas pequeñas o badges
- **Emoji**: mantener pero considerar reemplazar por íconos Phosphor
- **Espaciado**: usar `spacing.md`, `spacing.lg`, etc.

## 🔧 Cambios Específicos por Línea

### Imports a modificar:
```js
// Eliminar
import { LinearGradient } from 'expo-linear-gradient';

// Mantener/agregar
import Button from '../components/ui/Button';
import IconMapper from '../utils/IconMapper';
```

### Variables a actualizar:
```js
// Línea 13: Reemplazar
const accentColor = categoryColors[category.id] || colors.azul;
// Por:
const cc = colors.category[category.id] || colors.palette.azul;
```

### Estructura JSX:
1. Reemplazar `<LinearGradient>` por `<View style={{flex: 1, backgroundColor: colors.bg}}>`
2. Reemplazar botón gradient por `<Button label="🔄 Jugar de nuevo" variant="primary" icon="refresh-outline" onPress={...} />`
3. Reemplazar `{category.icon} {category.name}` por `<IconMapper iconName={category.icon} color={cc.text} size={26} /> <Text>{category.name}</Text>`
4. Actualizar colores en `statNum`, `circleWrap`, `circleNum`

### Estilos a actualizar:
- `gradient` → eliminar
- `btn` y `btnGrad` → eliminar (usar Button component)
- Actualizar todos los colores hardcodeados
- Asegurar uso de `fonts.*` en todos los textos

## 📱 Diseño Visual Propuesto

### Layout:
```
[Safe Area Top]
  [Card Centrada]
    [Emoji Grande]
    [Mensaje: "¡Excelente!"]
    [Ícono Categoría + Nombre]
    
    [Fila Estadísticas]
      [Puntos] | [Correctas] | [Incorrectas]
    
    [Círculo Porcentaje]
      [75%]
      [Aciertos]
    
    [Button: "Jugar de nuevo"]
    [Enlace: "← Categorías"]
```

### Colores:
- **Fondo**: `colors.bg` (beige `#FFFDF5`)
- **Card**: `colors.bgCard` (blanco) con borde `colors.border`
- **Acento**: Color de categoría (ej: azul para deportes)
- **Texto**: `colors.textPrimary` para títulos, `colors.textSecondary` para subtítulos

### Animaciones:
- Mantener animaciones de entrada (scale + fade)
- Considerar animación para el círculo de porcentaje

## ✅ Checklist de Implementación

- [ ] Eliminar LinearGradient imports y usos
- [ ] Actualizar imports con Button e IconMapper
- [ ] Reemplazar fondo gradient por View con colors.bg
- [ ] Actualizar todos los colores a colors.palette.*
- [ ] Reemplazar botón personalizado por componente Button
- [ ] Implementar IconMapper para ícono de categoría
- [ ] Verificar uso de fuentes Nunito en todos los textos
- [ ] Ajustar espaciado con spacing constants
- [ ] Mantener animaciones existentes
- [ ] Preservar toda la lógica de negocio (cálculos, navegación)

## ⚠️ Consideraciones

1. **No modificar** la lógica de cálculo de porcentaje, emoji o mensaje
2. **Preservar** todos los `onPress` handlers
3. **Mantener** parámetros de navegación (`navigation.navigate('Game', { category })`)
4. **No introducir** nuevas dependencias
5. **Seguir** el patrón de otras pantallas rediseñadas (LoginScreen, RegisterScreen, HomeScreen)

## 📊 Prioridades

1. **Crítico**: Eliminar LinearGradient y usar colors.palette.*
2. **Alto**: Implementar Button component e IconMapper
3. **Medio**: Mejorar estética de estadísticas y círculo
4. **Bajo**: Optimizaciones menores de espaciado y tipografía

---

*Plan generado el 20/04/2026 - Basado en PROYECTO_CONTEXTO.md y AI_CONTEXT.md*