// src/screens/home/Home.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useDispatch, useSelector } from 'react-redux';
import {
  Clock,
  Timer,
  CalendarDays,
  SquareChartGantt,
  ChevronDown,
  Coffee,
  User,
  MapPin,
  LogIn,
  LogOut,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  Mail,
} from 'lucide-react-native';
import MainLayout from '../../components/layout/MainLayout';
import { setAlert } from '../../store/actions/authActions';
import {
  getAttendanceHistory,
  punchOut,
  breakIn,
  breakOut,
} from '../../store/actions/attendanceActions';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Fonts } from '../../utils/GlobalText';
import {
  formatDuration,
  formatAttendanceDuration,
  formatMinutesToHours,
} from '../../utils/utils';
import BreakReasonModal from '../../components/modals/BreakReasonModal';
import BreakStatusBar from '../../components/common/BreakStatusBar';
import ActiveTimeDisplay from '../../components/common/ActiveTimeDisplay';
import { getEmployeeProfile } from '../../store/actions/employeeActions';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const C = theme.colors;

  const { user } = useSelector(state => state.auth);
  const {
    history,
    historyLoading,
    punchOutLoading,
    breakLoading,
    activeBreak,
    currentStatus,
  } = useSelector(state => state.attendance);

  const [isProcessing, setIsProcessing] = useState(false);
  const [durationFormat, setDurationFormat] = useState('auto');
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [breakModalVisible, setBreakModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const timerRef = useRef(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = history?.find(r => r.date.split('T')[0] === today);
  const sessions = todayRecord?.sessions || [];
  const lastSession = sessions[sessions.length - 1];
  const todaysPunchIn = lastSession?.punchIn;
  const todaysPunchOut = lastSession?.punchOut;
  const lastImage = lastSession?.punchInLocation?.imageUrl;

  // Core Status Logic
  const attendanceStatus =
    todayRecord?.attendanceStatus || todayRecord?.status || 'ABSENT';
  const isAbsent = attendanceStatus === 'ABSENT';
  const isPunchedIn = todayRecord?.isPunchedIn === true; // Currently punched in (active session)
  const hasAnySessionToday = sessions.length > 0; // Has at least one session today

  // Break Status
  const isOnBreak =
    !!activeBreak || lastSession?.breaks?.some(b => !b.breakOut);
  const currentBreak = isOnBreak
    ? activeBreak || lastSession?.breaks?.find(b => !b.breakOut)
    : null;

  // Derived Status
  const isUserLate = todayRecord?.isLate === true;
  const isHalfDay = todayRecord?.isHalfDay === true;
  const lateMinutes = todayRecord?.lateMinutes || 0;
  const earlyLeaveMinutes = todayRecord?.earlyLeaveMinutes || 0;
  const isEarlyLeave = todayRecord?.isEarlyLeave === true;
  const morningShortLeave =
    todayRecord?.morningShortLeave?.isShortLeave || false;
  const eveningShortLeave =
    todayRecord?.eveningShortLeave?.isShortLeave || false;
  const morningShortLeaveMinutes = todayRecord?.morningShortLeave?.minutes || 0;
  const eveningShortLeaveMinutes = todayRecord?.eveningShortLeave?.minutes || 0;
  const breakCount = todayRecord?.breakCount || 0;

  // Calculations
  const totalMinutes = sessions.reduce(
    (t, s) => t + (s.durationMinutes || 0),
    0,
  );
  const totalBreakMinutes = sessions.reduce(
    (t, s) =>
      t + (s.breaks || []).reduce((bt, b) => bt + (b.durationMinutes || 0), 0),
    0,
  );

  const userName = user?.name || user?.email?.split('@')[0] || 'User';
  const formattedName =
    userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase();

  useEffect(() => {
    timerRef.current = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    loadAttendanceHistory();
  }, []);

  const loadAttendanceHistory = async () => {
    try {
      await dispatch(getAttendanceHistory());
    } catch (e) {
      console.log('Error loading attendance:', e);
    }
  };

  const loadEmployeeProfile = async () => {
    try {
      await dispatch(getEmployeeProfile());
    } catch (e) {
      console.log('Error loading profile:', e);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadAttendanceHistory(), loadEmployeeProfile()]);
    setRefreshing(false);
  }, []);

  const handleQuickActionPress = label => {
    if (isProcessing || breakLoading) return;

    switch (label) {
      case t.home.dailyPunch:
        // User can always punch in regardless of previous sessions
        if (isPunchedIn) {
          dispatch(
            setAlert(
              t.alerts.alreadyPunchedIn || 'You are already punched in',
              'error',
            ),
          );
          return;
        }
        navigation.navigate('DailyPuch');
        break;
      case t.home.idleTracking:
        if (!isPunchedIn) {
          dispatch(setAlert(t.alerts.punchInFirst, 'error'));
          return;
        }
        if (isOnBreak) {
          dispatch(setAlert(t.alerts.alreadyOnBreak, 'error'));
          return;
        }
        setBreakModalVisible(true);
        break;
      case t.home.reports:
        navigation.navigate('Reports');
        break;
      case t.home.leaveManagement:
        navigation.navigate('Leave');
        break;
      default:
        dispatch(
          setAlert(
            `✨ ${label} ${t.buttons.comingSoon || 'Coming Soon!'}`,
            'info',
          ),
        );
    }
  };

  const handleBreakIn = async (breakType, remarks) => {
    try {
      setIsProcessing(true);
      const result = await dispatch(breakIn(breakType, remarks));
      if (result?.success) {
        setBreakModalVisible(false);
        dispatch(setAlert(t.alerts.breakStarted, 'success'));
      } else if (!result?.message?.includes('already on a break')) {
        dispatch(
          setAlert(
            result?.message || t.breaks.confirm + ' ' + t.alerts.failed,
            'error',
          ),
        );
      }
    } catch {
      dispatch(setAlert(t.alerts.serverError, 'error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBreakOut = async () => {
    if (isProcessing || breakLoading) return;

    Alert.alert(t.breaks.endBreak, t.alerts.endBreakConfirm, [
      { text: t.buttons.cancel, style: 'cancel' },
      {
        text: t.alerts.yesEndBreak,
        style: 'destructive',
        onPress: async () => {
          try {
            setIsProcessing(true);
            const result = await dispatch(
              breakOut(currentBreak?.breakType || 'LUNCH', 'Break ended'),
            );
            if (result?.success) {
              dispatch(setAlert(t.alerts.breakEnded, 'success'));
            } else {
              dispatch(
                setAlert(
                  result?.message || t.breaks.endBreak + ' ' + t.alerts.failed,
                  'error',
                ),
              );
            }
          } catch {
            dispatch(setAlert(t.alerts.serverError, 'error'));
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  const handlePunchOut = async () => {
    if (isProcessing || punchOutLoading) return;

    if (isOnBreak) {
      Alert.alert(t.alerts.cannotPunchOut, t.alerts.endBreakFirst, [
        { text: t.buttons.ok || 'OK' },
      ]);
      return;
    }

    Alert.alert(t.attendance.punchOut, t.alerts.punchOutConfirm, [
      { text: t.buttons.cancel, style: 'cancel' },
      {
        text: t.alerts.yesPunchOut,
        style: 'destructive',
        onPress: async () => {
          try {
            setIsProcessing(true);
            const result = await dispatch(punchOut());
            if (result?.success) {
              dispatch(setAlert(t.alerts.punchOutSuccess, 'success'));
            } else {
              dispatch(
                setAlert(
                  result?.message ||
                    t.attendance.punchOut + ' ' + t.alerts.failed,
                  'error',
                ),
              );
            }
          } catch {
            dispatch(setAlert(t.alerts.serverError, 'error'));
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  const getFormattedDuration = minutes => {
    if (!minutes && minutes !== 0) return '---';
    if (minutes === 0) return '0 ' + (t.attendance.min || 'min');

    switch (durationFormat) {
      case 'hours':
        return formatAttendanceDuration(minutes);
      case 'days': {
        const d = (minutes / (24 * 60)).toFixed(1);
        return `${d} ${
          d === '1.0' ? t.attendance.day : t.attendance.days || 'days'
        }`;
      }
      case 'weeks': {
        const w = (minutes / (7 * 24 * 60)).toFixed(1);
        return `${w} ${
          w === '1.0' ? t.attendance.week : t.attendance.weeks || 'weeks'
        }`;
      }
      default:
        return formatDuration(minutes);
    }
  };

  const formatMinutes = minutes => {
    if (!minutes && minutes !== 0) return '---';
    if (minutes >= 60) {
      return formatMinutesToHours(minutes);
    }
    return `${minutes} ${t.attendance.min || 'min'}`;
  };

  const formatTime = ds => {
    if (!ds) return '--:-- --';
    try {
      return new Date(ds).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '--:-- --';
    }
  };

  const formatDate = ds => {
    if (!ds) return '';
    try {
      return new Date(ds).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getGreeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return t.greeting.morning;
    if (h < 17) return t.greeting.afternoon;
    return t.greeting.evening;
  };

  const getStatusConfig = () => {
    if (isAbsent) {
      return {
        label: t.attendance.absent || 'ABSENT',
        color: C.error,
        icon: XCircle,
      };
    }
    if (isOnBreak) {
      return {
        label: t.breaks.onBreak,
        color: C.warning,
        icon: Coffee,
      };
    }
    if (isPunchedIn) {
      if (isHalfDay) {
        return {
          label: t.attendance.halfDay || 'Half Day',
          color: C.warning,
          icon: CheckCircle2,
        };
      }
      if (isUserLate) {
        return {
          label: t.attendance.lateLogin || 'Late Login',
          color: C.warning,
          icon: CheckCircle2,
        };
      }
      return {
        label: t.attendance.present || 'PRESENT',
        color: C.success,
        icon: CheckCircle2,
      };
    }
    if (hasAnySessionToday) {
      return {
        label: t.attendance.punchedOut || 'PUNCHED OUT',
        color: C.textSecondary,
        icon: LogOut,
      };
    }
    return {
      label: t.attendance.notMarked || 'Not Marked',
      color: C.textSecondary,
      icon: AlertCircle,
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const isLoading =
    historyLoading ||
    punchOutLoading ||
    breakLoading ||
    isProcessing ||
    refreshing;

  const quickActions = [
    { label: t.home.dailyPunch, icon: Timer, color: C.primary },
    { label: t.home.idleTracking, icon: Coffee, color: C.warning },
    { label: t.home.leaveManagement, icon: CalendarDays, color: C.success },
    { label: t.home.reports, icon: SquareChartGantt, color: C.info },
  ];

  const formatOptions = [
    { label: t.attendance.auto || 'Auto', value: 'auto' },
    { label: t.attendance.hours || 'Hours', value: 'hours' },
    { label: t.attendance.days || 'Days', value: 'days' },
    { label: t.attendance.weeks || 'Weeks', value: 'weeks' },
  ];

  const { profile, loading, error } = useSelector(
    state => state.employeeProfile,
  );
  const fullName = profile?.[0]?.fullName || '';
  const firstName = fullName.split(' ')[0] || 'Guest';

  const reportingManager = profile?.[0]?.reportingTo;
  const managerName = reportingManager?.name || 'Manager';
  const managerEmail = reportingManager?.email || '';
  const managerPhone = reportingManager?.phone || '';

  const renderShortLeaveInfo = () => {
    if (morningShortLeave || eveningShortLeave) {
      return (
        <View
          style={[
            styles.shortLeaveContainer,
            { backgroundColor: C.info + '08', borderColor: C.info + '30' },
          ]}
        >
          {morningShortLeave && (
            <Text style={[styles.shortLeaveText, { color: C.info }]}>
              {t.attendance.morningShortLeave || 'Morning Short Leave'}:{' '}
              {formatMinutes(morningShortLeaveMinutes)}
            </Text>
          )}
          {eveningShortLeave && (
            <Text style={[styles.shortLeaveText, { color: C.info }]}>
              {t.attendance.eveningShortLeave || 'Evening Short Leave'}:{' '}
              {formatMinutes(eveningShortLeaveMinutes)}
            </Text>
          )}
        </View>
      );
    }
    return null;
  };

  const handleContactManager = type => {
    if (type === 'email' && managerEmail) {
      Alert.alert('Contact Manager', `Email: ${managerEmail}`);
    } else if (type === 'phone' && managerPhone) {
      Alert.alert('Contact Manager', `Phone: ${managerPhone}`);
    } else {
      Alert.alert('Info', 'Manager contact information not available');
    }
  };

  const shouldShowPunchOut = () => {
    return isPunchedIn && !isOnBreak;
  };

  const shouldShowBreakEnd = () => {
    return isOnBreak;
  };

  return (
    <>
      {isProcessing && (
        <View style={[styles.overlay, { backgroundColor: C.overlayBg }]}>
          <View
            style={[
              styles.overlayCard,
              { backgroundColor: C.surfaceSolid, borderColor: C.border },
            ]}
          >
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={[styles.overlayText, { color: C.textPrimary }]}>
              {t.attendance.processing}
            </Text>
          </View>
        </View>
      )}
      <MainLayout hideBottomNav={false}>
        <StatusBar barStyle={C.statusBar} backgroundColor={C.background} />

        <BreakReasonModal
          visible={breakModalVisible}
          onClose={() => setBreakModalVisible(false)}
          onConfirm={handleBreakIn}
          loading={breakLoading || isProcessing}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { backgroundColor: C.background },
          ]}
          scrollEnabled={!isProcessing}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[C.primary]}
              tintColor={C.primary}
            />
          }
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { backgroundColor: C.background, borderBottomColor: C.border },
            ]}
          >
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: C.textSecondary }]}>
                {getGreeting()},
              </Text>
              <Text style={[styles.headerName, { color: C.textPrimary }]}>
                {firstName} 👋
              </Text>
              <Text style={[styles.headerDate, { color: C.textSecondary }]}>
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.avatarWrap}>
              <TouchableOpacity
                style={[styles.avatar, { backgroundColor: C.primary }]}
                onPress={() => setProfileModalVisible(true)}
              >
                <Text style={[styles.avatarText, { color: C.textDark }]}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </TouchableOpacity>
              <View
                style={[
                  styles.statusDotAvatar,
                  {
                    backgroundColor: isAbsent
                      ? C.error
                      : isPunchedIn
                      ? C.success
                      : hasAnySessionToday
                      ? C.textSecondary
                      : C.warning,
                    borderColor: C.background,
                  },
                ]}
              />
            </View>
          </View>

          {/* Active Time - Only show if punched in */}
          {isPunchedIn && (
            <ActiveTimeDisplay
              punchInTime={todaysPunchIn}
              isOnBreak={isOnBreak}
              breakStartTime={currentBreak?.breakIn}
              isAbsent={isAbsent}
              isPunchedIn={isPunchedIn}
              hasAnySessionToday={hasAnySessionToday}
              isUserLate={isUserLate}
              isHalfDay={isHalfDay}
              isEarlyLeave={isEarlyLeave}
              lateMinutes={lateMinutes}
              earlyLeaveMinutes={earlyLeaveMinutes}
              todaysPunchIn={todaysPunchIn}
              firstPunchIn={todayRecord?.firstPunchIn} // 👈 YEH EK LINE ADD KARO
              lastSession={lastSession}
              statusConfig={statusConfig}
            />
          )}

          {/* Break Status Bar - Only show if on break */}
          {shouldShowBreakEnd() && currentBreak && (
            <BreakStatusBar
              breakType={currentBreak.breakType}
              breakStartTime={currentBreak.breakIn}
              breakRemarks={currentBreak.remarks}
              onEndBreak={handleBreakOut}
              loading={breakLoading || isProcessing}
            />
          )}

          {/* Quick Actions */}
          <View style={[styles.sectionRow, { backgroundColor: C.background }]}>
            <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>
              {t.home.quickActions}
            </Text>
          </View>

          <View style={[styles.actionsGrid, { backgroundColor: C.background }]}>
            {quickActions.map((item, index) => {
              const Icon = item.icon;
              const isBreakAction = item.label === t.home.idleTracking;
              const isDailyPunchAction = item.label === t.home.dailyPunch;
              const isActive = isBreakAction && isOnBreak;

              // Daily Punch is always enabled - user can punch in multiple times
              // Break is disabled if not punched in or already on break
              const disabled =
                isLoading || (isBreakAction && (!isPunchedIn || isOnBreak));

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: C.surface,
                      borderColor: C.border,
                    },
                    disabled && styles.actionCardDisabled,
                    isActive && { borderColor: C.warning + '66' },
                  ]}
                  onPress={() => handleQuickActionPress(item.label)}
                  activeOpacity={0.7}
                  disabled={disabled}
                >
                  <View
                    style={[
                      styles.actionIconWrap,
                      {
                        backgroundColor: disabled
                          ? C.disabled + '20'
                          : item.color + '25',
                      },
                    ]}
                  >
                    <Icon
                      size={wp('6%')}
                      color={disabled ? C.disabled : item.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.actionLabel,
                      { color: C.iconTitle },
                      disabled && { color: C.disabled },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isActive && (
                    <View
                      style={[
                        styles.activePill,
                        { backgroundColor: C.warning },
                      ]}
                    >
                      <Text
                        style={[styles.activePillText, { color: C.textDark }]}
                      >
                        {t.attendance.active}
                      </Text>
                    </View>
                  )}
                  {isBreakAction && !isPunchedIn && !isActive && (
                    <Text
                      style={[styles.actionHint, { color: C.textSecondary }]}
                    >
                      {t.attendance.needCheckIn || 'Need check-in'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Today's Activity */}
          <View style={[styles.sectionRow, { backgroundColor: C.background }]}>
            <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>
              {t.home.todaysActivity}
            </Text>
            <TouchableOpacity
              style={[
                styles.formatPill,
                { backgroundColor: C.surface, borderColor: C.border },
              ]}
              onPress={() => setShowFormatOptions(!showFormatOptions)}
            >
              <Text style={[styles.formatPillText, { color: C.textSecondary }]}>
                {formatOptions.find(f => f.value === durationFormat)?.label ||
                  t.attendance.auto ||
                  'Auto'}
              </Text>
              <ChevronDown size={wp('3.5%')} color={C.textSecondary} />
            </TouchableOpacity>
          </View>

          {showFormatOptions && (
            <View
              style={[
                styles.dropdown,
                { backgroundColor: C.surfaceSolid, borderColor: C.border },
              ]}
            >
              {formatOptions.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.dropdownItem,
                    { borderBottomColor: C.border },
                    durationFormat === opt.value && {
                      backgroundColor: C.primary + '18',
                    },
                  ]}
                  onPress={() => {
                    setDurationFormat(opt.value);
                    setShowFormatOptions(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      { color: C.textSecondary },
                      durationFormat === opt.value && {
                        color: C.primary,
                        fontFamily: Fonts.medium,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Attendance Card */}
          {historyLoading && !refreshing ? (
            <View
              style={[
                styles.loadingCard,
                { backgroundColor: C.surface, borderColor: C.border },
              ]}
            >
              <ActivityIndicator size="small" color={C.primary} />
              <Text style={[styles.loadingText, { color: C.textSecondary }]}>
                {t.reports.loading}
              </Text>
            </View>
          ) : todayRecord ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: C.surface,
                  borderColor: isAbsent
                    ? C.error + '30'
                    : isHalfDay || isUserLate
                    ? C.warning + '30'
                    : C.border,
                },
              ]}
            >
              {/* Card Header */}
              <View
                style={[styles.cardHeader, { borderBottomColor: C.border }]}
              >
                <View style={styles.cardUserRow}>
                  {lastImage ? (
                    <Image
                      source={{ uri: lastImage }}
                      style={[styles.cardAvatar, { borderColor: C.primary }]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.cardAvatar,
                        styles.cardAvatarPlaceholder,
                        {
                          backgroundColor: C.background,
                          borderColor: C.border,
                        },
                      ]}
                    >
                      <User size={wp('5%')} color={C.textSecondary} />
                    </View>
                  )}
                  <View>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isAbsent
                            ? C.error + '12'
                            : isPunchedIn
                            ? isHalfDay || isUserLate
                              ? C.warning + '12'
                              : C.success + '12'
                            : hasAnySessionToday
                            ? C.textSecondary + '12'
                            : C.border + '30',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusPillDot,
                          {
                            backgroundColor: isAbsent
                              ? C.error
                              : isPunchedIn
                              ? isHalfDay || isUserLate
                                ? C.warning
                                : C.success
                              : hasAnySessionToday
                              ? C.textSecondary
                              : C.textSecondary,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color: isAbsent
                              ? C.error
                              : isPunchedIn
                              ? isHalfDay || isUserLate
                                ? C.warning
                                : C.success
                              : hasAnySessionToday
                              ? C.textSecondary
                              : C.textSecondary,
                          },
                        ]}
                      >
                        {isAbsent
                          ? t.attendance.absent || 'ABSENT'
                          : isPunchedIn
                          ? t.attendance.punchedIn
                          : hasAnySessionToday
                          ? t.attendance.punchedOut
                          : t.attendance.notMarked}
                      </Text>
                    </View>

                    {isPunchedIn && (
                      <>
                        <Text
                          style={[
                            styles.cardPunchTime,
                            { color: C.textPrimary },
                          ]}
                        >
                          {formatTime(todaysPunchIn)}
                        </Text>
                        <Text
                          style={[
                            styles.cardPunchDate,
                            { color: C.textSecondary },
                          ]}
                        >
                          {formatDate(todaysPunchIn)}
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {/* Show Punch Out button only if punched in AND not on break */}
                {shouldShowPunchOut() && (
                  <TouchableOpacity
                    style={[
                      styles.punchOutBtn,
                      { backgroundColor: C.error },
                      isLoading && { backgroundColor: C.disabled },
                    ]}
                    onPress={handlePunchOut}
                    disabled={isLoading}
                  >
                    <LogOut
                      size={wp('3.5%')}
                      color={C.textPrimary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[styles.punchOutBtnText, { color: C.textPrimary }]}
                    >
                      {punchOutLoading || isProcessing
                        ? t.attendance.processing
                        : t.attendance.punchOut}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Stats */}
              <View
                style={[
                  styles.statsRow,
                  {
                    backgroundColor: C.background + '80',
                    borderColor: C.border,
                  },
                ]}
              >
                <View style={styles.statBox}>
                  <View
                    style={[
                      styles.statIconWrap,
                      { backgroundColor: C.primary + '15' },
                    ]}
                  >
                    <TrendingUp size={wp('4%')} color={C.primary} />
                  </View>
                  <Text style={[styles.statValue, { color: C.textPrimary }]}>
                    {getFormattedDuration(totalMinutes)}
                  </Text>
                  <Text style={[styles.statLabel, { color: C.textSecondary }]}>
                    {t.attendance.workingTime}
                  </Text>
                </View>
                <View
                  style={[styles.statDivider, { backgroundColor: C.border }]}
                />
                <View style={styles.statBox}>
                  <View
                    style={[
                      styles.statIconWrap,
                      { backgroundColor: C.warning + '15' },
                    ]}
                  >
                    <Coffee size={wp('4%')} color={C.warning} />
                  </View>
                  <Text style={[styles.statValue, { color: C.textPrimary }]}>
                    {getFormattedDuration(totalBreakMinutes)}
                  </Text>
                  <Text style={[styles.statLabel, { color: C.textSecondary }]}>
                    {t.attendance.breakTime}
                  </Text>
                </View>
              </View>

              {/* Break Count */}
              {breakCount > 0 && (
                <View
                  style={[
                    styles.breakCountContainer,
                    { borderBottomColor: C.border },
                  ]}
                >
                  <Text
                    style={[styles.breakCountText, { color: C.textSecondary }]}
                  >
                    {t.attendance.breakCount || 'Break Count'}: {breakCount}
                  </Text>
                </View>
              )}

              {/* Short Leave Info */}
              {renderShortLeaveInfo()}

              {/* Late/Early Leave Info */}
              {(isUserLate || isEarlyLeave || isHalfDay) && (
                <View
                  style={[
                    styles.alertInfo,
                    {
                      backgroundColor: C.warning + '08',
                      borderColor: C.warning + '30',
                    },
                  ]}
                >
                  {isUserLate && (
                    <Text style={[styles.alertText, { color: C.warning }]}>
                      ⚠️ {t.attendance.lateBy || 'Late by'}{' '}
                      {formatMinutes(lateMinutes)}
                    </Text>
                  )}
                  {isHalfDay && (
                    <Text style={[styles.alertText, { color: C.warning }]}>
                      ⚠️ {t.attendance.halfDay || 'Half Day'}
                    </Text>
                  )}
                  {isEarlyLeave && (
                    <Text style={[styles.alertText, { color: C.warning }]}>
                      ⚠️ {t.attendance.earlyLeave || 'Early leave'}{' '}
                      {formatMinutes(earlyLeaveMinutes)}
                    </Text>
                  )}
                </View>
              )}

              {/* Breaks */}
              {sessions.map(
                (session, si) =>
                  session.breaks?.length > 0 && (
                    <View
                      key={si}
                      style={[
                        styles.breaksSection,
                        {
                          backgroundColor: C.background + '80',
                          borderColor: C.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.breaksSectionTitle,
                          { color: C.primary },
                        ]}
                      >
                        {t.attendance.breaks || 'Breaks'}
                      </Text>
                      {session.breaks.map((b, bi) => (
                        <View
                          key={bi}
                          style={[
                            styles.breakRow,
                            { borderBottomColor: C.border },
                          ]}
                        >
                          <View style={styles.breakRowLeft}>
                            <View
                              style={[
                                styles.breakTypeBadge,
                                {
                                  backgroundColor: b.breakOut
                                    ? C.border + '30'
                                    : C.warning + '15',
                                },
                              ]}
                            >
                              <Coffee
                                size={wp('3%')}
                                color={b.breakOut ? C.textSecondary : C.warning}
                              />
                              <Text
                                style={[
                                  styles.breakTypeBadgeText,
                                  {
                                    color: b.breakOut
                                      ? C.textSecondary
                                      : C.warning,
                                  },
                                ]}
                              >
                                {b.breakType}
                              </Text>
                            </View>
                            {b.remarks && (
                              <Text
                                style={[
                                  styles.breakRemark,
                                  { color: C.textSecondary },
                                ]}
                              >
                                {t.attendance.breakRemarks || 'Remarks'}:{' '}
                                {b.remarks}
                              </Text>
                            )}
                            <Text
                              style={[
                                styles.breakTimeRange,
                                { color: C.textSecondary },
                              ]}
                            >
                              {formatTime(b.breakIn)}
                              {b.breakOut
                                ? ` → ${formatTime(b.breakOut)}`
                                : ` → ${t.attendance.ongoing || 'Ongoing'}`}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.breakDurationBadge,
                              {
                                backgroundColor: b.durationMinutes
                                  ? C.primary + '12'
                                  : C.warning + '12',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.breakDurationText,
                                {
                                  color: b.durationMinutes
                                    ? C.primary
                                    : C.warning,
                                },
                              ]}
                            >
                              {b.durationMinutes
                                ? getFormattedDuration(b.durationMinutes)
                                : '●'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ),
              )}

              {/* Sessions Table */}
              {sessions.length > 0 && (
                <View style={[styles.tableSection, { borderColor: C.border }]}>
                  <View
                    style={[
                      styles.tableHead,
                      { backgroundColor: C.background + '80' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tableHeadCell,
                        { textAlign: 'left', color: C.primary },
                      ]}
                    >
                      {t.attendance.in || 'IN'}
                    </Text>
                    <Text style={[styles.tableHeadCell, { color: C.primary }]}>
                      {t.attendance.duration || 'DURATION'}
                    </Text>
                    <Text
                      style={[
                        styles.tableHeadCell,
                        { textAlign: 'right', color: C.primary },
                      ]}
                    >
                      {t.attendance.out || 'OUT'}
                    </Text>
                  </View>
                  {sessions.map((session, i) => (
                    <View
                      key={i}
                      style={[
                        styles.tableBodyRow,
                        { backgroundColor: C.surface },
                        i % 2 === 0 && { backgroundColor: C.background + '80' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tableBodyCell,
                          { textAlign: 'left', color: C.success },
                        ]}
                      >
                        {session.punchIn ? formatTime(session.punchIn) : '---'}
                      </Text>
                      <Text
                        style={[
                          styles.tableBodyCell,
                          { color: C.textSecondary },
                        ]}
                      >
                        {session.durationMinutes
                          ? getFormattedDuration(session.durationMinutes)
                          : '---'}
                      </Text>
                      <Text
                        style={[
                          styles.tableBodyCell,
                          { textAlign: 'right', color: C.error },
                        ]}
                      >
                        {session.punchOut
                          ? formatTime(session.punchOut)
                          : '---'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Absent Message */}
              {isAbsent && (
                <View
                  style={[
                    styles.absentContainer,
                    {
                      backgroundColor: C.surface,
                      borderColor: C.error + '30',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.absentIconContainer,
                      { backgroundColor: C.error + '12' },
                    ]}
                  >
                    <XCircle size={wp('10%')} color={C.error} />
                  </View>
                  <Text style={[styles.absentTitle, { color: C.textPrimary }]}>
                    {t.attendance.absent || 'Absent Today'}
                  </Text>
                  <Text
                    style={[styles.absentMessage, { color: C.textSecondary }]}
                  >
                    {t.attendance.noAttendanceToday}
                  </Text>

                  <View style={styles.contactManagerSection}>
                    <Text
                      style={[
                        styles.contactManagerTitle,
                        { color: C.textPrimary },
                      ]}
                    >
                      {t.attendance.contactManager || 'Contact Your Manager'}
                    </Text>

                    <View style={styles.contactButtonsRow}>
                      {managerEmail && (
                        <TouchableOpacity
                          style={[
                            styles.contactButton,
                            {
                              backgroundColor: C.primary + '12',
                              borderColor: C.primary,
                            },
                          ]}
                          onPress={() => handleContactManager('email')}
                        >
                          <Mail size={wp('4%')} color={C.primary} />
                          <Text
                            style={[
                              styles.contactButtonText,
                              { color: C.primary },
                            ]}
                          >
                            {t.attendance.email || 'Email'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {managerPhone && (
                        <TouchableOpacity
                          style={[
                            styles.contactButton,
                            {
                              backgroundColor: C.success + '12',
                              borderColor: C.success,
                            },
                          ]}
                          onPress={() => handleContactManager('phone')}
                        >
                          <Phone size={wp('4%')} color={C.success} />
                          <Text
                            style={[
                              styles.contactButtonText,
                              { color: C.success },
                            ]}
                          >
                            {t.attendance.call || 'Call'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text
                      style={[styles.managerName, { color: C.textSecondary }]}
                    >
                      {managerName || 'Your Manager'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.absentDivider,
                      { backgroundColor: C.border },
                    ]}
                  />

                  <TouchableOpacity
                    style={[
                      styles.absentContactBtn,
                      { borderColor: C.primary },
                    ]}
                    onPress={() => navigation.navigate('Leave')}
                  >
                    <Text
                      style={[styles.absentContactText, { color: C.primary }]}
                    >
                      {t.attendance.applyLeave || 'Apply for Leave'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Location */}
              {lastSession?.punchInLocation && (
                <View
                  style={[styles.locationRow, { borderTopColor: C.border }]}
                >
                  <MapPin size={wp('3.5%')} color={C.textSecondary} />
                  <Text
                    style={[styles.locationText, { color: C.textSecondary }]}
                    numberOfLines={1}
                  >
                    {lastSession.punchInLocation.address ||
                      t.attendance.locationRecorded ||
                      'Location recorded'}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: C.surface, borderColor: C.border },
              ]}
            >
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: C.primary + '12' },
                ]}
              >
                <Clock size={wp('10%')} color={C.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>
                {t.attendance.noAttendanceToday}
              </Text>
              <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>
                {t.attendance.markAttendance}
              </Text>
              <TouchableOpacity
                style={[
                  styles.punchInBtn,
                  { backgroundColor: C.primary },
                  isLoading && { backgroundColor: C.disabled },
                ]}
                onPress={() => {
                  if (isLoading) return;
                  navigation.navigate('DailyPuch');
                }}
                disabled={isLoading}
              >
                <LogIn
                  size={wp('4%')}
                  color={C.textDark}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.punchInBtnText, { color: C.textDark }]}>
                  {t.attendance.punchInNow}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: hp('4%') }} />
        </ScrollView>
      </MainLayout>

      {/* Profile Modal */}
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: C.overlayBg }]}>
          <View
            style={[
              styles.profileModalCard,
              { backgroundColor: C.surfaceSolid, borderColor: C.border },
            ]}
          >
            <View style={styles.profileHeader}>
              <View
                style={[styles.profileAvatar, { backgroundColor: C.primary }]}
              >
                <Text style={[styles.profileAvatarText, { color: C.textDark }]}>
                  {profile?.[0]?.fullName?.charAt(0).toUpperCase() || 'G'}
                </Text>
              </View>

              <Text style={[styles.profileName, { color: C.textPrimary }]}>
                {profile?.[0]?.fullName || 'Guest'}
              </Text>

              <Text
                style={[styles.profileDesignation, { color: C.textSecondary }]}
              >
                {profile?.[0]?.designation || '-'}
              </Text>
            </View>

            <View style={styles.profileInfoSection}>
              <View style={styles.profileRow}>
                <Text style={[styles.profileLabel, { color: C.textSecondary }]}>
                  {t.settings.employeeCode || 'Employee Code'}
                </Text>
                <Text style={[styles.profileValue, { color: C.textPrimary }]}>
                  {profile?.[0]?.employeeCode || '-'}
                </Text>
              </View>

              <View style={styles.profileRow}>
                <Text style={[styles.profileLabel, { color: C.textSecondary }]}>
                  {t.login.emailLabel || 'Email'}
                </Text>
                <Text style={[styles.profileValue, { color: C.textPrimary }]}>
                  {profile?.[0]?.email || '-'}
                </Text>
              </View>

              <View style={styles.profileRow}>
                <Text style={[styles.profileLabel, { color: C.textSecondary }]}>
                  {t.attendance.department || 'Department'}
                </Text>
                <Text style={[styles.profileValue, { color: C.textPrimary }]}>
                  {profile?.[0]?.department || '-'}
                </Text>
              </View>

              <View style={styles.profileRow}>
                <Text style={[styles.profileLabel, { color: C.textSecondary }]}>
                  {t.attendance.reportingManager || 'Reporting Manager'}
                </Text>
                <Text style={[styles.profileValue, { color: C.textPrimary }]}>
                  {profile?.[0]?.reportingTo?.name || '-'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: C.primary }]}
              onPress={() => setProfileModalVisible(false)}
            >
              <Text style={[styles.closeBtnText, { color: C.textDark }]}>
                {t.buttons.close || 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: hp('2'),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('6%'),
  },
  profileModalCard: {
    width: '100%',
    borderRadius: wp('5%'),
    padding: wp('6%'),
    borderWidth: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  profileAvatar: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  profileAvatarText: {
    fontSize: wp('7%'),
    fontFamily: Fonts.bold,
  },
  profileName: {
    fontSize: wp('5%'),
    fontFamily: Fonts.bold,
  },
  profileDesignation: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  profileInfoSection: {
    marginTop: hp('2%'),
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('1.2%'),
  },
  profileLabel: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.medium,
  },
  profileValue: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.regular,
  },
  closeBtn: {
    marginTop: hp('2.5%'),
    paddingVertical: hp('1.2%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },
  headerName: {
    fontSize: wp('6%'),
    fontFamily: Fonts.bold,
    letterSpacing: -0.3,
  },
  headerDate: {
    fontSize: wp('3%'),
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  avatarWrap: { position: 'relative', marginTop: 2 },
  avatar: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: wp('5%'),
    fontFamily: Fonts.bold,
  },
  statusDotAvatar: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp('3%'),
    height: wp('3%'),
    borderRadius: wp('1.5%'),
    borderWidth: 2,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('1.5%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
  },
  statusBannerText: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.medium,
  },
  statusBannerTime: {
    fontSize: wp('3%'),
    fontFamily: Fonts.regular,
  },
  lateLogin: {
    fontSize: wp('3%'),
    fontFamily: Fonts.regular,
  },
  halfDayText: {
    fontSize: wp('3%'),
    fontFamily: Fonts.medium,
  },
  earlyLeaveText: {
    fontSize: wp('3%'),
    fontFamily: Fonts.medium,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp('2.5%'),
    marginBottom: hp('1.2%'),
  },
  sectionLabel: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.medium,
    letterSpacing: 0.8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2.5%'),
  },
  actionCard: {
    width: (wp('100%') - wp('8%') - wp('2.5%') * 3) / 2,
    borderRadius: wp('4%'),
    paddingVertical: hp('1.8%'),
    alignItems: 'center',
    borderWidth: 1,
    elevation: 3,
  },
  actionCardDisabled: { opacity: 0.4 },
  actionIconWrap: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
  },
  actionLabel: {
    fontSize: wp('2.5%'),
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },
  actionHint: {
    fontSize: wp('2%'),
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  activePill: {
    paddingHorizontal: wp('2%'),
    paddingVertical: 2,
    borderRadius: 20,
    marginTop: 4,
  },
  activePillText: {
    fontSize: wp('2%'),
    fontFamily: Fonts.medium,
  },
  formatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  formatPillText: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.regular,
  },
  dropdown: {
    marginHorizontal: wp('5%'),
    marginBottom: hp('1%'),
    borderRadius: wp('3%'),
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownItem: {
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('4%'),
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.regular,
  },
  card: {
    borderRadius: wp('5%'),
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp('4%'),
    borderBottomWidth: 1,
  },
  cardUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
  },
  cardAvatar: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    borderWidth: 2,
  },
  cardAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  statusPillDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: {
    fontSize: wp('2.4%'),
    fontFamily: Fonts.medium,
    letterSpacing: 0.3,
  },
  cardPunchTime: {
    fontSize: wp('4%'),
    fontFamily: Fonts.bold,
  },
  cardPunchDate: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.regular,
    marginTop: 1,
  },
  punchOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('2.5%'),
  },
  punchOutBtnText: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.medium,
  },
  statsRow: {
    flexDirection: 'row',
    margin: wp('4%'),
    borderRadius: wp('3%'),
    overflow: 'hidden',
    borderWidth: 1,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp('1.5%'),
  },
  statIconWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },
  statValue: {
    fontSize: wp('4%'),
    fontFamily: Fonts.bold,
  },
  statLabel: {
    fontSize: wp('2.6%'),
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    marginVertical: wp('3%'),
  },
  breakCountContainer: {
    marginHorizontal: wp('4%'),
    marginBottom: hp('1%'),
    paddingVertical: hp('0.5%'),
    borderBottomWidth: 1,
  },
  breakCountText: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.regular,
  },
  shortLeaveContainer: {
    marginHorizontal: wp('4%'),
    marginBottom: hp('1%'),
    padding: wp('2%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
  },
  shortLeaveText: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.medium,
  },
  alertInfo: {
    marginHorizontal: wp('4%'),
    marginBottom: hp('1.5%'),
    padding: wp('3%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
    alignItems: 'center',
  },
  alertText: {
    fontSize: wp('3%'),
    fontFamily: Fonts.medium,
  },
  breaksSection: {
    marginHorizontal: wp('4%'),
    marginBottom: hp('1.5%'),
    borderRadius: wp('3%'),
    padding: wp('3%'),
    borderWidth: 1,
  },
  breaksSectionTitle: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.medium,
    marginBottom: hp('0.8%'),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.8%'),
    borderBottomWidth: 1,
  },
  breakRowLeft: { flex: 1, marginRight: wp('2%') },
  breakTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: wp('2%'),
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
    marginBottom: 3,
  },
  breakTypeBadgeText: { fontSize: wp('2.6%'), fontFamily: Fonts.medium },
  breakRemark: {
    fontSize: wp('2.6%'),
    fontFamily: Fonts.regular,
    marginLeft: wp('1%'),
    marginBottom: 2,
  },
  breakTimeRange: {
    fontSize: wp('2.6%'),
    fontFamily: Fonts.regular,
    marginLeft: wp('1%'),
  },
  breakDurationBadge: {
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    borderRadius: 20,
  },
  breakDurationText: { fontSize: wp('2.8%'), fontFamily: Fonts.medium },
  tableSection: {
    marginHorizontal: wp('4%'),
    marginBottom: hp('1.5%'),
    borderRadius: wp('3%'),
    overflow: 'hidden',
    borderWidth: 1,
  },
  tableHead: {
    flexDirection: 'row',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('3%'),
  },
  tableHeadCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: wp('2.5%'),
    fontFamily: Fonts.medium,
    letterSpacing: 0.4,
  },
  tableBodyRow: {
    flexDirection: 'row',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('3%'),
  },
  tableBodyCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: wp('3%'),
    fontFamily: Fonts.regular,
  },
  absentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: hp('3%'),
    margin: wp('4%'),
    borderRadius: wp('4%'),
    borderWidth: 1,
  },
  absentIconContainer: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  absentTitle: {
    fontSize: wp('4.5%'),
    fontFamily: Fonts.bold,
    marginBottom: hp('0.5%'),
  },
  absentMessage: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  contactManagerSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  contactManagerTitle: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.medium,
    marginBottom: hp('1%'),
  },
  contactButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp('3%'),
    marginBottom: hp('1%'),
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('5%'),
    borderWidth: 1,
    gap: wp('1.5%'),
  },
  contactButtonText: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.medium,
  },
  managerName: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.regular,
  },
  absentDivider: {
    height: 1,
    width: '30%',
    marginBottom: hp('2%'),
  },
  absentContactBtn: {
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.2%'),
    borderRadius: wp('5%'),
    borderWidth: 1,
  },
  absentContactText: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.medium,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    padding: wp('4%'),
    borderTopWidth: 1,
  },
  locationText: {
    flex: 1,
    fontSize: wp('2.8%'),
    fontFamily: Fonts.regular,
  },
  emptyCard: {
    borderRadius: wp('5%'),
    padding: hp('4%'),
    marginHorizontal: wp('5%'),
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyIconWrap: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  emptyTitle: {
    fontSize: wp('4.5%'),
    fontFamily: Fonts.bold,
    marginBottom: hp('0.5%'),
  },
  emptySubtitle: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginBottom: hp('2.5%'),
  },
  punchInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
    paddingVertical: hp('1.6%'),
    borderRadius: wp('5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  punchInBtnText: {
    fontSize: wp('3.8%'),
    fontFamily: Fonts.medium,
  },
  loadingCard: {
    borderRadius: wp('5%'),
    padding: hp('3%'),
    marginHorizontal: wp('5%'),
    alignItems: 'center',
    gap: hp('1%'),
    borderWidth: 1,
  },
  loadingText: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.regular,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
    flex: 1,
  },
  overlayCard: {
    borderRadius: wp('4%'),
    padding: wp('8%'),
    alignItems: 'center',
    gap: hp('1.5%'),
    borderWidth: 1,
  },
  overlayText: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.medium,
  },
});

export default HomeScreen;
