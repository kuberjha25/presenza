import * as Keychain from 'react-native-keychain';
import EncryptedStorage from 'react-native-encrypted-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVICE_ID = 'com.presenza.app.tokens';
const REFRESH_SERVICE_ID = 'com.presenza.app.refresh';

export const saveTokens = async (accessToken, refreshToken, user) => {
  try {
    console.log('💾 Saving tokens to AsyncStorage...');

    // Save access token
    await AsyncStorage.setItem(SERVICE_ID, accessToken);
    console.log('✅ Access token saved');

    // Save refresh token
    await AsyncStorage.setItem(REFRESH_SERVICE_ID, refreshToken);
    console.log('✅ Refresh token saved');

    // Save user data in EncryptedStorage
    await EncryptedStorage.setItem('user_data', JSON.stringify(user));
    console.log('✅ User data saved');

    // Also save in AsyncStorage for quick access
    await AsyncStorage.setItem('user', JSON.stringify(user));

    return true;
  } catch (error) {
    console.log('❌ Error saving tokens:', error);
    return false;
  }
};

// Get access token from AsyncStorage
export const getAccessToken = async () => {
  try {
    const token = await AsyncStorage.getItem(SERVICE_ID);
    console.log('🔑 Access token retrieved:', token);
    return token;
  } catch (error) {
    console.log('❌ Error getting access token:', error);
    return null;
  }
};

// Get refresh token from AsyncStorage
export const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem(REFRESH_SERVICE_ID);
  } catch (error) {
    console.log('❌ Error getting refresh token:', error);
    return null;
  }
};

// Get user from EncryptedStorage
export const getUser = async () => {
  try {
    const userData = await EncryptedStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.log('❌ Error getting user:', error);
    return null;
  }
};

// Debug function to see what's in AsyncStorage
export const debugStorage = async () => {
  try {
    console.log('🔍 DEBUG: Checking AsyncStorage contents');

    const accessToken = await AsyncStorage.getItem(SERVICE_ID);
    const refreshToken = await AsyncStorage.getItem(REFRESH_SERVICE_ID);
    const user = await AsyncStorage.getItem('user');

    console.log('Access token exists:', !!accessToken);
    console.log('Refresh token exists:', !!refreshToken);
    console.log('User exists:', !!user);

    return true;
  } catch (error) {
    console.log('Debug error:', error);
    return false;
  }
};

// Force clear all tokens
export const forceClearTokens = async () => {
  try {
    console.log('💪 Force clearing all tokens...');

    await AsyncStorage.multiRemove([SERVICE_ID, REFRESH_SERVICE_ID, 'user']);
    await EncryptedStorage.removeItem('user_data');
    await EncryptedStorage.clear();

    console.log('✅ All tokens cleared');
    return true;
  } catch (error) {
    console.log('❌ Force clear failed:', error);
    return false;
  }
};

// Clear tokens
export const clearTokens = async () => {
  try {
    console.log('🧹 Clearing all tokens...');

    await AsyncStorage.multiRemove([SERVICE_ID, REFRESH_SERVICE_ID, 'user']);
    await EncryptedStorage.removeItem('user_data');
    await EncryptedStorage.clear();

    console.log('✅ Tokens cleared');
    return true;
  } catch (error) {
    console.log('❌ Error clearing tokens:', error);
    return await forceClearTokens();
  }
};

// Reset everything
export const resetEverything = async () => {
  try {
    console.log('🔄 Resetting everything...');

    await AsyncStorage.multiRemove([SERVICE_ID, REFRESH_SERVICE_ID, 'user']);
    await EncryptedStorage.clear();
    await AsyncStorage.clear();

    console.log('✅ Everything reset');
    return true;
  } catch (error) {
    console.log('❌ Reset failed:', error);
    return false;
  }
};
