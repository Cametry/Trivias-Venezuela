import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc, deleteDoc, arrayUnion, documentId } from 'firebase/firestore';
import { colors, fonts, spacing, radius } from '../theme/colors';
import ScreenBackground from '../components/ui/ScreenBackground';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

// Tab 1: Lista de Amigos
function FriendsList() {
  const navigation = useNavigation();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const fetchFriends = async () => {
      setLoading(true);
      try {
        // Obtener el documento del usuario actual para extraer su array friends
        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
          setFriends([]);
          return;
        }
        const userData = userSnap.data();
        const friendsArray = userData.friends || [];

        if (friendsArray.length === 0) {
          setFriends([]);
          return;
        }

        // La cláusula 'in' soporta máximo 30 elementos, dividir en chunks si es necesario
        const chunkSize = 30;
        const chunks = [];
        for (let i = 0; i < friendsArray.length; i += chunkSize) {
          chunks.push(friendsArray.slice(i, i + chunkSize));
        }

        const allUsers = [];
        for (const chunk of chunks) {
          const q = query(collection(db, 'users'), where(documentId(), 'in', chunk));
          const snapshot = await getDocs(q);
          snapshot.forEach(docSnap => {
            allUsers.push({ id: docSnap.id, ...docSnap.data() });
          });
        }

        // Mapear a la estructura esperada por el componente
        const friendsData = allUsers.map(user => ({
          id: user.id, // usar el ID del usuario como identificador
          requesterId: uid,
          receiverId: user.id,
          status: 'accepted',
          user: { id: user.id, ...user }
        }));
        setFriends(friendsData);
      } catch (error) {
        console.error("Error fetching friends:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  if (loading) {
    return (
      <View style={styles.tabContent}>
        <ActivityIndicator size="large" color={colors.palette.amarillo.text} />
      </View>
    );
  }

  if (friends.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.emptyText}>Aún no tienes amigos agregados</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestAvatar}>
        <Text style={styles.requestAvatarText}>{item.user.name?.[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{item.user.name}</Text>
        <Text style={styles.requestPoints}>{item.user.points || 0} pts</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.viewProfileButton}
          onPress={() => navigation.navigate('UserProfile', { userId: item.user.id })}
        >
          <Text style={styles.viewProfileButtonText}>Ver Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.md }}
      />
    </View>
  );
}

// Tab 2: Solicitudes Pendientes
function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'friendships'),
      where('receiverId', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const requestsData = await Promise.all(
          snapshot.docs.map(async (requestDoc) => {
            const data = requestDoc.data();
            const userDocRef = doc(db, 'users', data.requesterId);
            const userSnap = await getDoc(userDocRef);

            return {
              id: requestDoc.id,
              ...data,
              user: userSnap.exists() ? userSnap.data() : null
            };
          })
        );
        // Filtrar validos
        setRequests(requestsData.filter(r => r.user));
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const handleAccept = async (requestId) => {
    try {
      // Obtener el documento de la solicitud para saber los IDs
      const requestRef = doc(db, 'friendships', requestId);
      const requestSnap = await getDoc(requestRef);
      if (!requestSnap.exists()) return;
      const { requesterId, receiverId } = requestSnap.data();

      // Actualizar el estado de la solicitud a 'accepted'
      await updateDoc(requestRef, { status: 'accepted' });

      // Usar arrayUnion para agregar los IDs a los arrays friends de ambos usuarios
      const requesterRef = doc(db, 'users', requesterId);
      const receiverRef = doc(db, 'users', receiverId);
      await Promise.all([
        updateDoc(requesterRef, { friends: arrayUnion(receiverId) }),
        updateDoc(receiverRef, { friends: arrayUnion(requesterId) })
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo aceptar la solicitud.');
      console.error(error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await deleteDoc(doc(db, 'friendships', requestId));
    } catch (error) {
      Alert.alert('Error', 'No se pudo rechazar la solicitud.');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.tabContent}>
        <ActivityIndicator size="large" color={colors.palette.amarillo.text} />
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.emptyText}>No tienes solicitudes pendientes</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestAvatar}>
        <Text style={styles.requestAvatarText}>{item.user.name?.[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{item.user.name}</Text>
        <Text style={styles.requestPoints}>{item.user.points || 0} pts</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={() => handleAccept(item.id)}>
          <Text style={styles.actionButtonText}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleReject(item.id)}>
          <Text style={styles.actionButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.md }}
      />
    </View>
  );
}

const Tab = createMaterialTopTabNavigator();

function CustomTopTabBar({ state, descriptors, navigation, position, layout }) {
  const containerWidth = layout.width || Dimensions.get('window').width;
  const TAB_WIDTH = containerWidth / state.routes.length;
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'friendships'),
      where('receiverId', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
    });
    return unsubscribe;
  }, []);

  const translateX = position.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * TAB_WIDTH),
  });

  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Animated.View style={{
        position: 'absolute',
        bottom: -1,
        width: TAB_WIDTH,
        height: 3,
        backgroundColor: colors.palette.amarillo.text,
        transform: [{ translateX }],
        zIndex: 10,
      }} />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || route.name;
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.navigate(route.name)}
            style={{ flex: 1, paddingVertical: 14, alignItems: 'center' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{
                color: isFocused ? colors.palette.amarillo.text : colors.textMuted,
                fontFamily: fonts.bold,
                fontSize: 14,
              }}>
                {label}
              </Text>
              {label === 'Solicitudes' && pendingCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{pendingCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


export default function ManageFriendsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.md) }]}>
        {/* Header Personalizado */}
        <View style={styles.customHeader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.palette.azul.text} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Ionicons name="people" size={24} color={colors.palette.amarillo.text} />
            <Text style={styles.headerTitle}>Mis Amigos</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Navegador de Pestañas Superior */}
        <Tab.Navigator
          tabBar={props => <CustomTopTabBar {...props} />}
        >
          <Tab.Screen
            name="FriendsList"
            component={FriendsList}
            options={{ tabBarLabel: 'Amigos' }}
          />
          <Tab.Screen
            name="PendingRequests"
            component={PendingRequests}
            options={{ tabBarLabel: 'Solicitudes' }}
          />
        </Tab.Navigator>

        {/* Botón flotante "Buscar Amigos" */}
        <View style={styles.floatingButtonContainer}>
          <Button
            label="Buscar Amigos"
            variant="secondary"
            icon="search-outline"
            iconPosition="left"
            onPress={() => navigation.navigate('SearchUsers')}
            fullWidth={false}
            style={styles.floatingButton}
          />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.palette.azul.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: fonts.extraBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
    zIndex: 100,
  },
  floatingButton: {
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  tabContent: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  requestCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xxl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.palette.azul.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: colors.palette.azul.text,
  },
  requestAvatarText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  requestPoints: {
    color: colors.palette.amarillo.text,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: colors.palette.verde.bg,
  },
  rejectButton: {
    backgroundColor: colors.palette.rojo.bg,
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  viewProfileButton: {
    backgroundColor: colors.bgInput,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  viewProfileButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  tabBadge: {
    backgroundColor: colors.palette.rojo.text,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 11,
  },
});
