import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  Target,
  TrendingUp,
  Award,
  BarChart3,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  Circle,
} from 'lucide-react-native';
import { Fonts } from '../../../utils/GlobalText';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { setAlert } from '../../../store/actions/authActions';
import { useDispatch, useSelector } from 'react-redux';
import { fetchKRA, updateKRAMetric } from '../../../store/actions/kraActions';
import { showToast } from '../../../components/common/ToastProvider';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// RESPONSIVE DESIGN SYSTEM
// ============================================================================

const isTablet = SCREEN_WIDTH > 600;
const isMobile = SCREEN_WIDTH <= 600;

const RESPONSIVE = {
  // Spacing
  xs: wp('1%'),
  sm: wp('2%'),
  md: wp('4%'),
  lg: wp('6%'),
  xl: wp('8%'),

  // Font Sizes
  fontSize: {
    xs: wp(isMobile ? '2.2%' : '1.8%'),
    sm: wp(isMobile ? '2.5%' : '2%'),
    base: wp(isMobile ? '3%' : '2.4%'),
    lg: wp(isMobile ? '3.5%' : '2.8%'),
    xl: wp(isMobile ? '4%' : '3.2%'),
    '2xl': wp(isMobile ? '4.5%' : '3.6%'),
    '3xl': wp(isMobile ? '5%' : '4%'),
  },

  // Icon Sizes
  iconSize: {
    xs: wp(isMobile ? '3%' : '2.4%'),
    sm: wp(isMobile ? '4%' : '3.2%'),
    md: wp(isMobile ? '5%' : '4%'),
    lg: wp(isMobile ? '6%' : '4.8%'),
    xl: wp(isMobile ? '7%' : '5.6%'),
  },

  // Component Heights
  componentHeight: {
    touchable: hp(isMobile ? '6.5%' : '7%'),
    button: hp(isMobile ? '5.5%' : '6%'),
    card: 'auto',
  },

  // Border Radius
  borderRadius: {
    sm: wp(isMobile ? '2%' : '1.5%'),
    md: wp(isMobile ? '3%' : '2%'),
    lg: wp(isMobile ? '4%' : '2.5%'),
    xl: wp(isMobile ? '5%' : '3%'),
  },
};

// ============================================================================
// CONSTANTS
// ============================================================================

const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 100,
  GOOD: 80,
  FAIR: 60,
  NEEDS_IMPROVEMENT: 40,
  POOR: 0,
};

