// src/components/layout/MainLayout.jsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTheme } from '../../context/ThemeContext';
import CustomHeader from '../common/CustomHeader';
import BottomNavigator from '../common/BottomNavigator';

const MainLayout = ({ 
  children, 
  title, 
  showBack = false,
  showMenu = false,
  headerRightComponent,
  headerBackgroundColor,
  hideBottomNav = false,
  onMenuPress
}) => {
  const { theme } = useTheme();
  const C = theme.colors;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <CustomHeader
        title={title}
        showBack={showBack}
        showMenu={showMenu}
        onMenuPress={onMenuPress}
        rightComponent={headerRightComponent}
        backgroundColor={headerBackgroundColor || C.headerBg}
      />

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {/* Bottom Navigation */}
      {!hideBottomNav && <BottomNavigator />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('2%'),
  },
});

export default MainLayout;