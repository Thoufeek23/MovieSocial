// frontend/app/(tabs)/profile.jsx

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProfileTab() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.username) {
      // Redirect to the dynamic profile page
      router.replace(`/profile/${user.username}`);
    } else {
      // If no user, redirect to login
      router.replace('/login');
    }
  }, [user, router]);

  // Show loading while redirecting
  return <LoadingSpinner text="Loading profile..." />;
}