const PERFORMANCE_COLORS = {
  EXCELLENT: { bg: '#22C55E20', text: '#4ADE80', bar: '#4ADE80' },
  GOOD: { bg: '#06B6D420', text: '#22D3EE', bar: '#22D3EE' },
  FAIR: { bg: '#F9731620', text: '#FB923C', bar: '#FB923C' },
  NEEDS_IMPROVEMENT: { bg: '#F59E0B20', text: '#FBBF24', bar: '#FBBF24' },
  POOR: { bg: '#EF444420', text: '#F87171', bar: '#F87171' },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getPerformanceColor = percentage => {
  if (percentage >= PERFORMANCE_THRESHOLDS.EXCELLENT)
    return PERFORMANCE_COLORS.EXCELLENT;
  if (percentage >= PERFORMANCE_THRESHOLDS.GOOD) return PERFORMANCE_COLORS.GOOD;
  if (percentage >= PERFORMANCE_THRESHOLDS.FAIR) return PERFORMANCE_COLORS.FAIR;
  if (percentage >= PERFORMANCE_THRESHOLDS.NEEDS_IMPROVEMENT)
    return PERFORMANCE_COLORS.NEEDS_IMPROVEMENT;
  return PERFORMANCE_COLORS.POOR;
};

const getPerformanceBarColor = percentage =>
  getPerformanceColor(percentage).bar;

const calculateAchievement = (achieved, target) => {
  if (!target || target === 0) return 0;
  return Math.min(Math.round((achieved / target) * 100), 200);
};

const getRecommendation = (
  avgAchievement,
  completedKras,
  totalKras,
  pendingKras,
) => {
  if (avgAchievement >= 90) {
    return {
      type: 'EXCELLENT',
      icon: Award,
      title: 'Excellent Performance! 🌟',
      message: `You've achieved ${avgAchievement}% of your targets. Outstanding work! Keep maintaining this excellence.`,
      colorKey: 'success',
    };
  }
  if (avgAchievement >= 70) {
    return {
      type: 'GOOD',
      icon: TrendingUp,
      title: 'Good Progress! 📈',
      message: `You're on the right track with ${avgAchievement}% achievement. Focus on completing the remaining ${pendingKras} KRA(s).`,
      colorKey: 'info',
    };
  }
  if (avgAchievement < 70) {
    return {
      type: 'IMPROVEMENT',
      icon: AlertCircle,
      title: 'Need Improvement 📊',
      message: `Your achievement rate is ${avgAchievement}%. Consider discussing with your manager for guidance.`,
      colorKey: 'warning',
    };
  }
  return {
    type: 'FOCUS',
    icon: Target,
    title: 'Focus Areas 🎯',
    message: `${pendingKras} KRA(s) are pending completion. Prioritize these to improve your overall score.`,
    colorKey: 'primary',
  };
};

// ============================================================================
// KRA DETAIL MODAL COMPONENT
// ============================================================================

const KRADetailModal = ({ visible, kra, onClose, theme }) => {
  const C = theme.colors;
  if (!kra) return null;

  const kraAchievement = kra.achievement || 0;
  const performanceColor = getPerformanceColor(kraAchievement);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
      >
        <View
          style={[styles.modalContainer, { backgroundColor: C.background }]}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: C.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <X size={RESPONSIVE.iconSize.lg} color={C.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>
              KRA Details
            </Text>
            <View style={{ width: RESPONSIVE.iconSize.lg }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContent}
          >
            {/* KRA Header */}
            <View style={styles.modalKraHeader}>
              <View
                style={[
                  styles.modalKraIcon,
                  { backgroundColor: C.primary + '20' },
                ]}
              >
                <BarChart3 size={RESPONSIVE.iconSize.xl} color={C.primary} />
              </View>
              <View style={styles.modalKraInfo}>
                <Text style={[styles.modalKraTitle, { color: C.textPrimary }]}>
                  {kra.title}
                </Text>
                <View style={styles.modalKraPeriodContainer}>
                  <Calendar
                    size={RESPONSIVE.iconSize.xs}
                    color={C.textSecondary}
                  />
                  <Text
                    style={[styles.modalKraPeriod, { color: C.textSecondary }]}
                  >
                    {kra.period}
                  </Text>
                </View>
              </View>
            </View>

            {/* Achievement Badge */}
            <View
              style={[
                styles.modalAchievementBadge,
                { backgroundColor: performanceColor.bg },
              ]}
            >
              <Text
                style={[
                  styles.modalAchievementText,
                  { color: performanceColor.text },
                ]}
              >
                {kraAchievement}% Achievement
              </Text>
            </View>

            {/* Description */}
            {kra.description && (
              <View style={styles.modalSection}>
                <Text
                  style={[styles.modalSectionTitle, { color: C.textPrimary }]}
                >
                  Description
                </Text>
                <Text
                  style={[styles.modalDescription, { color: C.textSecondary }]}
                >
                  {kra.description}
                </Text>
              </View>
            )}

            {/* Metrics Section */}
            <View style={styles.modalSection}>
              <Text
                style={[styles.modalSectionTitle, { color: C.textPrimary }]}
              >
                Metrics & Targets
              </Text>

              {kra.metricsWithAchievement?.map((metric, index) => {
                const metricPerformanceColor = getPerformanceColor(
                  metric.achievement,
                );
                return (
                  <View
                    key={metric._id || index}
                    style={[
                      styles.modalMetricCard,
                      { backgroundColor: C.surface, borderColor: C.border },
                    ]}
                  >
                    <View style={styles.modalMetricHeader}>
                      <View style={styles.modalMetricCategory}>
                        <Text
                          style={[
                            styles.modalMetricCategoryText,
                            { color: C.primary },
                          ]}
                        >
                          {metric.category}
                        </Text>
                      </View>
                      {metric.isCompleted ? (
                        <CheckCircle
                          size={RESPONSIVE.iconSize.sm}
                          color={C.success}
                        />
                      ) : (
                        <Circle
                          size={RESPONSIVE.iconSize.sm}
                          color={C.textSecondary}
                        />
                      )}
                    </View>

                    <Text
                      style={[styles.modalMetricName, { color: C.textPrimary }]}
                    >
                      {metric.name}
                    </Text>

                    <View style={styles.modalMetricStats}>
                      <View style={styles.modalMetricStat}>
                        <Text
                          style={[
                            styles.modalMetricStatLabel,
                            { color: C.textSecondary },
                          ]}
                        >
                          Target
                        </Text>
                        <Text
                          style={[
                            styles.modalMetricStatValue,
                            { color: C.primary },
                          ]}
                        >
                          {metric.target?.toLocaleString() || 0}
                        </Text>
                      </View>
                      <View style={styles.modalMetricStat}>
                        <Text
                          style={[
                            styles.modalMetricStatLabel,
                            { color: C.textSecondary },
                          ]}
                        >
                          Achieved
                        </Text>
                        <Text
                          style={[
                            styles.modalMetricStatValue,
                            {
                              color: metric.isCompleted
                                ? C.success
                                : C.textPrimary,
                            },
                          ]}
                        >
                          {metric.achieved?.toLocaleString() || 0}
                        </Text>
                      </View>
                      <View style={styles.modalMetricStat}>
                        <Text
                          style={[
                            styles.modalMetricStatLabel,
                            { color: C.textSecondary },
                          ]}
                        >
                          Weightage
                        </Text>
                        <Text
                          style={[
                            styles.modalMetricStatValue,
                            { color: C.textPrimary },
                          ]}
                        >
                          {metric.weightage || 0}%
                        </Text>
                      </View>
                      <View style={styles.modalMetricStat}>
                        <Text
                          style={[
                            styles.modalMetricStatLabel,
                            { color: C.textSecondary },
                          ]}
                        >
                          Achievement
                        </Text>
                        <Text
                          style={[
                            styles.modalMetricStatValue,
                            { color: metricPerformanceColor.text },
                          ]}
                        >
                          {metric.achievement}%
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.modalProgressBarContainer}>
                      <View
                        style={[
                          styles.modalProgressBar,
                          {
                            width: `${Math.min(metric.achievement, 100)}%`,
                            backgroundColor: getPerformanceBarColor(
                              metric.achievement,
                            ),
                          },
                        ]}
                      />
                    </View>

                    {metric.status === 'pending' && (
                      <View
                        style={[
                          styles.modalPendingBadge,
                          { backgroundColor: C.warning + '20' },
                        ]}
                      >
                        <Clock
                          size={RESPONSIVE.iconSize.xs}
                          color={C.warning}
                        />
                        <Text
                          style={[
                            styles.modalPendingText,
                            { color: C.warning },
                          ]}
                        >
                          Pending Review
                        </Text>
                      </View>
                    )}

                    {metric.isCompleted && (
                      <View
                        style={[
                          styles.modalCompletedBadge,
                          { backgroundColor: C.success + '20' },
                        ]}
                      >
                        <Award
                          size={RESPONSIVE.iconSize.xs}
                          color={C.success}
                        />
                        <Text
                          style={[
                            styles.modalCompletedText,
                            { color: C.success },
                          ]}
                        >
                          Target Achieved! 🎉
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const KRA = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const C = theme.colors;
  const dispatch = useDispatch();

  const { kraList, loading, error } = useSelector(state => state.kra);
  const { profile } = useSelector(state => state.employeeProfile);

  const [kraData, setKraData] = useState(null);
  const [expandedKRAs, setExpandedKRAs] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [updatingMetrics, setUpdatingMetrics] = useState(new Set());
  const [selectedKRA, setSelectedKRA] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // =========================================================================
  // LIFECYCLE HOOKS
  // =========================================================================

  useEffect(() => {
    loadKRA();
  }, []);

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  const loadKRA = async () => {
    try {
      const result = await dispatch(fetchKRA());
      if (result.success && result.data) {
        setKraData(result.data);
        const expandedState = {};
        if (result.data.kras) {
          result.data.kras.forEach(kra => {
            expandedState[kra._id] = true;
          });
        }
        setExpandedKRAs(expandedState);
      } else {
        showToast(result.error || 'Failed to load KRA data', 'error');
      }
    } catch (err) {
      showToast('Error loading KRA data', 'error');
      console.error('KRA Load Error:', err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadKRA();
      showToast('KRA data refreshed', 'success');
    } catch (err) {
      showToast('Failed to refresh data', 'error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // =========================================================================
  // UI HANDLERS
  // =========================================================================

  const toggleKRAExpanded = useCallback(kraId => {
    setExpandedKRAs(prev => ({
      ...prev,
      [kraId]: !prev[kraId],
    }));
  }, []);

  const handleKraPress = useCallback(kra => {
    setSelectedKRA(kra);
    setShowDetailModal(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedKRA(null);
  }, []);

  // =========================================================================
  // MEMOIZED COMPUTATIONS
  // =========================================================================

  const memoizedKRAs = useMemo(() => {
    if (!kraData?.kras) return [];

    return kraData.kras.map(kra => {
      const totalAchieved =
        kra.metrics?.reduce((sum, m) => sum + (m.achieved || 0), 0) || 0;
      const totalTarget =
        kra.metrics?.reduce((sum, m) => sum + (m.target || 0), 0) || 0;
      const achievement = calculateAchievement(totalAchieved, totalTarget);

      return {
        ...kra,
        achievement,
        metricsWithAchievement: (kra.metrics || []).map(metric => ({
          ...metric,
          achievement: calculateAchievement(
            metric.achieved || 0,
            metric.target || 0,
          ),
          isCompleted: (metric.achieved || 0) >= (metric.target || 0),
        })),
      };
    });
  }, [kraData?.kras]);

  const memoizedSummary = useMemo(() => {
    return (
      kraData?.summary || {
        overallRating: 0,
        completedKras: 0,
        totalKras: 0,
        avgAchievement: 0,
        excellenceScore: '0/0',
        pendingKras: 0,
      }
    );
  }, [kraData?.summary]);

  const userProfile = useMemo(() => profile?.[0] || {}, [profile]);

  // =========================================================================
  // RENDER SECTIONS
  // =========================================================================

  if (loading && !kraData) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: C.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color={C.primary} />
        <Text
          style={[
            styles.loadingText,
            { color: C.textSecondary, marginTop: RESPONSIVE.lg },
          ]}
        >
          Loading KRA data...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: C.background,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: RESPONSIVE.md,
          },
        ]}
      >
        <AlertCircle size={RESPONSIVE.iconSize.xl} color={C.error} />
        <Text
          style={[
            styles.errorText,
            {
              color: C.error,
              marginTop: RESPONSIVE.lg,
              textAlign: 'center',
            },
          ]}
        >
          {error}
        </Text>
        <TouchableOpacity
          style={[
            styles.retryBtn,
            { backgroundColor: C.primary, marginTop: RESPONSIVE.lg },
          ]}
          onPress={loadKRA}
        >
          <Text style={[styles.retryBtnText, { color: '#fff' }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!memoizedKRAs || memoizedKRAs.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <StatusBar barStyle={C.statusBar} backgroundColor={C.background} />
        <View
          style={[
            styles.header,
            { backgroundColor: C.background, borderBottomColor: C.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.backBtn,
              { backgroundColor: C.surface, borderColor: C.border },
            ]}
          >
            <ChevronLeft size={RESPONSIVE.iconSize.md} color={C.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: C.textPrimary }]}>
              KRA Management
            </Text>
            <Text style={[styles.headerSubtitle, { color: C.textSecondary }]}>
              Key Result Areas
            </Text>
          </View>
          <View style={styles.downloadBtn} />
        </View>
        <View style={styles.emptyContainer}>
          <BarChart3 size={RESPONSIVE.iconSize.xl} color={C.disabled} />
          <Text
            style={[
              styles.emptyTitle,
              { color: C.textPrimary, marginTop: RESPONSIVE.lg },
            ]}
          >
            No KRA Data Available
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              {
                color: C.textSecondary,
                textAlign: 'center',
                marginTop: RESPONSIVE.md,
              },
            ]}
          >
            Your KRA metrics haven't been assigned yet.{'\n'}Please contact your
            manager.
          </Text>
        </View>
      </View>
    );
  }

  const summary = memoizedSummary;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.background} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: C.background, borderBottomColor: C.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.backBtn,
            { backgroundColor: C.surface, borderColor: C.border },
          ]}
        >
          <ChevronLeft size={RESPONSIVE.iconSize.md} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: C.textPrimary }]}>
            KRA Management
          </Text>
          <Text style={[styles.headerSubtitle, { color: C.textSecondary }]}>
            Key Result Areas
          </Text>
        </View>
        <View style={styles.downloadBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
          />
        }
      >
        {/* Employee Overview Card */}
        <View
          style={[
            styles.overviewCard,
            { backgroundColor: C.surface, borderColor: C.border },
          ]}
        >
          <View style={styles.overviewHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[styles.employeeName, { color: C.textPrimary }]}
                numberOfLines={2}
              >
                {userProfile.fullName || 'Employee'}
              </Text>
              <Text
                style={[styles.employeeRole, { color: C.textSecondary }]}
                numberOfLines={2}
              >
                {userProfile.designation || 'Position'} •{' '}
                {userProfile.department || 'Department'}
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingLabel, { color: C.textSecondary }]}>
                Overall Rating
              </Text>
              <Text style={[styles.overallRating, { color: C.textPrimary }]}>
                {summary.overallRating || '0'} / 5
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: C.primary + '15',
                  borderColor: C.primary + '40',
                },
              ]}
            >
              <Target size={RESPONSIVE.iconSize.md} color={C.primary} />
              <Text style={[styles.statValue, { color: C.textPrimary }]}>
                {summary.completedKras}/{summary.totalKras}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>
                KRAs Completed
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: C.success + '15',
                  borderColor: C.success + '40',
                },
              ]}
            >
              <TrendingUp size={RESPONSIVE.iconSize.md} color={C.success} />
              <Text style={[styles.statValue, { color: C.textPrimary }]}>
                {summary.avgAchievement}%
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>
                Avg Achievement
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: C.warning + '15',
                  borderColor: C.warning + '40',
                },
              ]}
            >
              <Award size={RESPONSIVE.iconSize.md} color={C.warning} />
              <Text style={[styles.statValue, { color: C.textPrimary }]}>
                {summary.excellenceScore || '0/0'}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>
                Excellence Score
              </Text>
            </View>
          </View>
        </View>

        {/* KRA Sections */}
        {memoizedKRAs.map(kra => {
          const isExpanded = false;;
          const kraAchievement = kra.achievement || 0;
          const performanceColor = getPerformanceColor(kraAchievement);

          return (
            <View
              key={kra._id}
              style={[
                styles.kraSection,
                { backgroundColor: C.surface, borderColor: C.border },
              ]}
            >
              <TouchableOpacity
                style={styles.kraHeaderMain}
                onPress={() => handleKraPress(kra)}
                activeOpacity={0.7}
              >
                <View style={styles.kraTitleSection}>
                  <View
                    style={[
                      styles.kraIcon,
                      { backgroundColor: C.primary + '20' },
                    ]}
                  >
                    <BarChart3
                      size={RESPONSIVE.iconSize.md}
                      color={C.primary}
                    />
                  </View>
                  <View style={styles.kraInfo}>
                    <Text
                      style={[styles.kraTitle, { color: C.textPrimary }]}
                      numberOfLines={2}
                    >
                      {kra.title}
                    </Text>
                    <Text
                      style={[styles.kraPeriod, { color: C.textSecondary }]}
                      numberOfLines={1}
                    >
                      {kra.period}
                    </Text>
                  </View>
                </View>
                <View style={styles.kraScoreSection}>
                  <View
                    style={[
                      styles.kraScoreBadge,
                      { backgroundColor: performanceColor.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.kraScoreText,
                        { color: performanceColor.text },
                      ]}
                    >
                      {kraAchievement}%
                    </Text>
                  </View>
                  {/* <TouchableOpacity
                    onPress={e => {
                      e.stopPropagation();
                      toggleKRAExpanded(kra._id);
                    }}
                    style={styles.expandIcon}
                  >
                    {isExpanded ? (
                      <ChevronUp
                        size={RESPONSIVE.iconSize.sm}
                        color={C.textSecondary}
                      />
                    ) : (
                      <ChevronDown
                        size={RESPONSIVE.iconSize.sm}
                        color={C.textSecondary}
                      />
                    )}
                  </TouchableOpacity> */}
                </View>
              </TouchableOpacity>

              {isExpanded &&
                kra.metricsWithAchievement &&
                kra.metricsWithAchievement.length > 0 && (
                  <View style={styles.metricsContainer}>
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: C.textSecondary },
                      ]}
                      numberOfLines={3}
                    >
                      {kra.description}
                    </Text>

                    {kra.metricsWithAchievement.map(metric => {
                      const metricPerformanceColor = getPerformanceColor(
                        metric.achievement,
                      );
                      return (
                        <TouchableOpacity
                          key={metric._id}
                          activeOpacity={0.7}
                          onPress={() => handleKraPress(kra)}
                        >
                          <View
                            style={[
                              styles.metricItem,
                              {
                                backgroundColor: C.background,
                                borderColor: C.border,
                              },
                            ]}
                          >
                            <View style={styles.metricHeader}>
                              <View style={styles.metricTitleContainer}>
                                <View style={styles.metricCategoryBadge}>
                                  <Text
                                    style={[
                                      styles.metricCategory,
                                      { color: C.primary },
                                    ]}
                                  >
                                    {metric.category}
                                  </Text>
                                </View>
                                <Text
                                  style={[
                                    styles.metricName,
                                    { color: C.textPrimary },
                                  ]}
                                  numberOfLines={2}
                                >
                                  {metric.name}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.metricMetrics}>
                              <View style={styles.metricItemBox}>
                                <Text
                                  style={[
                                    styles.metricLabel,
                                    { color: C.textSecondary },
                                  ]}
                                >
                                  Target
                                </Text>
                                <Text
                                  style={[
                                    styles.metricValue,
                                    { color: C.primary },
                                  ]}
                                >
                                  {metric.target?.toLocaleString() || 0}
                                </Text>
                              </View>
                              <View style={styles.metricItemBox}>
                                <Text
                                  style={[
                                    styles.metricLabel,
                                    { color: C.textSecondary },
                                  ]}
                                >
                                  Achieved
                                </Text>
                                <Text
                                  style={[
                                    styles.metricValue,
                                    {
                                      color: metric.isCompleted
                                        ? C.success
                                        : C.textPrimary,
                                    },
                                  ]}
                                >
                                  {metric.achieved?.toLocaleString() || 0}
                                </Text>
                              </View>
                              <View style={styles.metricItemBox}>
                                <Text
                                  style={[
                                    styles.metricLabel,
                                    { color: C.textSecondary },
                                  ]}
                                >
                                  Weightage
                                </Text>
                                <Text
                                  style={[
                                    styles.metricValue,
                                    { color: C.textPrimary },
                                  ]}
                                >
                                  {metric.weightage || 0}%
                                </Text>
                              </View>
                              <View style={styles.metricItemBox}>
                                <Text
                                  style={[
                                    styles.metricLabel,
                                    { color: C.textSecondary },
                                  ]}
                                >
                                  Achievement
                                </Text>
                                <Text
                                  style={[
                                    styles.metricValue,
                                    { color: metricPerformanceColor.text },
                                  ]}
                                >
                                  {metric.achievement}%
                                </Text>
                              </View>
                            </View>

                            <View style={styles.progressBarContainer}>
                              <View
                                style={[
                                  styles.progressBar,
                                  {
                                    width: `${Math.min(
                                      metric.achievement,
                                      100,
                                    )}%`,
                                    backgroundColor: getPerformanceBarColor(
                                      metric.achievement,
                                    ),
                                  },
                                ]}
                              />
                            </View>

                            {metric.status === 'pending' && (
                              <View
                                style={[
                                  styles.pendingBadge,
                                  { backgroundColor: C.warning + '20' },
                                ]}
                              >
                                <Clock
                                  size={RESPONSIVE.iconSize.xs}
                                  color={C.warning}
                                />
                                <Text
                                  style={[
                                    styles.pendingText,
                                    { color: C.warning },
                                  ]}
                                >
                                  Pending Review
                                </Text>
                              </View>
                            )}

                            {metric.isCompleted && (
                              <View
                                style={[
                                  styles.completedBadge,
                                  { backgroundColor: C.success + '20' },
                                ]}
                              >
                                <Award
                                  size={RESPONSIVE.iconSize.xs}
                                  color={C.success}
                                />
                                <Text
                                  style={[
                                    styles.completedText,
                                    { color: C.success },
                                  ]}
                                >
                                  Target Achieved! 🎉
                                </Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
            </View>
          );
        })}

        {/* Performance Summary */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: C.surface, borderColor: C.border },
          ]}
        >
          <Text style={[styles.summaryTitle, { color: C.textPrimary }]}>
            Performance Summary
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryStatValue, { color: C.primary }]}>
                {summary.avgAchievement}%
              </Text>
              <Text
                style={[styles.summaryStatLabel, { color: C.textSecondary }]}
              >
                Average Achievement
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryStatValue, { color: C.warning }]}>
                {summary.completedKras}/{summary.totalKras}
              </Text>
              <Text
                style={[styles.summaryStatLabel, { color: C.textSecondary }]}
              >
                KRAs Completed
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryStatValue, { color: C.success }]}>
                {summary.pendingKras}
              </Text>
              <Text
                style={[styles.summaryStatLabel, { color: C.textSecondary }]}
              >
                Pending KRAs
              </Text>
            </View>
          </View>
        </View>

        {/* Recommendations */}
        <View
          style={[
            styles.recommendationsCard,
            { backgroundColor: C.surface, borderColor: C.border },
          ]}
        >
          <Text style={[styles.summaryTitle, { color: C.textPrimary }]}>
            Recommendations
          </Text>
          {(() => {
            const recommendation = getRecommendation(
              summary.avgAchievement,
              summary.completedKras,
              summary.totalKras,
              summary.pendingKras,
            );
            const RecommendationIcon = recommendation.icon;
            return (
              <View
                style={[
                  styles.recommendationItem,
                  {
                    backgroundColor: C[recommendation.colorKey] + '15',
                    borderColor: C[recommendation.colorKey] + '40',
                  },
                ]}
              >
                <RecommendationIcon
                  size={RESPONSIVE.iconSize.md}
                  color={C[recommendation.colorKey]}
                />
                <View style={styles.recommendationContent}>
                  <Text
                    style={[
                      styles.recommendationTitle,
                      { color: C.textPrimary },
                    ]}
                  >
                    {recommendation.title}
                  </Text>
                  <Text
                    style={[
                      styles.recommendationDesc,
                      { color: C.textSecondary },
                    ]}
                  >
                    {recommendation.message}
                  </Text>
                </View>
              </View>
            );
          })()}
        </View>

        <View style={{ height: RESPONSIVE.xl }} />
      </ScrollView>

      {/* KRA Detail Modal */}
      <KRADetailModal
        visible={showDetailModal}
        kra={selectedKRA}
        onClose={closeDetailModal}
        theme={theme}
      />
    </View>
  );
};

