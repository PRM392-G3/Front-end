import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import FollowingList from '../components/FollowingList';
import AppStatusBar from '../components/AppStatusBar';

interface FollowingScreenProps {
  route: {
    params: {
      userId: number;
    };
  };
}

const FollowingScreen: React.FC<FollowingScreenProps> = ({ route }) => {
  const { userId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <AppStatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <FollowingList userId={userId} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
});

export default FollowingScreen;
