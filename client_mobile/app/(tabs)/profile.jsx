import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
// CHANGED: Corrected import path to src/components/common/LoadingSpinner
import LoadingSpinner from '../../src/components/common/LoadingSpinner';

export default function ProfileTab() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.username) {
      router.push(`/profile/${user.username}`);
    } else {
      router.push('/login');
    }
  }, [user, router]);

  return <LoadingSpinner text="Loading profile..." />;
}