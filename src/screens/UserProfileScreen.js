import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { colors, fonts, spacing, radius } from '../theme/colors';

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState('loading'); // 'loading', 'none', 'pending_sent', 'pending_received', 'friends'

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          Alert.alert('Error', 'No se encontró el perfil del usuario.');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error obteniendo perfil: ', error);
        Alert.alert('Error', 'Hubo un problema al cargar el perfil.');
      }
    };

    const checkFriendshipStatus = async () => {
      try {
        const currentUserId = auth.currentUser.uid;

        // Primero verificar si userId está incluido en el array friends del usuario actual
        const currentUserRef = doc(db, 'users', currentUserId);
        const currentUserSnap = await getDoc(currentUserRef);
        if (currentUserSnap.exists()) {
          const currentUserData = currentUserSnap.data();
          const friendsArray = currentUserData.friends || [];
          if (friendsArray.includes(userId)) {
            setFriendshipStatus('friends');
            return;
          }
        }

        // Si no está en friends, hacer la consulta normal a friendships para ver si hay un 'pending'
        const q1 = query(
          collection(db, 'friendships'),
          where('requesterId', '==', currentUserId),
          where('receiverId', '==', userId)
        );
        const snap1 = await getDocs(q1);

        const q2 = query(
          collection(db, 'friendships'),
          where('requesterId', '==', userId),
          where('receiverId', '==', currentUserId)
        );
        const snap2 = await getDocs(q2);

        let relationDoc = null;
        if (!snap1.empty) {
          relationDoc = snap1.docs[0].data();
        } else if (!snap2.empty) {
          relationDoc = snap2.docs[0].data();
        }

        if (relationDoc) {
          if (relationDoc.status === 'accepted' || relationDoc.status === 'friends') {
            setFriendshipStatus('friends');
          } else if (relationDoc.status === 'pending') {
            if (relationDoc.requesterId === currentUserId) {
              setFriendshipStatus('pending_sent');
            } else {
              setFriendshipStatus('pending_received');
            }
          } else {
            setFriendshipStatus('none');
          }
        } else {
          setFriendshipStatus('none');
        }
      } catch (error) {
        console.error('Error verificando amistad:', error);
        setFriendshipStatus('none');
      }
    };

    const loadData = async () => {
      await fetchUserProfile();
      await checkFriendshipStatus();
      setLoading(false);
    };

    loadData();
  }, [userId, navigation]);

  const handleFriendAction = async () => {
    if (friendshipStatus === 'none') {
      try {
        setFriendshipStatus('loading');
        await addDoc(collection(db, 'friendships'), {
          requesterId: auth.currentUser.uid,
          receiverId: userId,
          status: 'pending',
          createdAt: serverTimestamp()
        });
        setFriendshipStatus('pending_sent');
      } catch (error) {
        console.error('Error al enviar solicitud:', error);
        Alert.alert('Error', 'No se pudo enviar la solicitud.');
        setFriendshipStatus('none');
      }
    } else if (friendshipStatus === 'pending_received') {
      Alert.alert('Próximamente', 'La función de aceptar solicitudes estará disponible pronto.');
    } else if (friendshipStatus === 'friends') {
      Alert.alert(
        '¿Eliminar amigo?',
        '¿Estás seguro de que deseas eliminar a este jugador de tu lista?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                setFriendshipStatus('loading');
                const currentUserId = auth.currentUser.uid;

                const q1 = query(
                  collection(db, 'friendships'),
                  where('requesterId', '==', currentUserId),
                  where('receiverId', '==', userId)
                );
                const snap1 = await getDocs(q1);

                const q2 = query(
                  collection(db, 'friendships'),
                  where('requesterId', '==', userId),
                  where('receiverId', '==', currentUserId)
                );
                const snap2 = await getDocs(q2);

                let docToDelete = null;
                if (!snap1.empty) {
                  docToDelete = snap1.docs[0];
                } else if (!snap2.empty) {
                  docToDelete = snap2.docs[0];
                }

                if (docToDelete) {
                  // Borrar el documento de friendships
                  await deleteDoc(doc(db, 'friendships', docToDelete.id));
                  // Usar arrayRemove para quitar los IDs de los arrays friends de ambos usuarios
                  const currentUserRef = doc(db, 'users', currentUserId);
                  const otherUserRef = doc(db, 'users', userId);
                  await Promise.all([
                    updateDoc(currentUserRef, { friends: arrayRemove(userId) }),
                    updateDoc(otherUserRef, { friends: arrayRemove(currentUserId) })
                  ]);
                  setFriendshipStatus('none');
                } else {
                  setFriendshipStatus('none');
                }
              } catch (error) {
                console.error('Error al eliminar amigo:', error);
                Alert.alert('Error', 'No se pudo eliminar al amigo.');
                setFriendshipStatus('friends');
              }
            }
          }
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.amarillo} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Absoluto */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.bubbleBackButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backText} numberOfLines={1}>Regresar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      {/* Cuerpo del Perfil */}
      <View style={styles.profileBody}>
        {userData && (
          <>
            <View style={styles.largeAvatar}>
              <Text style={styles.largeAvatarText}>
                {userData.name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.profileName}>{userData.name}</Text>

            <View style={styles.pointsContainer}>
              <Text style={styles.pointsIcon}>🏆</Text>
              <Text style={styles.profilePoints}>
                {userData.points || 0} <Text style={styles.pointsLabel}>pts totales</Text>
              </Text>
            </View>

            {userData.level && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{userData.level.toUpperCase()}</Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Footer Fijo */}
      <View style={styles.footerContainer}>
        {friendshipStatus === 'loading' ? (
          <View style={[styles.requestButton, { backgroundColor: colors.bgInput }]}>
            <ActivityIndicator color={colors.amarillo} />
          </View>
        ) : friendshipStatus === 'none' ? (
          <TouchableOpacity
            style={styles.requestButton}
            activeOpacity={0.8}
            onPress={handleFriendAction}
          >
            <Text style={styles.requestButtonText}>Enviar Solicitud de Amistad</Text>
          </TouchableOpacity>
        ) : friendshipStatus === 'pending_sent' ? (
          <View style={[styles.requestButton, { backgroundColor: colors.bgInput }]}>
            <Text style={[styles.requestButtonText, { color: colors.textMuted }]}>Solicitud Enviada</Text>
          </View>
        ) : friendshipStatus === 'pending_received' ? (
          <TouchableOpacity
            style={[styles.requestButton, { backgroundColor: colors.success }]}
            activeOpacity={0.8}
            onPress={handleFriendAction}
          >
            <Text style={styles.requestButtonText}>Aceptar Solicitud</Text>
          </TouchableOpacity>
        ) : friendshipStatus === 'friends' ? (
          <TouchableOpacity
            style={[styles.requestButton, { backgroundColor: colors.error }]}
            activeOpacity={0.8}
            onPress={handleFriendAction}
          >
            <Text style={styles.requestButtonText}>Eliminar Amigo</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  profileBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  largeAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.azul,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 4,
    borderColor: colors.borderLight,
    shadowColor: colors.azul,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  largeAvatarText: {
    fontSize: 48,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  profileName: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pointsIcon: {
    fontSize: 24,
    marginRight: 6,
  },
  profilePoints: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.amarillo,
  },
  pointsLabel: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  levelBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)', // verde claro
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.4)',
    marginTop: spacing.sm,
  },
  levelText: {
    color: '#2ECC71',
    fontFamily: fonts.semiBold,
    fontSize: 14,
    letterSpacing: 1,
  },
  footerContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  requestButton: {
    backgroundColor: colors.azul,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.azul,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  requestButtonText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
});
