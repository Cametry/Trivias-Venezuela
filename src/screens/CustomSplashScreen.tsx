import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, Platform, ActivityIndicator } from 'react-native';
import { Asset } from 'expo-asset';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');
const CONTAINER_SIZE = Math.min(width * 0.8, 300);

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export default function CustomSplashScreen({ onFinish }: { onFinish: () => void }) {
  // 1. Estados de control estrictos
  const [isAppReady, setIsAppReady] = useState(false);

  // Valores de animación
  const circleScale = useRef(new Animated.Value(0)).current;
  const yellowY = useRef(new Animated.Value(-800)).current;
  const blueY = useRef(new Animated.Value(-800)).current;
  const redY = useRef(new Animated.Value(-800)).current;
  const rotacionGlobal = useRef(new Animated.Value(0)).current;

  // 2. PRECARGA DE IMÁGENES (La magia de Expo)
  useEffect(() => {
    async function preloadAssets() {
      try {
        // Obligamos al sistema a meter estos archivos pesados en la caché
        await Asset.loadAsync([
          require('../../assets/circulo_base.png'),
          require('../../assets/inter_amarilla.png'),
          require('../../assets/inter_azul.png'),
          require('../../assets/inter_roja.png'),
        ]);
      } catch (e) {
        console.warn('Error cargando assets:', e);
      } finally {
        // Solo cuando la promesa se resuelve, le decimos a la UI que está lista
        setIsAppReady(true);
      }
    }

    preloadAssets();
  }, []);

  // 3. COREOGRAFÍA (Solo arranca cuando isAppReady es true)
  useEffect(() => {
    if (!isAppReady) return;

    // Pequeño respiro de 100ms solo para que el DOM/UI termine de pintar
    const paintDelay = setTimeout(() => {

      Animated.spring(circleScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();

      Animated.stagger(200, [
        Animated.spring(yellowY, { toValue: 0, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(blueY, { toValue: 0, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(redY, { toValue: 0, useNativeDriver: USE_NATIVE_DRIVER })
      ]).start(({ finished }) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotacionGlobal, { toValue: 1, duration: 800, useNativeDriver: USE_NATIVE_DRIVER }),
            Animated.timing(rotacionGlobal, { toValue: -1, duration: 800, useNativeDriver: USE_NATIVE_DRIVER }),
            Animated.timing(rotacionGlobal, { toValue: 0, duration: 800, useNativeDriver: USE_NATIVE_DRIVER })
          ])
        ).start();
      });

    }, 100);

    // Navegación (Solo cuenta el tiempo DESPUÉS de que las imágenes cargaron)
    const navDelay = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 4000); // 4 segundos de animación garantizada

    return () => {
      clearTimeout(paintDelay);
      clearTimeout(navDelay);
    };
  }, [isAppReady, onFinish]);

  const rotacionInt = rotacionGlobal.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });

  const getCombinedStyle = (translateAnim: Animated.Value) => ({
    transform: [
      { translateY: translateAnim },
      { rotate: rotacionInt }
    ] as any,
  });

  // 4. MIENTRAS CARGA: Mostramos un loader o fondo negro
  if (!isAppReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.amarillo || '#FFD700'} />
      </View>
    );
  }

  // 5. RENDERIZADO FINAL: Ya está todo en memoria
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Animated.Image
          source={require('../../assets/circulo_base.png')}
          style={[styles.image, { transform: [{ scale: circleScale }] as any }]}
          resizeMode="contain"
          fadeDuration={0}
        />
        <Animated.Image
          source={require('../../assets/inter_amarilla.png')}
          style={[styles.image, getCombinedStyle(yellowY)]}
          resizeMode="contain"
          fadeDuration={0}
        />
        <Animated.Image
          source={require('../../assets/inter_azul.png')}
          style={[styles.image, getCombinedStyle(blueY)]}
          resizeMode="contain"
          fadeDuration={0}
        />
        <Animated.Image
          source={require('../../assets/inter_roja.png')}
          style={[styles.image, getCombinedStyle(redY)]}
          resizeMode="contain"
          fadeDuration={0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});