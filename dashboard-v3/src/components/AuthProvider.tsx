import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { setUser, clearUser, setLoading, setError } from '../store/slices/authSlice';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../types';
import { isAuthorizedEmail, createUserData } from '../utils/userRoles';

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
          const userEmail = firebaseUser.email || '';
          
          // Check if user is authorized
          if (!isAuthorizedEmail(userEmail)) {
            console.warn(`Unauthorized access attempt: ${userEmail}`);
            dispatch(setError(`Access denied. Only DuetRight team members can access this dashboard.`));
            
            // Sign out unauthorized user
            await signOut(auth);
            dispatch(clearUser());
            dispatch(setLoading(false));
            return;
          }
          
          // Get additional user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData: User;
          
          if (userDoc.exists()) {
            userData = userDoc.data() as User;
            
            // Update last login
            userData.lastLogin = new Date();
            userData.updatedAt = new Date();
            
            // Update user document
            await setDoc(userDocRef, userData, { merge: true });
          } else {
            // Create a new user document for authorized user
            userData = createUserData(firebaseUser);
            
            // Save to Firestore
            await setDoc(userDocRef, userData);
          }
          
          // Get the ID token
          const token = await firebaseUser.getIdToken();
          
          dispatch(setUser({ user: userData, token }));
        } catch (error: any) {
          console.error('Error loading user data:', error);
          
          // If it's an authorization error, show specific message
          if (error.message?.includes('Unauthorized email')) {
            dispatch(setError(error.message));
            await signOut(auth);
          } else {
            dispatch(setError('Failed to load user data. Please try again.'));
          }
          
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