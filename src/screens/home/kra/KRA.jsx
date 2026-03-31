// src/screens/KRA.jsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  Star,
  Target,
  TrendingUp,
  Award,
  BookOpen,
  Code,
  Users,
  DollarSign,
  ChevronLeft,
  BarChart3,
  FileText,
  Download,
  CircleCheck as CheckCircle,
  Clock,
} from 'lucide-react-native';
import { Fonts } from '../../../utils/GlobalText';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { setAlert } from '../../../store/actions/authActions';
import { useDispatch } from 'react-redux';

// IT Department KRA Template
const itKRAs = [
  {
    id: 1,
    category: 'Technical Skills',
    description: 'Complete advanced programming courses',
    target: '5 courses',
    achieved: '4 courses',
    percentage: 80,
    rating: 4,
  },
  {
    id: 2,
    category: 'Project Delivery',
    description: 'Deliver projects on time',
    target: '100%',
    achieved: '95%',
    percentage: 95,
    rating: 5,
  },
  {
    id: 3,
    category: 'Code Quality',
    description: 'Maintain code quality standards',
    target: '90% score',
    achieved: '92% score',
    percentage: 102,
    rating: 5,
  },
  {
    id: 4,
    category: 'Training & Development',
    description: 'Complete mandatory certifications',
    target: '3 certs',
    achieved: '2 certs',
    percentage: 67,
    rating: 3,
  },
  {
    id: 5,
    category: 'Team Collaboration',
    description: 'Contribute to team knowledge sharing',
    target: '10 sessions',
    achieved: '12 sessions',
    percentage: 120,
    rating: 5,
  },
];

// Sales Department KRA Template
const salesKRAs = [
  {
    id: 1,
    category: 'Revenue Target',
    description: 'Achieve quarterly revenue target',
    target: '$500K',
    achieved: '$485K',
    percentage: 97,
    rating: 5,
  },
  {
    id: 2,
    category: 'Client Acquisition',
    description: 'Onboard new clients',
    target: '20 clients',
    achieved: '18 clients',
    percentage: 90,
    rating: 4,
  },
  {
    id: 3,
    category: 'Client Retention',
    description: 'Maintain client retention rate',
    target: '90%',
    achieved: '93%',
    percentage: 103,
    rating: 5,
  },
  {
    id: 4,
    category: 'Product Training',
    description: 'Complete product knowledge modules',
    target: '8 modules',
    achieved: '8 modules',
    percentage: 100,
    rating: 5,
  },
  {
    id: 5,
    category: 'Sales Meetings',
    description: 'Conduct client meetings',
    target: '50 meetings',
    achieved: '55 meetings',
    percentage: 110,
    rating: 5,
  },
];

// Marketing KRAs (Coming Soon)
const marketingKRAs = [
  {
    id: 1,
    category: 'Lead Generation',
    description: 'Generate qualified leads',
    target: '500 leads',
    achieved: '320 leads',
    percentage: 64,
    rating: 3,
  },
  {
    id: 2,
    category: 'Brand Awareness',
    description: 'Increase brand visibility',
    target: '1M impressions',
    achieved: '850K impressions',
    percentage: 85,
    rating: 4,
  },
];

const employees = [
  {
    id: 1,
    name: 'Sarah Johnson',
    department: 'IT',
    role: 'Senior Developer',
    overallRating: 4.4,
    trainingCompleted: 8,
    trainingTotal: 10,
    kras: itKRAs,
    trainings: [
      { name: 'Advanced React & TypeScript', completed: true, date: 'March 15, 2026', rating: 5 },
      { name: 'AWS Cloud Architecture', completed: true, date: 'February 28, 2026', rating: 4 },
      { name: 'System Design Fundamentals', completed: true, date: 'February 10, 2026', rating: 5 },
      { name: 'Kubernetes Certification', completed: false, progress: 60, rating: 0 },
    ],
  },
  {
    id: 2,
    name: 'Michael Chen',
    department: 'Sales',
    role: 'Sales Manager',
    overallRating: 4.8,
    trainingCompleted: 12,
    trainingTotal: 12,
    kras: salesKRAs,
    trainings: [
      { name: 'Advanced Sales Techniques', completed: true, date: 'March 10, 2026', rating: 5 },
      { name: 'Customer Relationship Management', completed: true, date: 'February 20, 2026', rating: 5 },
      { name: 'Product Knowledge Mastery', completed: true, date: 'January 15, 2026', rating: 5 },
      { name: 'Negotiation Skills Workshop', completed: true, date: 'March 5, 2026', rating: 4 },
    ],
  },
  {
    id: 3,
    name: 'Emily Davis',
    department: 'Marketing',
    role: 'Marketing Manager',
    overallRating: 3.8,
    trainingCompleted: 5,
    trainingTotal: 8,
    kras: marketingKRAs,
    trainings: [
      { name: 'Digital Marketing Strategy', completed: true, date: 'February 10, 2026', rating: 4 },
      { name: 'SEO Mastery', completed: true, date: 'January 20, 2026', rating: 4 },
      { name: 'Content Marketing', completed: false, progress: 40, rating: 0 },
      { name: 'Social Media Analytics', completed: false, progress: 75, rating: 0 },
    ],
  },
];

