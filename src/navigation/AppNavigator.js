import React, { useState, useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import {
  Text,
  ActivityIndicator,
  View,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { SafeAreaProvider } from "react-native-safe-area-context";
import FloatingTabBar from "../components/ui/FloatingTabBar";

// Screens
import CustomSplashScreen from "../screens/CustomSplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import GameScreen from "../screens/GameScreen";
import ResultScreen from "../screens/ResultScreen";
import ProfileScreen from "../screens/ProfileScreen";
import LeaderboardScreen from "../screens/LeaderboardScreen";
import SearchUsersScreen from "../screens/SearchUsersScreen";
import UserProfileScreen from "../screens/UserProfileScreen";
import ManageFriendsScreen from "../screens/ManageFriendsScreen";
import SettingsScreen from "../screens/SettingsScreen";

// Admin
import AdminDashboard from "../screens/admin/AdminDashboard";
import ManageCategories from "../screens/admin/ManageCategories";
import ManageQuestions from "../screens/admin/ManageQuestions";
import QuestionForm from "../screens/admin/QuestionForm";

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


function MainTabs() {
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: "Inicio" }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarLabel: "Ranking" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Perfil" }}
      />
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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator size="large" color={colors.amarillo.bg} />
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
          ) : user.role === "admin" ? (
            <Stack.Screen name="Admin" component={AdminStack} />
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Game" component={GameScreen} />
              <Stack.Screen name="Result" component={ResultScreen} />
              <Stack.Screen name="SearchUsers" component={SearchUsersScreen} />
              <Stack.Screen
                name="UserProfile"
                component={UserProfileScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ManageFriends"
                component={ManageFriendsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
