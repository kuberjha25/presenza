// src/components/common/CustomHeader.jsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Power } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Fonts } from '../../utils/GlobalText';
import logo from '../../assets/logo.png';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/actions/authActions';

const CustomHeader = ({
  title,
  showBack = false,
  onMenuPress,
  rightComponent,
  backgroundColor,
}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const C = theme.colors;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t.buttons.logout,
      t.alerts.logoutConfirm,
      [
        { text: t.buttons.cancel, style: 'cancel' },
        {
          text: t.buttons.logout,
          onPress: async () => await dispatch(logout()),
          style: 'destructive',
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <>
      <StatusBar barStyle={C.statusBar} backgroundColor={backgroundColor || C.headerBg} />
      <View style={[styles.container, { backgroundColor: backgroundColor || C.headerBg }]}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
              <ArrowLeft size={wp('5%')} color={C.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.logoSection}>
              <Image source={logo} style={[styles.logo, { borderColor: C.primary }]} />
              <Text style={[styles.appName, { color: C.primary }]}>Presenza</Text>
            </View>
          )}
        </View>

        {/* Center Section (Optional Title) */}
        {title && title !== 'Home' && (
          <View style={styles.centerSection}>
            <Text style={[styles.title, { color: C.textPrimary }]}>{title}</Text>
          </View>
        )}

        {/* Right Section */}
        <View style={styles.rightSection}>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Power size={wp('5.5%')} color={C.error} />
          </TouchableOpacity>
          {rightComponent}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'ios' ? hp('5%') : hp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    paddingVertical: hp('0.5%'),
    paddingTop: hp('1%'),
    paddingHorizontal: wp('2%'),
  },
  logo: {
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('50%'),
    borderWidth: 1,
    resizeMode: 'cover',
  },
  appName: {
    fontSize: wp('4%'),
    fontFamily: Fonts.medium,
    letterSpacing: wp('0.1%'),
  },
  title: {
    fontSize: wp('4.5%'),
    fontFamily: Fonts.medium,
  },
  iconButton: {
    padding: wp('2%'),
    paddingRight: wp('4%'),
  },
});

export default CustomHeader;