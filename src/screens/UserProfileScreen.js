import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, arrayRemove, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { colors, fonts, spacing, radius } from '../theme/colors';
import Button from '../components/ui/Button';

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

  const getLevelColor = () => {
    if (!userData?.level) return colors.level.basico;
    const level = userData.level.toLowerCase();
    return colors.level[level] || colors.level.basico;
  };

  const renderActionButton = () => {
    switch (friendshipStatus) {
      case 'loading':
        return <Button label="Cargando..." variant="secondary" loading />;
      case 'none':
        return <Button label="Enviar Solicitud de Amistad" variant="primary" onPress={handleFriendAction} />;
      case 'pending_sent':
        return <Button label="Solicitud Enviada" variant="secondary" disabled />;
      case 'pending_received':
        return <Button label="Aceptar Solicitud" variant="success" onPress={handleFriendAction} />;
      case 'friends':
        return <Button label="Eliminar Amigo" variant="danger" onPress={handleFriendAction} />;
      default:
        return <Button label="Cargando..." variant="secondary" loading />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.palette.amarillo.text} />
      </View>
    );
  }

  const levelColor = getLevelColor();
  const userInitial = userData?.name?.[0]?.toUpperCase() || '?';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.palette.azul.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Contenido Principal */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {userData && (
          <>
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: levelColor.bg }]}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>

            {/* Nombre */}
            <Text style={styles.name}>{userData.name}</Text>

            {/* Puntos */}
            <View style={styles.pointsContainer}>
              <Ionicons name="trophy" size={24} color={colors.palette.amarillo.text} />
              <Text style={styles.points}>
                {userData.points || 0} <Text style={styles.pointsLabel}>puntos</Text>
              </Text>
            </View>

            {/* Nivel */}
            {userData.level && (
              <View style={[styles.levelBadge, { backgroundColor: levelColor.bg }]}>
                <Text style={[styles.levelText, { color: levelColor.text }]}>
                  {userData.level.toUpperCase()}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Footer con Botón de Acción */}
      <View style={styles.footer}>
        {renderActionButton()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.textSecondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 4,
    borderColor: colors.bgCard,
    shadowColor: colors.textSecondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 56,
    fontFamily: fonts.extraBold,
    color: colors.textPrimary,
  },
  name: {
    fontSize: 32,
    fontFamily: fonts.extraBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  points: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.palette.amarillo.text,
    marginLeft: spacing.sm,
  },
  pointsLabel: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  levelBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  levelText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    letterSpacing: 1,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    shadowColor: colors.textSecondary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
