import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text, ActivityIndicator, View, TouchableOpacity, Animated, Dimensions } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import CustomSplashScreen from '../screens/CustomSplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import GameScreen from '../screens/GameScreen';
import ResultScreen from '../screens/ResultScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import SearchUsersScreen from '../screens/SearchUsersScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import ManageFriendsScreen from '../screens/ManageFriendsScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Admin
import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageCategories from '../screens/admin/ManageCategories';
import ManageQuestions from '../screens/admin/ManageQuestions';
import QuestionForm from '../screens/admin/QuestionForm';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
  },
};

const Stack = createStackNavigator();
const Tab = createMaterialTopTabNavigator();

const screenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: colors.bg },
};

function TabIcon({ name, focused }) {
  const icons = {
    Home: focused ? '🏠' : '🏠',
    Profile: focused ? '👤' : '👤',
    Leaderboard: focused ? '🏆' : '🥇',
  };
  return <Text style={{ fontSize: 20 }}>{icons[name] || '●'}</Text>;
}

// Agregamos "layout" a las propiedades que recibimos
function CustomBottomTabBar({ state, descriptors, navigation, position, layout }) {

  // Usamos el ancho real del contenedor de la app, y si por un microsegundo 
  // no está listo, usamos el ancho de la ventana como plan B.
  const containerWidth = layout.width || Dimensions.get('window').width;
  const TAB_WIDTH = containerWidth / state.routes.length;

  // Magia de animación: Atamos el movimiento a la posición del swipe
  const translateX = position.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * TAB_WIDTH),
  });

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.bgCard,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: 65,
      elevation: 0,
    }}>

      {/* 🚀 LA BARRITA ANIMADA 🚀 */}
      <Animated.View style={{
        position: 'absolute',
        top: -1,
        width: TAB_WIDTH,
        height: 3,
        backgroundColor: colors.amarillo,
        transform: [{ translateX }],
        zIndex: 10,
      }} />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;

        const isFocused = state.index === index;
        const color = isFocused ? colors.amarillo : colors.textMuted;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={index}
            onPress={onPress}
            activeOpacity={0.8}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            {/* Renderizamos el ícono fijo */}
            <TabIcon name={route.name} />

            {/* Renderizamos el texto */}
            <Text style={{
              color: color,
              fontFamily: 'Inter_500Medium',
              fontSize: 11,
              marginTop: 4
            }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={props => <CustomBottomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ tabBarLabel: 'Ranking' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="ManageCategories" component={ManageCategories} />
      <Stack.Screen name="ManageQuestions" component={ManageQuestions} />
      <Stack.Screen name="QuestionForm" component={QuestionForm} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (user === null) {
      setShowSplash(true);
    }
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.amarillo} />
      </View>
    );
  }

  if (showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={MyTheme}>
        <Stack.Navigator screenOptions={screenOptions}>
          {!user ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : user.role === 'admin' ? (
            <Stack.Screen name="Admin" component={AdminStack} />
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Game" component={GameScreen} />
              <Stack.Screen name="Result" component={ResultScreen} />
              <Stack.Screen name="SearchUsers" component={SearchUsersScreen} />
              <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ManageFriends" component={ManageFriendsScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
