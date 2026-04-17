import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getLevelFromCorrect } from '../utils/levels';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Persistencia de sesión: escucha cambios en el estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            // Normalize level to lowercase to always match levelColors keys
            if (data.level) data.level = data.level.toLowerCase();
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...data });
          } else {
            // El documento aún no existe (caso borde), solo usar datos de auth
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
          }
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Limpia el listener al desmontar
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged actualizará el estado automáticamente
      return credential.user;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const register = async (email, password, name) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = credential.user;

      // Crea el documento del usuario en Firestore
      await setDoc(doc(db, 'users', uid), {
        email,
        name,
        role: 'user',
        points: 0,
        level: 'basico',
        questionsAnswered: 0,
        createdAt: new Date(),
      });

      // onAuthStateChanged actualizará el estado automáticamente
      return credential.user;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  const addScore = async (pointsToAdd, correctAnswers) => {
    if (!user || user.role === 'admin') return;
    try {
      const newQuestionsAnswered = (user.questionsAnswered || 0) + correctAnswers;
      const newPoints = (user.points || 0) + pointsToAdd;
      const newLevel = getLevelFromCorrect(newQuestionsAnswered);

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        points: newPoints,
        level: newLevel,
        questionsAnswered: newQuestionsAnswered,
      });

      const updated = { ...user, points: newPoints, level: newLevel, questionsAnswered: newQuestionsAnswered };
      setUser(updated);
      return updated;
    } catch (error) {
      console.error('Error al actualizar puntuación:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, addScore }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
