import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc, deleteDoc, arrayUnion, documentId } from 'firebase/firestore';
import { colors, fonts, spacing, radius } from '../theme/colors';

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
        <ActivityIndicator size="large" color={colors.amarillo} />
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
        <ActivityIndicator size="large" color={colors.amarillo} />
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
        backgroundColor: colors.amarillo,
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
                color: isFocused ? colors.amarillo : colors.textMuted,
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Personalizado (Absoluto para mantener armonía) */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.bubbleBackButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backText} numberOfLines={1}>Regresar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Amigos</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  customHeader: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: spacing.md,
  },
  bubbleBackButton: {
    position: 'absolute',
    left: 10,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backText: {
    color: colors.textPrimary,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
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
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.azul,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
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
    color: colors.amarillo,
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
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error, // Usando rojo para rechazar
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
    backgroundColor: colors.rojo,
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
