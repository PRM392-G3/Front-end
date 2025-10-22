import React from 'react';
import CreatePostScreen from '@/screens/CreatePostScreen';
import { useRouter } from 'expo-router';

export default function CreateScreen() {
  const router = useRouter();
  
  const handleClose = () => {
    router.back();
  };

  return <CreatePostScreen onClose={handleClose} />;
}