const departments = [
  { id: 'IT', name: 'IT Department', available: true },
  { id: 'Sales', name: 'Sales Department', available: true },
  { id: 'Marketing', name: 'Marketing Department', available: false },
  { id: 'HR', name: 'HR Department', available: false },
];

export const KRA = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const C = theme.colors;
  const dispatch = useDispatch();

  const [selectedDepartment, setSelectedDepartment] = useState('IT');
  const [selectedEmployee, setSelectedEmployee] = useState(employees[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const handleDepartmentChange = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    if (!dept?.available) {
      dispatch(setAlert(`${dept?.name} coming soon!`, 'info'));
      return;
    }
    
    setSelectedDepartment(deptId);
    const emp = employees.find(e => e.department === deptId);
    if (emp) setSelectedEmployee(emp);
    setDropdownOpen(false);
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const toggleDropdown = () => {
    if (dropdownOpen) {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setDropdownOpen(false));
    } else {
      setDropdownOpen(true);
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleRatingChange = (kraId, newRating) => {
    dispatch(setAlert('Rating updated successfully', 'success'));
    // In real app, update the rating in your state/backend
  };

  const renderStars = (rating, editable = false, kraId = null) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => editable && kraId && handleRatingChange(kraId, star)}
            disabled={!editable}
            style={styles.starButton}
          >
            <Star
              size={wp('4%')}
              color={star <= rating ? '#FBBF24' : '#6B7280'}
              fill={star <= rating ? '#FBBF24' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 100) return { bg: '#22C55E20', text: '#4ADE80' };
    if (percentage >= 80) return { bg: '#06B6D420', text: '#22D3EE' };
    if (percentage >= 60) return { bg: '#F9731620', text: '#FB923C' };
    return { bg: '#EF444420', text: '#F87171' };
  };

  const getPerformanceBarColor = (percentage) => {
    if (percentage >= 100) return '#4ADE80';
    if (percentage >= 80) return '#22D3EE';
    if (percentage >= 60) return '#FB923C';
    return '#F87171';
  };

  const getRatingDistribution = () => {
    const ratings = [0, 0, 0, 0, 0];
    selectedEmployee.kras.forEach(kra => {
      if (kra.rating >= 1 && kra.rating <= 5) {
        ratings[kra.rating - 1]++;
      }
    });
    return ratings;
  };

  const ratingDistribution = getRatingDistribution();
  const totalKRAs = selectedEmployee.kras.length;
  const avgAchievement = Math.round(
    selectedEmployee.kras.reduce((acc, k) => acc + k.percentage, 0) / totalKRAs
  );

  const dropdownHeight = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 250],
  });

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
          <ChevronLeft size={wp('5%')} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: C.textPrimary }]}>
            KRA Management
          </Text>
          <Text style={[styles.headerSubtitle, { color: C.textSecondary }]}>
            Key Result Areas - Track employee performance
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.downloadBtn,
            { backgroundColor: C.surface, borderColor: C.border },
          ]}
          onPress={() => dispatch(setAlert('Export report feature coming soon', 'info'))}
        >
          <Download size={wp('4%')} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Department Selector */}
        <View style={styles.departmentSelector}>
          <TouchableOpacity
            style={[
              styles.selectorTrigger,
              { backgroundColor: C.surface, borderColor: C.border },
            ]}
            onPress={toggleDropdown}
          >
            <Text style={[styles.selectedDeptText, { color: C.textPrimary }]}>
              {departments.find(d => d.id === selectedDepartment)?.name}
            </Text>
            <BarChart3 size={wp('4%')} color={C.textSecondary} />
          </TouchableOpacity>

          {dropdownOpen && (
            <Animated.View
              style={[
                styles.dropdown,
                {
                  backgroundColor: C.surfaceRaised,
                  borderColor: C.border,
                  maxHeight: dropdownHeight,
                },
              ]}
            >
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  style={[
                    styles.dropdownItem,
                    selectedDepartment === dept.id && {
                      backgroundColor: C.primary + '20',
                    },
                  ]}
                  onPress={() => handleDepartmentChange(dept.id)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      { color: dept.available ? C.textPrimary : C.disabled },
                    ]}
                  >
                    {dept.name}
                    {!dept.available && ' (Coming Soon)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </View>

        {/* Employee Overview Card */}
        <View
          style={[
            styles.overviewCard,
            { backgroundColor: C.surface, borderColor: C.border },
          ]}
        >
          <View style={styles.overviewHeader}>
            <View>
              <Text style={[styles.employeeName, { color: C.textPrimary }]}>
                {selectedEmployee.name}
              </Text>
              <Text style={[styles.employeeRole, { color: C.textSecondary }]}>
                {selectedEmployee.role} • {selectedEmployee.department}
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingLabel, { color: C.textSecondary }]}>
                Overall Rating
              </Text>
              <View style={styles.ratingValueContainer}>
                <Text style={[styles.overallRating, { color: C.textPrimary }]}>
                  {selectedEmployee.overallRating}
                </Text>
                {renderStars(Math.round(selectedEmployee.overallRating))}
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: C.primary + '15', borderColor: C.primary + '40' },
              ]}
            >
              <Target size={wp('5%')} color={C.primary} />
              <Text style={[styles.statValue, { color: C.textPrimary }]}>
                {selectedEmployee.kras.filter(k => k.percentage >= 100).length}/{totalKRAs}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>KRAs Achieved</Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: C.success + '15', borderColor: C.success + '40' },
              ]}
            >
              <BookOpen size={wp('5%')} color={C.success} />
              <Text style={[styles.statValue, { color: C.textPrimary }]}>
                {selectedEmployee.trainingCompleted}/{selectedEmployee.trainingTotal}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>Training Completed</Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: C.info + '15', borderColor: C.info + '40' },
              ]}
            >
              <TrendingUp size={wp('5%')} color={C.info} />
              <Text style={[styles.statValue, { color: C.textPrimary }]}>{avgAchievement}%</Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>Avg Achievement</Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: C.warning + '15', borderColor: C.warning + '40' },
              ]}
            >
              <Award size={wp('5%')} color={C.warning} />
              <Text style={[styles.statValue, { color: C.textPrimary }]}>
                {selectedEmployee.kras.filter(k => k.rating === 5).length}/{totalKRAs}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>Excellence Score</Text>
            </View>
          </View>
        </View>

        {/* KRA Details Section */}
        <View
          style={[
            styles.kraSection,
            { backgroundColor: C.surface, borderColor: C.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>
              Key Result Areas (KRAs)
            </Text>
            <TouchableOpacity
              style={[styles.exportBtn, { borderColor: C.border }]}
              onPress={() => dispatch(setAlert('Export report feature coming soon', 'info'))}
            >
              <FileText size={wp('3%')} color={C.textSecondary} />
              <Text style={[styles.exportBtnText, { color: C.textSecondary }]}>Export</Text>
            </TouchableOpacity>
          </View>

          {selectedEmployee.kras.map((kra) => {
            const performanceColor = getPerformanceColor(kra.percentage);
            return (
              <View
                key={kra.id}
                style={[styles.kraItem, { backgroundColor: C.background, borderColor: C.border }]}
              >
                <View style={styles.kraHeader}>
                  <View style={styles.kraTitleContainer}>
                    <Text style={[styles.kraCategory, { color: C.textPrimary }]}>
                      {kra.category}
                    </Text>
                    <View
                      style={[
                        styles.percentageBadge,
                        { backgroundColor: performanceColor.bg },
                      ]}
                    >
                      <Text style={[styles.percentageText, { color: performanceColor.text }]}>
                        {kra.percentage}% Achieved
                      </Text>
                    </View>
                  </View>
                  <View style={styles.kraRatingContainer}>
                    <Text style={[styles.ratingLabelSmall, { color: C.textSecondary }]}>
                      Performance Rating
                    </Text>
                    {renderStars(kra.rating, true, kra.id)}
                  </View>
                </View>

                <Text style={[styles.kraDescription, { color: C.textSecondary }]}>
                  {kra.description}
                </Text>

                <View style={styles.kraMetrics}>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: C.textSecondary }]}>Target</Text>
                    <Text style={[styles.metricValue, { color: C.primary }]}>{kra.target}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: C.textSecondary }]}>Achieved</Text>
                    <Text style={[styles.metricValue, { color: C.textPrimary }]}>{kra.achieved}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: C.textSecondary }]}>Achievement</Text>
                    <Text style={[styles.metricValue, { color: C.textPrimary }]}>{kra.percentage}%</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        backgroundColor: C.border,
                        width: `${Math.min(kra.percentage, 100)}%`,
                        backgroundColor: getPerformanceBarColor(kra.percentage),
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Training & Development Section */}
        <View
          style={[
            styles.trainingSection,
            { backgroundColor: C.surface, borderColor: C.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>
            Training & Development
          </Text>

          <View style={styles.trainingProgressContainer}>
            <View style={styles.trainingProgressHeader}>
              <View>
                <Text style={[styles.trainingProgressLabel, { color: C.textSecondary }]}>
                  Overall Training Progress
                </Text>
                <Text style={[styles.trainingProgressText, { color: C.textPrimary }]}>
                  {selectedEmployee.trainingCompleted} of {selectedEmployee.trainingTotal} completed
                </Text>
              </View>
              <Text style={[styles.trainingProgressPercent, { color: C.primary }]}>
                {Math.round((selectedEmployee.trainingCompleted / selectedEmployee.trainingTotal) * 100)}%
              </Text>
            </View>
            <View style={[styles.progressBarContainer, { height: hp('1%') }]}>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: C.primary,
                    width: `${(selectedEmployee.trainingCompleted / selectedEmployee.trainingTotal) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.trainingsList}>
            {selectedEmployee.trainings.map((training, index) => (
              <View
                key={index}
                style={[
                  styles.trainingItem,
                  {
                    backgroundColor: C.background,
                    borderColor: C.border,
                    opacity: training.completed ? 1 : 0.8,
                  },
                ]}
              >
                <View style={styles.trainingIconContainer}>
                  <View
                    style={[
                      styles.trainingIcon,
                      {
                        backgroundColor:
                          selectedDepartment === 'IT'
                            ? C.primary + '20'
                            : selectedDepartment === 'Sales'
                            ? C.success + '20'
                            : C.warning + '20',
                      },
                    ]}
                  >
                    {selectedDepartment === 'IT' ? (
                      <Code size={wp('4%')} color={C.primary} />
                    ) : selectedDepartment === 'Sales' ? (
                      <DollarSign size={wp('4%')} color={C.success} />
                    ) : (
                      <Users size={wp('4%')} color={C.warning} />
                    )}
                  </View>
                </View>
                <View style={styles.trainingInfo}>
                  <Text style={[styles.trainingName, { color: C.textPrimary }]}>
                    {training.name}
                  </Text>
                  {training.completed ? (
                    <Text style={[styles.trainingDate, { color: C.textSecondary }]}>
                      Completed: {training.date}
                    </Text>
                  ) : (
                    <View style={styles.trainingProgress}>
                      <Text style={[styles.trainingProgressTextSmall, { color: C.warning }]}>
                        In Progress - {training.progress}%
                      </Text>
                      <View style={[styles.progressBarContainer, { height: hp('0.5%'), marginTop: 4 }]}>
                        <View
                          style={[
                            styles.progressBar,
                            {
                              backgroundColor: C.warning,
                              width: `${training.progress}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </View>
                {training.completed && renderStars(training.rating)}
              </View>
            ))}
          </View>
        </View>

        {/* Performance Summary & Recommendations */}
        <View style={styles.summaryContainer}>
          {/* Performance Distribution */}
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: C.surface, borderColor: C.border },
            ]}
          >
            <Text style={[styles.summaryTitle, { color: C.textPrimary }]}>
              Performance Distribution
            </Text>
            <View style={styles.distributionList}>
              {[
                { label: '5 Star (Excellent)', color: '#FBBF24', count: ratingDistribution[4] },
                { label: '4 Star (Good)', color: '#22D3EE', count: ratingDistribution[3] },
                { label: '3 Star (Average)', color: '#FB923C', count: ratingDistribution[2] },
                { label: '2 Star (Below Avg)', color: '#F87171', count: ratingDistribution[1] },
                { label: '1 Star (Poor)', color: '#EF4444', count: ratingDistribution[0] },
              ].map((item, idx) => (
                <View key={idx} style={styles.distributionItem}>
                  <View style={styles.distributionHeader}>
                    <Text style={[styles.distributionLabel, { color: C.textSecondary }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.distributionCount, { color: item.color }]}>
                      {item.count}
                    </Text>
                  </View>
                  <View style={[styles.progressBarContainer, { height: hp('0.8%') }]}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          backgroundColor: item.color,
                          width: `${(item.count / totalKRAs) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Recommendations */}
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: C.surface, borderColor: C.border },
            ]}
          >
            <Text style={[styles.summaryTitle, { color: C.textPrimary }]}>
              Recommendations
            </Text>
            <View style={styles.recommendationsList}>
              {selectedEmployee.overallRating >= 4.5 && (
                <View
                  style={[
                    styles.recommendationItem,
                    { backgroundColor: C.success + '10', borderColor: C.success + '30' },
                  ]}
                >
                  <Award size={wp('4%')} color={C.success} />
                  <View style={styles.recommendationContent}>
                    <Text style={[styles.recommendationTitle, { color: C.textPrimary }]}>
                      Eligible for Promotion
                    </Text>
                    <Text style={[styles.recommendationDesc, { color: C.textSecondary }]}>
                      Consistently exceeding KRA targets with {selectedEmployee.overallRating} rating
                    </Text>
                  </View>
                </View>
              )}

              {avgAchievement >= 90 && (
                <View
                  style={[
                    styles.recommendationItem,
                    { backgroundColor: C.info + '10', borderColor: C.info + '30' },
                  ]}
                >
                  <TrendingUp size={wp('4%')} color={C.info} />
                  <View style={styles.recommendationContent}>
                    <Text style={[styles.recommendationTitle, { color: C.textPrimary }]}>
                      Performance Bonus Recommended
                    </Text>
                    <Text style={[styles.recommendationDesc, { color: C.textSecondary }]}>
                      Top performer in {selectedDepartment} department with {avgAchievement}% achievement
                    </Text>
                  </View>
                </View>
              )}

              {selectedEmployee.trainingCompleted < selectedEmployee.trainingTotal && (
                <View
                  style={[
                    styles.recommendationItem,
                    { backgroundColor: C.warning + '10', borderColor: C.warning + '30' },
                  ]}
                >
                  <BookOpen size={wp('4%')} color={C.warning} />
                  <View style={styles.recommendationContent}>
                    <Text style={[styles.recommendationTitle, { color: C.textPrimary }]}>
                      Complete Pending Training
                    </Text>
                    <Text style={[styles.recommendationDesc, { color: C.textSecondary }]}>
                      {selectedEmployee.trainingTotal - selectedEmployee.trainingCompleted} training modules remaining
                    </Text>
                  </View>
                </View>
              )}

              {ratingDistribution[0] > 0 && (
                <View
                  style={[
                    styles.recommendationItem,
                    { backgroundColor: C.error + '10', borderColor: C.error + '30' },
                  ]}
                >
                  <Clock size={wp('4%')} color={C.error} />
                  <View style={styles.recommendationContent}>
                    <Text style={[styles.recommendationTitle, { color: C.textPrimary }]}>
                      Performance Improvement Needed
                    </Text>
                    <Text style={[styles.recommendationDesc, { color: C.textSecondary }]}>
                      {ratingDistribution[0]} KRA requires immediate attention and improvement
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={{ height: hp('4%') }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp('3%'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'ios' ? hp('6%') : hp('5%'),
    paddingBottom: hp('2%'),
    borderBottomWidth: 1,
  },
  backBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('2.5%'),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: wp('2%'),
  },
  headerTitle: {
    fontSize: wp('4.5%'),
    fontFamily: Fonts.bold,
  },
  headerSubtitle: {
    fontSize: wp('2.5%'),
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 2,
  },
  downloadBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('2.5%'),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  departmentSelector: {
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    position: 'relative',
    zIndex: 10,
  },
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderRadius: wp('3%'),
    borderWidth: 1,
  },
  selectedDeptText: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.medium,
  },
  dropdown: {
    position: 'absolute',
    top: hp('6%'),
    left: 0,
    right: 0,
    borderRadius: wp('3%'),
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 999,
  },
  dropdownItem: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
  },
  dropdownItemText: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.regular,
  },
  overviewCard: {
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    borderRadius: wp('4%'),
    borderWidth: 1,
    padding: wp('4%'),
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp('2%'),
  },
  employeeName: {
    fontSize: wp('4.5%'),
    fontFamily: Fonts.bold,
  },
  employeeRole: {
    fontSize: wp('3%'),
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  ratingLabel: {
    fontSize: wp('2.5%'),
    fontFamily: Fonts.medium,
    marginBottom: 4,
  },
  ratingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  overallRating: {
    fontSize: wp('5%'),
    fontFamily: Fonts.bold,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: wp('1%'),
  },
  starButton: {
    padding: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
  },
  statCard: {
    flex: 1,
    minWidth: wp('20%'),
    padding: wp('3%'),
    borderRadius: wp('3%'),
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: wp('5%'),
    fontFamily: Fonts.bold,
    marginVertical: hp('0.5%'),
  },
  statLabel: {
    fontSize: wp('2.5%'),
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },
  kraSection: {
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    borderRadius: wp('4%'),
    borderWidth: 1,
    padding: wp('4%'),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontFamily: Fonts.bold,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
  },
  exportBtnText: {
    fontSize: wp('2.5%'),
    fontFamily: Fonts.medium,
  },
  kraItem: {
    borderRadius: wp('3%'),
    borderWidth: 1,
    padding: wp('3%'),
    marginBottom: hp('1.5%'),
  },
  kraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp('1%'),
  },
  kraTitleContainer: {
    flex: 1,
    marginRight: wp('2%'),
  },
  kraCategory: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  percentageBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: wp('2%'),
    paddingVertical: 2,
    borderRadius: wp('2%'),
  },
  percentageText: {
    fontSize: wp('2.2%'),
    fontFamily: Fonts.medium,
  },
  kraRatingContainer: {
    alignItems: 'flex-end',
  },
  ratingLabelSmall: {
    fontSize: wp('2.2%'),
    fontFamily: Fonts.medium,
    marginBottom: 2,
  },
  kraDescription: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.regular,
    marginBottom: hp('1%'),
    lineHeight: hp('2.2%'),
  },
  kraMetrics: {
    flexDirection: 'row',
    gap: wp('4%'),
    marginBottom: hp('1%'),
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: wp('2.2%'),
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.bold,
  },
  progressBarContainer: {
    height: hp('0.8%'),
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: wp('1%'),
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: wp('1%'),
  },
  trainingSection: {
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    borderRadius: wp('4%'),
    borderWidth: 1,
    padding: wp('4%'),
  },
  trainingProgressContainer: {
    marginTop: hp('1%'),
    marginBottom: hp('2%'),
  },
  trainingProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  trainingProgressLabel: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.medium,
  },
  trainingProgressText: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.bold,
    marginTop: 2,
  },
  trainingProgressPercent: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.bold,
  },
  trainingsList: {
    gap: hp('1%'),
  },
  trainingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('3%'),
    borderRadius: wp('3%'),
    borderWidth: 1,
    gap: wp('3%'),
  },
  trainingIconContainer: {
    width: wp('10%'),
  },
  trainingIcon: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  trainingInfo: {
    flex: 1,
  },
  trainingName: {
    fontSize: wp('3%'),
    fontFamily: Fonts.medium,
    marginBottom: 2,
  },
  trainingDate: {
    fontSize: wp('2.2%'),
    fontFamily: Fonts.regular,
  },
  trainingProgress: {
    flex: 1,
  },
  trainingProgressTextSmall: {
    fontSize: wp('2.2%'),
    fontFamily: Fonts.medium,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    gap: wp('2%'),
  },
  summaryCard: {
    flex: 1,
    minWidth: wp('40%'),
    borderRadius: wp('4%'),
    borderWidth: 1,
    padding: wp('4%'),
  },
  summaryTitle: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.bold,
    marginBottom: hp('1.5%'),
  },
  distributionList: {
    gap: hp('1%'),
  },
  distributionItem: {
    gap: hp('0.5%'),
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distributionLabel: {
    fontSize: wp('2.6%'),
    fontFamily: Fonts.medium,
  },
  distributionCount: {
    fontSize: wp('2.6%'),
    fontFamily: Fonts.bold,
  },
  recommendationsList: {
    gap: hp('1%'),
  },
  recommendationItem: {
    flexDirection: 'row',
    padding: wp('3%'),
    borderRadius: wp('3%'),
    borderWidth: 1,
    gap: wp('2%'),
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  recommendationDesc: {
    fontSize: wp('2.4%'),
    fontFamily: Fonts.regular,
    lineHeight: hp('2%'),
  },
});

export default KRA;