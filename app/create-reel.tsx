import React from 'react';
import CreateReelScreen from '@/screens/CreateReelScreen';
import { useRouter } from 'expo-router';

export default function CreateReelRoute() {
  const router = useRouter();
  
  const handleClose = () => {
    router.back();
  };

  const handleReelCreated = () => {
    // Navigate back to reels tab to refresh the list
    router.push('/(tabs)/reels');
  };

  return <CreateReelScreen onClose={handleClose} onReelCreated={handleReelCreated} />;
}
