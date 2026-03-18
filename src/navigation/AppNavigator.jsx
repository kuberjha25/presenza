import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import LoginScreen from '../screens/auth/Login';
import HomeScreen from '../screens/home/Home';
import VerifyOTP from '../screens/auth/VerifyOtp';
import DailyPunch from '../screens/home/punch/DailyPunch';
import ReportsScreen from '../screens/home/reports/ReportsScreen';
import AppLoader from '../components/loader/AppLoader';
import SlideableAlert from '../components/common/SlideableAlert';
import { checkAuthState, hideAlert } from '../store/actions/authActions';
import { debugStorage } from '../utils/keychainHelper';
import LeaveScreen from '../screens/home/leave/LeaveScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Stack = createNativeStackNavigator();

// ── Auth Stack ────────────────────────────────────
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Verify_Otp" component={VerifyOTP} />
    <Stack.Screen name='Settings' component={SettingsScreen}/>
  </Stack.Navigator>
);

// ── App Stack ─────────────────────────────────────
const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="DailyPuch" component={DailyPunch} />
    <Stack.Screen name="Reports" component={ReportsScreen} />
    <Stack.Screen name="Leave" component={LeaveScreen} />
    <Stack.Screen name='Settings' component={SettingsScreen}/>
  </Stack.Navigator>
);

// ── Root Navigator ────────────────────────────────
const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector(state => state.auth);
  const { alert } = useSelector(state => state.ui);

  useEffect(() => {
    debugStorage();
  }, []);

  useEffect(() => {
    console.log('🚀 App initializing...');
    dispatch(checkAuthState());
  }, [dispatch]);

  if (loading) {
    return <AppLoader />;
  }

  return (
    <View style={styles.container}>
      {/* 
        Rendering either AuthStack or AppStack based on isAuthenticated.
        When this value flips (login/logout), React unmounts the old stack
        and mounts the new one — no manual navigation.reset() needed.
      */}
      {isAuthenticated ? <AppStack /> : <AuthStack />}

      <SlideableAlert
        visible={alert.visible}
        message={alert.message}
        type={alert.type}
        onDismiss={() => dispatch(hideAlert())}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1128',
  },
});

export default AppNavigator;