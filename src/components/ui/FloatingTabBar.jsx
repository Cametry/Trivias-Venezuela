import React, { useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { radius, spacing } from '../../theme/spacing';

const TABS = [
  { name: 'Home',        label: 'Inicio',  icon: 'home-outline',    iconActive: 'home'    },
  { name: 'Leaderboard', label: 'Ranking', icon: 'trophy-outline',  iconActive: 'trophy'  },
  { name: 'Profile',     label: 'Perfil',  icon: 'person-outline',  iconActive: 'person'  },
];

export default function FloatingTabBar({ state, descriptors, navigation, position }) {
  const insets = useSafeAreaInsets();
  const [pillWidth, setPillWidth] = useState(0);

  const TAB_COUNT  = state.routes.length;
  // Ancho real de cada tab en píxeles (se calcula una vez que onLayout dispara)
  const tabWidth   = pillWidth > 0 ? pillWidth / TAB_COUNT : 0;

  // translateX en píxeles reales — React Native no acepta porcentajes en transform
  const translateX = position.interpolate({
    inputRange:  state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * tabWidth),
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.outerWrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View
        style={styles.pill}
        onLayout={(e) => setPillWidth(e.nativeEvent.layout.width)}
      >
        {/* Indicador amarillo — solo se muestra cuando tenemos el ancho real */}
        {pillWidth > 0 && (
          <Animated.View
            style={[
              styles.slidingIndicator,
              {
                width: tabWidth,
                transform: [{ translateX }],
              },
            ]}
          />
        )}

        {state.routes.map((route, index) => {
          const isActive = state.index === index;
          const tab      = TABS[index] || TABS[0];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={22}
                color={isActive ? colors.palette.amarillo.text : colors.textMuted}
              />
              <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
    paddingVertical: 8,
    paddingHorizontal: 0,   // sin padding lateral — el indicador debe cubrir tab completo
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
    overflow: 'hidden',     // el indicador no se sale de la pastilla
  },
  slidingIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.palette.amarillo.bg,
    borderRadius: radius.full,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
    zIndex: 1,              // íconos y texto por encima del indicador
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  tabLabelActive: {
    color: colors.palette.amarillo.text,
  },
  tabLabelInactive: {
    color: colors.textMuted,
  },
});