// ============================================================================
// STYLESHEET - FULLY RESPONSIVE
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: RESPONSIVE.lg },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE.md,
    paddingTop: Platform.OS === 'ios' ? hp('6%') : hp('5%'),
    paddingBottom: RESPONSIVE.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: RESPONSIVE.componentHeight.button,
    height: RESPONSIVE.componentHeight.button,
    borderRadius: RESPONSIVE.borderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE.sm,
  },
  headerTitle: {
    fontSize: RESPONSIVE.fontSize['2xl'],
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: RESPONSIVE.fontSize.sm,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 2,
  },
  downloadBtn: {
    width: RESPONSIVE.componentHeight.button,
    height: RESPONSIVE.componentHeight.button,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  // Overview Card
  overviewCard: {
    marginHorizontal: RESPONSIVE.md,
    marginTop: RESPONSIVE.lg,
    borderRadius: RESPONSIVE.borderRadius.lg,
    borderWidth: 1,
    padding: RESPONSIVE.md,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: RESPONSIVE.lg,
    gap: RESPONSIVE.sm,
  },
  employeeName: {
    fontSize: RESPONSIVE.fontSize.lg,
    fontFamily: Fonts.bold,
    flexShrink: 1,
  },
  employeeRole: {
    fontSize: RESPONSIVE.fontSize.base,
    fontFamily: Fonts.regular,
    marginTop: 4,
    flexShrink: 1,
  },
  ratingContainer: { alignItems: 'flex-end', flexShrink: 0 },
  ratingLabel: {
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: Fonts.medium,
    marginBottom: 4,
  },
  overallRating: {
    fontSize: RESPONSIVE.fontSize.xl,
    fontFamily: Fonts.bold,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RESPONSIVE.sm,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: isMobile ? 1 : 0,
    minWidth: isMobile ? '30%' : '29%',
    padding: RESPONSIVE.md,
    borderRadius: RESPONSIVE.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: RESPONSIVE.fontSize.xl,
    fontFamily: Fonts.bold,
    marginVertical: 6,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },

  // KRA Section
  kraSection: {
    marginHorizontal: RESPONSIVE.md,
    marginTop: RESPONSIVE.lg,
    borderRadius: RESPONSIVE.borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  kraHeaderMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RESPONSIVE.md,
    gap: RESPONSIVE.sm,
  },
  kraTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: RESPONSIVE.md,
    minWidth: 0,
  },
  kraIcon: {
    width: RESPONSIVE.componentHeight.button,
    height: RESPONSIVE.componentHeight.button,
    borderRadius: RESPONSIVE.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  kraInfo: { flex: 1, minWidth: 0 },
  kraTitle: {
    fontSize: RESPONSIVE.fontSize.base,
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  kraPeriod: {
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: Fonts.regular,
  },
  kraScoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE.sm,
    flexShrink: 0,
  },
  kraScoreBadge: {
    paddingHorizontal: RESPONSIVE.sm,
    paddingVertical: 6,
    borderRadius: RESPONSIVE.borderRadius.md,
  },
  kraScoreText: {
    fontSize: RESPONSIVE.fontSize.sm,
    fontFamily: Fonts.bold,
  },
  expandIcon: { padding: 4 },

  // Metrics
  metricsContainer: {
    padding: RESPONSIVE.md,
    paddingTop: RESPONSIVE.sm,
    gap: RESPONSIVE.md,
  },
  descriptionText: {
    fontSize: RESPONSIVE.fontSize.base,
    fontFamily: Fonts.regular,
    lineHeight: hp('2.2%'),
    marginBottom: RESPONSIVE.md,
  },
  metricItem: {
    borderRadius: RESPONSIVE.borderRadius.md,
    borderWidth: 1,
    padding: RESPONSIVE.md,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: RESPONSIVE.md,
    gap: RESPONSIVE.sm,
  },
  metricTitleContainer: { flex: 1, minWidth: 0 },
  metricCategoryBadge: {
    backgroundColor: '#3B82F620',
    paddingHorizontal: RESPONSIVE.sm,
    paddingVertical: 4,
    borderRadius: RESPONSIVE.borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  metricCategory: {
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: Fonts.bold,
  },
  metricName: {
    fontSize: RESPONSIVE.fontSize.base,
    fontFamily: Fonts.medium,
  },

  // Metric Metrics
  metricMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RESPONSIVE.md,
    marginBottom: RESPONSIVE.md,
    justifyContent: 'space-between',
  },
  metricItemBox: {
    minWidth: isMobile ? '22%' : '20%',
  },
  metricLabel: {
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: RESPONSIVE.fontSize.base,
    fontFamily: Fonts.bold,
  },

  // Progress Bar
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: RESPONSIVE.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: RESPONSIVE.md,
  },
  progressBar: {
    height: '100%',
    borderRadius: RESPONSIVE.borderRadius.sm,
  },

  // Status Badges
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: RESPONSIVE.sm,
    paddingVertical: 4,
    borderRadius: RESPONSIVE.borderRadius.sm,
  },
  pendingText: {
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: Fonts.medium,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: RESPONSIVE.sm,
    paddingVertical: 4,
    borderRadius: RESPONSIVE.borderRadius.sm,
  },
  completedText: {
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: Fonts.medium,
  },

  // Summary Card
  summaryCard: {
    marginHorizontal: RESPONSIVE.md,
    marginTop: RESPONSIVE.lg,
    borderRadius: RESPONSIVE.borderRadius.lg,
    borderWidth: 1,
    padding: RESPONSIVE.md,
  },
  summaryTitle: {
    fontSize: RESPONSIVE.fontSize.lg,
    fontFamily: Fonts.bold,
    marginBottom: RESPONSIVE.md,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: RESPONSIVE.md,
  },
  summaryStat: {
    alignItems: 'center',
    flex: 1,
    minWidth: wp('30%'),
  },
  summaryStatValue: {
    fontSize: RESPONSIVE.fontSize.xl,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },

  // Recommendations Card
  recommendationsCard: {
    marginHorizontal: RESPONSIVE.md,
    marginTop: RESPONSIVE.lg,
    borderRadius: RESPONSIVE.borderRadius.lg,
    borderWidth: 1,
    padding: RESPONSIVE.md,
  },
  recommendationItem: {
    flexDirection: 'row',
    padding: RESPONSIVE.md,
    borderRadius: RESPONSIVE.borderRadius.md,
    borderWidth: 1,
    gap: RESPONSIVE.sm,
    marginBottom: RESPONSIVE.md,
  },
  recommendationContent: { flex: 1, minWidth: 0 },
  recommendationTitle: {
    fontSize: RESPONSIVE.fontSize.base,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  recommendationDesc: {
    fontSize: RESPONSIVE.fontSize.sm,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: RESPONSIVE.borderRadius.xl,
    borderTopRightRadius: RESPONSIVE.borderRadius.xl,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE.md,
    paddingVertical: RESPONSIVE.md,
    borderBottomWidth: 1,
  },
  modalCloseBtn: { padding: RESPONSIVE.sm },
  modalTitle: {
    fontSize: RESPONSIVE.fontSize.lg,
    fontFamily: Fonts.bold,
  },
  modalContent: {
    padding: RESPONSIVE.md,
    paddingBottom: RESPONSIVE.lg,
  },
  modalKraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE.md,
    marginBottom: RESPONSIVE.lg,
  },
  modalKraIcon: {
    width: RESPONSIVE.componentHeight.touchable,
    height: RESPONSIVE.componentHeight.touchable,
    borderRadius: RESPONSIVE.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  modalKraInfo: { flex: 1 },
  modalKraTitle: {
    fontSize: RESPONSIVE.fontSize.lg,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  modalKraPeriodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  modalKraPeriod: {
    fontSize: RESPONSIVE.fontSize.base,
    fontFamily: Fonts.regular,
  },
  modalAchievementBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: RESPONSIVE.md,
    paddingVertical: 8,
    borderRadius: RESPONSIVE.borderRadius.xl,
    marginBottom: RESPONSIVE.lg,
  },
  modalAchievementText: {
    fontSize: RESPONSIVE.fontSize.base,
    fontFamily: Fonts.bold,
  },
  modalSection: { marginBottom: RESPONSIVE.lg },
  modalSectionTitle: {
    fontSize: RESPONSIVE.fontSize.lg,
    fontFamily: Fonts.bold,
    marginBottom: RESPONSIVE.md,
  },
  modalDescription: {
    fontSize: RESPONSIVE.fontSize.base,
    fontFamily: Fonts.regular,
    lineHeight: 22,
  },
  modalMetricCard: {
    borderRadius: RESPONSIVE.borderRadius.md,
    borderWidth: 1,
    padding: RESPONSIVE.md,
    marginBottom: RESPONSIVE.md,
  },
  modalMetricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RESPONSIVE.md,
  },
  modalMetricCategory: {
    backgroundColor: '#3B82F620',
    paddingHorizontal: RESPONSIVE.sm,
    paddingVertical: 4,
    borderRadius: RESPONSIVE.borderRadius.sm,
  },
  modalMetricCategoryText: {
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: Fonts.bold,
  },
  modalMetricName: {
    fontSize: RESPONSIVE.fontSize.base,
    fontFamily: Fonts.medium,
    marginBottom: RESPONSIVE.md,
  },
  modalMetricStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RESPONSIVE.md,
    marginBottom: RESPONSIVE.md,
  },
  modalMetricStat: { flex: 1, minWidth: wp('20%') },
  modalMetricStatLabel: {
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },
  modalMetricStatValue: {
    fontSize: RESPONSIVE.fontSize.base,
    fontFamily: Fonts.bold,
  },
  modalProgressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: RESPONSIVE.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: RESPONSIVE.md,
  },
  modalProgressBar: {
    height: '100%',
    borderRadius: RESPONSIVE.borderRadius.sm,
  },
  modalPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: RESPONSIVE.sm,
    paddingVertical: 4,
    borderRadius: RESPONSIVE.borderRadius.sm,
  },
  modalPendingText: {
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: Fonts.medium,
  },
  modalCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: RESPONSIVE.sm,
    paddingVertical: 4,
    borderRadius: RESPONSIVE.borderRadius.sm,
  },
  modalCompletedText: {
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: Fonts.medium,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    paddingHorizontal: RESPONSIVE.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: RESPONSIVE.fontSize.xl,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginTop: RESPONSIVE.lg,
  },
  emptySubtitle: {
    fontSize: RESPONSIVE.fontSize.base,
    fontFamily: Fonts.regular,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: RESPONSIVE.md,
  },

  // Loading/Error
  loadingText: {
    fontSize: RESPONSIVE.fontSize.lg,
    fontFamily: Fonts.medium,
  },
  errorText: {
    fontSize: RESPONSIVE.fontSize.lg,
    fontFamily: Fonts.medium,
  },
  retryBtn: {
    paddingHorizontal: RESPONSIVE.md,
    paddingVertical: 12,
    borderRadius: RESPONSIVE.borderRadius.md,
  },
  retryBtnText: {
    fontSize: RESPONSIVE.fontSize.lg,
    fontFamily: Fonts.bold,
  },
});

export default KRA;
