import { useEffect, useState } from 'react';
import { auth, db, appId } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../types';

export const useAuthProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);

    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const profile = { uid: user.uid, ...docSnap.data() } as UserProfile;
        setUserProfile(profile);
      } else {
        const newProfile: Omit<UserProfile, 'uid'> = {
          displayName: user.displayName || 'Anonymous',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
        };
        try {
          await setDoc(userDocRef, newProfile);
          setUserProfile({ uid: user.uid, ...newProfile });
        } catch (error) {
          console.error('Error creating user profile:', error);
          setUserProfile({ uid: user.uid, ...newProfile });
        }
      }
    }, (error) => {
      console.error('Error syncing user profile:', error);
      const fallbackProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        email: user.email || '',
        photoURL: user.photoURL || undefined,
      };
      setUserProfile(fallbackProfile);
    });

    return () => unsubscribe();
  }, [user]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  return {
    user,
    userProfile,
    signInWithGoogle,
    signInWithGithub,
    signOutUser,
    setUserProfile,
  };
};
