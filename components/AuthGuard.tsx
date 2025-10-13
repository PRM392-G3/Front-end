import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SplashScreen } from '@/components/SplashScreen';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect ngay lập tức nếu không có authentication
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Hiển thị splash screen khi đang kiểm tra authentication hoặc chưa xác thực
  if (isLoading || !isAuthenticated) {
    return <SplashScreen />;
  }

  // Nếu đã xác thực, hiển thị children
  return <>{children}</>;
};
