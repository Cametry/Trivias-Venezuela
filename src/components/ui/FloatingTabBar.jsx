// =============================================================
//  🇻🇪 Trivias Venezuela — Tab Bar Flotante (Pastilla)
//  Reemplaza el custom tab bar actual en AppNavigator.js
//
//  INSTALACIÓN: este componente se pasa como tabBar prop
//  en createMaterialTopTabNavigator (ver instrucciones abajo)
// =============================================================

import React, { useRef } from 'react';
import {
  Animated,
  Platform,
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

// ── Configuración de tabs ─────────────────────────────────────
const TABS = [
  { name: 'Home',         label: 'Inicio',  icon: 'home',       iconActive: 'home' },
  { name: 'Leaderboard', label: 'Ranking', icon: 'trophy-outline', iconActive: 'trophy' },
  { name: 'Profile',     label: 'Perfil',  icon: 'person-outline', iconActive: 'person' },
];

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outerWrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const isActive = state.index === index;
          const tab = TABS[index] || TABS[0];

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
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={22}
                color={isActive ? colors.tabBar.activeText : colors.tabBar.inactiveText}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
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
    // Sin fondo — se ve el fondo de la pantalla detrás
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: colors.tabBar.bg,
    borderRadius: radius.full,
    paddingVertical: 8,
    paddingHorizontal: 12,
    // Sombra iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    // Sombra Android
    elevation: 8,
    width: '100%',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: colors.tabBar.activeTab,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  tabLabelActive: {
    color: colors.tabBar.activeText,
  },
  tabLabelInactive: {
    color: colors.tabBar.inactiveText,
  },
});
