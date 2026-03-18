// src/components/common/ActiveTimeDisplay.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  Clock,
  Coffee,
  AlertCircle,
  CheckCircle,
  Clock as LateIcon,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Fonts } from '../../utils/GlobalText';

const ActiveTimeDisplay = ({
  // Active Time Props
  punchInTime,
  isOnBreak,
  breakStartTime,

  // Status Banner Props
  isAbsent,
  isUserLate,
  isHalfDay,
  isPunchedIn,
  hasAnySessionToday,
  isEarlyLeave,
  todaysPunchIn,
  firstPunchIn,
  lastSession,
  lateMinutes,
  earlyLeaveMinutes,
  statusConfig,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const C = theme.colors;

  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [breakDuration, setBreakDuration] = useState('00:00');

  // Format time helper function
  const formatTime = time => {
    if (!time) return '--:-- --';
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format minutes helper
  const formatMinutes = minutes => {
    if (!minutes) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Get status icon component
  const StatusIcon = ({ size, color }) => {
    if (isAbsent) return <AlertCircle size={size} color={color} />;
    if (isUserLate || isHalfDay) return <LateIcon size={size} color={color} />;
    if (isPunchedIn) return <CheckCircle size={size} color={color} />;
    return <Clock size={size} color={color} />;
  };

  useEffect(() => {
    if (!punchInTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const punchIn = new Date(punchInTime);

      // Calculate total active time
      const totalDiffMs = now - punchIn;
      const totalHours = Math.floor(totalDiffMs / 3600000);
      const totalMins = Math.floor((totalDiffMs % 3600000) / 60000);
      const totalSecs = Math.floor((totalDiffMs % 60000) / 1000);

      setElapsedTime(
        `${totalHours.toString().padStart(2, '0')}:${totalMins
          .toString()
          .padStart(2, '0')}:${totalSecs.toString().padStart(2, '0')}`,
      );

      // Calculate current break duration if on break
      if (isOnBreak && breakStartTime) {
        const breakStart = new Date(breakStartTime);
        const breakDiffMs = now - breakStart;
        const breakMins = Math.floor(breakDiffMs / 60000);
        const breakSecs = Math.floor((breakDiffMs % 60000) / 1000);
        setBreakDuration(
          `${breakMins.toString().padStart(2, '0')}:${breakSecs
            .toString()
            .padStart(2, '0')}`,
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [punchInTime, isOnBreak, breakStartTime]);

  // Get border color based on status
  const getBorderColor = () => {
    if (isAbsent) return C.error + '40';
    if (isUserLate || isHalfDay) return C.warning + '40';
    if (isPunchedIn) return C.success + '40';
    if (hasAnySessionToday) return C.textSecondary + '40';
    return C.border;
  };

  return (
    <View style={styles.container}>
      {/* SINGLE CARD - Status + Active Time + Break Sab Ek Mein */}
      <View
        style={[
          styles.mainCard,
          {
            borderColor: getBorderColor(),
            backgroundColor: C.surface,
            borderWidth: 1,
          },
        ]}
      >
        {/* Section 1: Status Bar */}
        <View style={styles.statusSection}>
          <View style={styles.statusLeft}>
            <StatusIcon
              size={wp('4.5%')}
              color={statusConfig?.color || C.textSecondary}
            />
            <Text
              style={[
                styles.statusText,
                { color: statusConfig?.color || C.textSecondary },
              ]}
            >
              {statusConfig?.label || 'Unknown Status'}
            </Text>
          </View>

          <View style={styles.statusRight}>
            {isPunchedIn && (
              <Text style={[styles.statusTimeText, { color: C.textSecondary }]}>
                {t.attendance?.since || 'Since'}{' '}
                {formatTime(firstPunchIn || todaysPunchIn)}
              </Text>
            )}
          </View>
        </View>

        {/* Section 2: Last Punch Out (if applicable) */}
        {hasAnySessionToday && !isPunchedIn && !isAbsent && (
          <View style={styles.lastPunchSection}>
            <Text style={[styles.lastPunchText, { color: C.textSecondary }]}>
              {t.attendance?.lastPunchOut || 'Last punch out'}{' '}
              {formatTime(lastSession?.punchOut)}
            </Text>
          </View>
        )}

        {/* Section 3: Status Tags */}
        {(isUserLate || isHalfDay || isEarlyLeave) && (
          <View style={styles.tagsSection}>
            {isUserLate && isPunchedIn && (
              <View style={[styles.tag, { backgroundColor: C.error + '20' }]}>
                <Text style={[styles.tagText, { color: C.error }]}>
                  {t.attendance?.lateBy || 'Late'} {formatMinutes(lateMinutes)}
                </Text>
              </View>
            )}

            {isHalfDay && isPunchedIn && (
              <View style={[styles.tag, { backgroundColor: C.warning + '20' }]}>
                <Text style={[styles.tagText, { color: C.warning }]}>
                  {t.attendance?.halfDay || 'Half Day'}
                </Text>
              </View>
            )}

            {isEarlyLeave && (
              <View style={[styles.tag, { backgroundColor: C.warning + '20' }]}>
                <Text style={[styles.tagText, { color: C.warning }]}>
                  {t.attendance?.earlyLeave || 'Early'} (
                  {formatMinutes(earlyLeaveMinutes)})
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Section 4: Active Time Display */}
        {isPunchedIn && (
          <View style={styles.activeTimeSection}>
            <Clock size={wp('6%')} color={C.primary} />
            <View style={styles.activeTimeInfo}>
              <Text style={[styles.activeTimeLabel, { color: C.textSecondary }]}>
                {t.breaks?.activeTime || 'ACTIVE TIME'}
              </Text>
              <Text style={[styles.activeTimeValue, { color: C.primary }]}>
                {elapsedTime}
              </Text>
            </View>
             {/* Section 6: Punch In Time (footer) */}
        {punchInTime && (
          <View style={styles.footerSection}>
            <Text style={[styles.footerText, { color: C.textTertiary }]}>
              {t.attendance?.punchedInAt || 'Punched in at'}{' '}
              {formatTime(punchInTime)}
            </Text>
          </View>
        )}
          </View>
        )}

        {/* Section 5: Break Time (if on break) */}
        {/* {isOnBreak && (
          <View style={styles.breakSection}>
            <Coffee size={wp('5%')} color={C.warning} />
            <View style={styles.breakInfo}>
              <Text style={[styles.breakLabel, { color: C.textSecondary }]}>
                {t.breaks?.currentBreak || 'CURRENT BREAK'}
              </Text>
              <Text style={[styles.breakValue, { color: C.warning }]}>
                {breakDuration}
              </Text>
            </View>
          </View>
        )} */}

       
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: hp('2%'),
    width: '100%',
  },
  mainCard: {
    borderRadius: wp('4%'),
    borderWidth: 1,
    overflow: 'hidden',
    padding: wp('3%'),
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: wp('3.8%'),
    fontFamily: Fonts.semiBold,
  },
  statusTimeText: {
    fontSize: wp('3%'),
    fontFamily: Fonts.medium,
  },
  lastPunchSection: {
    marginBottom: hp('0.8%'),
    paddingLeft: wp('6.5%'), // Align with icon space
  },
  lastPunchText: {
    fontSize: wp('3%'),
    fontFamily: Fonts.medium,
    fontStyle: 'italic',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
    marginBottom: hp('1%'),
    paddingLeft: wp('6.5%'), // Align with icon space
  },
  tag: {
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    borderRadius: wp('4%'),
  },
  tagText: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.semiBold,
  },
  activeTimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    paddingVertical: hp('1%'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  activeTimeInfo: {
    flex: 1,
  },
  activeTimeLabel: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    marginBottom: hp('0.2%'),
  },
  activeTimeValue: {
    fontSize: wp('5%'),
    fontFamily: Fonts.bold,
  },
  breakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  breakInfo: {
    flex: 1,
  },
  breakLabel: {
    fontSize: wp('2.6%'),
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    marginBottom: hp('0.2%'),
  },
  breakValue: {
    fontSize: wp('4%'),
    fontFamily: Fonts.bold,
  },
  footerSection: {
    marginTop: hp('0.5%'),
    alignItems: 'flex-end',
    // borderTopWidth: 1,
    // borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: hp('0.8%'),
  },
  footerText: {
    fontSize: wp('2.6%'),
    fontFamily: Fonts.regular,
  },
});

export default ActiveTimeDisplay;