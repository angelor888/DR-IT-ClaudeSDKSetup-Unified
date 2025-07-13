import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { setUser, clearUser, setLoading } from '../store/slices/authSlice';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '../types';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      dispatch(setLoading(true));
      
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData: User;
          
          if (userDoc.exists()) {
            userData = userDoc.data() as User;
          } else {
            // Create a new user document if it doesn't exist
            userData = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Unknown User',
              role: 'user',
              avatar: firebaseUser.photoURL || undefined,
              lastLogin: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            // Save to Firestore
            await import('firebase/firestore').then(({ setDoc }) => 
              setDoc(userDocRef, userData)
            );
          }
          
          // Get the ID token
          const token = await firebaseUser.getIdToken();
          
          dispatch(setUser({ user: userData, token }));
        } catch (error) {
          console.error('Error loading user data:', error);
          dispatch(clearUser());
        }
      } else {
        dispatch(clearUser());
      }
      
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthProvider;