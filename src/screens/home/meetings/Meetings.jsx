// src/screens/MeetingsScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Platform,
  Animated,
  TextInput,
  FlatList,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  Calendar,
  Clock,
  Users,
  Mail,
  Video,
  MapPin,
  Plus,
  X,
  Send,
  ChevronLeft,
  CalendarDays,
  Info,
  ChevronDown,
  ChevronUp,
  Briefcase,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react-native';
import { Fonts } from '../../../utils/GlobalText';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { setAlert } from '../../../store/actions/authActions';
import { useDispatch } from 'react-redux';

// Import calendar components
import ReusableCalendar from '../../../components/common/calender/Reusablecalendar';
import { USER_BRANCH } from '../../../components/common/calender/data/holidayData';

// Mock data for employees
const employees = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah.j@presenza.com', department: 'Engineering' },
  { id: 2, name: 'Michael Chen', email: 'michael.c@presenza.com', department: 'Sales' },
  { id: 3, name: 'Emily Davis', email: 'emily.d@presenza.com', department: 'Marketing' },
  { id: 4, name: 'John Smith', email: 'john.s@presenza.com', department: 'Engineering' },
  { id: 5, name: 'Lisa Brown', email: 'lisa.b@presenza.com', department: 'HR' },
  { id: 6, name: 'David Martinez', email: 'david.m@presenza.com', department: 'Engineering' },
  { id: 7, name: 'Rachel Green', email: 'rachel.g@presenza.com', department: 'Sales' },
];

// Initial meetings data
const initialMeetings = [
  {
    id: 1,
    title: 'Sprint Planning',
    date: '2026-03-22',
    time: '10:00 AM',
    duration: '60',
    attendees: ['Sarah Johnson', 'John Smith', 'David Martinez'],
    attendeeIds: [1, 4, 6],
    location: 'Conference Room A',
    type: 'in-person',
    organizer: 'Sarah Johnson',
    status: 'scheduled',
    agenda: 'Review sprint goals, assign tasks, and plan the upcoming sprint timeline.',
  },
  {
    id: 2,
    title: 'Sales Review Meeting',
    date: '2026-03-23',
    time: '2:00 PM',
    duration: '45',
    attendees: ['Michael Chen', 'Rachel Green', 'Lisa Brown'],
    attendeeIds: [2, 7, 5],
    location: 'Zoom Meeting',
    type: 'virtual',
    organizer: 'Michael Chen',
    status: 'scheduled',
    agenda: 'Review Q1 sales performance and discuss Q2 strategies.',
  },
  {
    id: 3,
    title: 'Design Review',
    date: '2026-03-28',
    time: '11:30 AM',
    duration: '30',
    attendees: ['Emily Davis', 'Sarah Johnson'],
    attendeeIds: [3, 1],
    location: 'Conference Room B',
    type: 'in-person',
    organizer: 'Emily Davis',
    status: 'scheduled',
    agenda: 'Review new UI/UX designs for the mobile app.',
  },
];

const year = 2026;
const todayStr = new Date().toISOString().split('T')[0];

export const MeetingsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const C = theme.colors;
  const dispatch = useDispatch();

  // UI State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [legendExpanded, setLegendExpanded] = useState(false);
  const legendAnim = useRef(new Animated.Value(0)).current;
  const [myMeetings, setMyMeetings] = useState(initialMeetings);
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateMeetings, setSelectedDateMeetings] = useState([]);
  const [meetingDetailModal, setMeetingDetailModal] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Form state
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('30');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingType, setMeetingType] = useState('in-person');
  const [meetingAgenda, setMeetingAgenda] = useState('');

  // Scroll view ref
  const scrollViewRef = useRef(null);
  const formRef = useRef(null);

  // Effect to filter meetings when date changes
  useEffect(() => {
    if (selectedDate) {
      const filtered = myMeetings.filter(meeting => meeting.date === selectedDate);
      setSelectedDateMeetings(filtered);
    } else {
      setSelectedDateMeetings([]);
    }
  }, [selectedDate, myMeetings]);

  // Function to check if a date has meetings (for calendar highlighting)
  const getMeetingDates = () => {
    const meetingDates = {};
    myMeetings.forEach(meeting => {
      meetingDates[meeting.date] = (meetingDates[meeting.date] || 0) + 1;
    });
    return meetingDates;
  };

  const toggleEmployee = (id) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]
    );
  };

  const scrollToForm = () => {
    if (formRef?.current) {
      setTimeout(() => {
        formRef.current?.measureLayout(
          scrollViewRef.current,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
          },
          () => {},
        );
      }, 100);
    }
  };

  const handleScheduleMeeting = () => {
    if (!meetingTitle || !meetingDate || !meetingTime || selectedEmployees.length === 0) {
      dispatch(setAlert('Please fill all required fields', 'warning'));
      return;
    }

    // Get attendee names from selected IDs
    const attendeeNames = selectedEmployees.map(id => {
      const emp = employees.find(e => e.id === id);
      return emp.name;
    });

    // Create new meeting
    const newMeeting = {
      id: myMeetings.length + 1,
      title: meetingTitle,
      date: meetingDate,
      time: meetingTime,
      duration: meetingDuration,
      attendees: attendeeNames,
      attendeeIds: selectedEmployees,
      location: meetingLocation || (meetingType === 'virtual' ? 'Virtual Meeting' : 'Conference Room'),
      type: meetingType,
      organizer: USER_BRANCH,
      status: 'scheduled',
      agenda: meetingAgenda || 'No agenda provided.',
    };

    setMyMeetings([...myMeetings, newMeeting]);
    
    dispatch(setAlert(
      `Meeting scheduled! Email invitations sent to ${selectedEmployees.length} attendees.`,
      'success'
    ));
    
    // Reset form
    setMeetingTitle('');
    setMeetingDate('');
    setMeetingTime('');
    setMeetingDuration('30');
    setMeetingLocation('');
    setMeetingAgenda('');
    setSelectedEmployees([]);
    setShowCreateForm(false);
    setSelectedDate(meetingDate);
  };

  const formatMeetingTime = (timeStr) => {
    return timeStr;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const handleDayPress = (dateStr) => {
    setSelectedDate(dateStr);
    scrollToForm();
  };

  const openMeetingDetail = (meeting) => {
    setMeetingDetailModal(meeting);
  };

  const copyToClipboard = (text) => {
    // In React Native, you would use Clipboard API
    // For now, we'll just show a toast
    dispatch(setAlert('Meeting link copied to clipboard!', 'success'));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const joinMeeting = (meeting) => {
    if (meeting.type === 'virtual') {
      dispatch(setAlert(`Joining meeting: ${meeting.location}`, 'info'));
      // Here you would open the meeting link
    } else {
      dispatch(setAlert(`Meeting location: ${meeting.location}`, 'info'));
    }
  };

  const renderMeetingItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.meetingItem,
        { backgroundColor: C.surface + '40', borderColor: C.border },
      ]}
      onPress={() => openMeetingDetail(item)}
      activeOpacity={0.7}
    >
      <View style={styles.meetingHeader}>
        <View style={styles.meetingTitleRow}>
          <Text style={[styles.meetingTitle, { color: C.textPrimary }]}>
            {item.title}
          </Text>
          <View
            style={[
              styles.meetingTypeBadge,
              {
                backgroundColor:
                  item.type === 'virtual'
                    ? C.info + '20'
                    : C.primary + '20',
              },
            ]}
          >
            {item.type === 'virtual' ? (
              <Video size={wp('2.5%')} color={C.info} />
            ) : (
              <MapPin size={wp('2.5%')} color={C.primary} />
            )}
            <Text
              style={[
                styles.meetingTypeText,
                {
                  color: item.type === 'virtual' ? C.info : C.primary,
                },
              ]}
            >
              {item.type === 'virtual' ? 'Virtual' : 'In-Person'}
            </Text>
          </View>
        </View>

        <View style={styles.meetingDetails}>
          <View style={styles.meetingDetailItem}>
            <Calendar size={wp('3%')} color={C.textSecondary} />
            <Text style={[styles.meetingDetailText, { color: C.textSecondary }]}>
              {formatDate(item.date)}
            </Text>
          </View>
          <View style={styles.meetingDetailItem}>
            <Clock size={wp('3%')} color={C.textSecondary} />
            <Text style={[styles.meetingDetailText, { color: C.textSecondary }]}>
              {item.time} · {item.duration} min
            </Text>
          </View>
        </View>

        <View style={styles.attendeesSection}>
          <View style={styles.attendeesHeader}>
            <Users size={wp('3%')} color={C.textSecondary} />
            <Text style={[styles.attendeesLabel, { color: C.textSecondary }]}>
              Attendees ({item.attendees.length})
            </Text>
          </View>
          <View style={styles.attendeesList}>
            {item.attendees.slice(0, 3).map((attendee, index) => (
              <View
                key={index}
                style={[
                  styles.attendeeChip,
                  { backgroundColor: C.primary + '15' },
                ]}
              >
                <Text style={[styles.attendeeName, { color: C.primary }]}>
                  {attendee}
                </Text>
              </View>
            ))}
            {item.attendees.length > 3 && (
              <View
                style={[
                  styles.attendeeChip,
                  { backgroundColor: C.surface, borderColor: C.border },
                ]}
              >
                <Text style={[styles.attendeeName, { color: C.textSecondary }]}>
                  +{item.attendees.length - 3} more
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[styles.meetingFooter, { borderTopColor: C.border }]}
        >
          <Mail size={wp('3%')} color={C.textSecondary} />
          <Text style={[styles.footerText, { color: C.textSecondary }]}>
            Organized by {item.organizer}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const toggleLegend = () => {
    const toValue = legendExpanded ? 0 : 1;
    Animated.timing(legendAnim, {
      toValue,
      duration: 280,
      useNativeDriver: false,
    }).start();
    setLegendExpanded(v => !v);
  };

  // Custom calendar day renderer to show meeting dots
  const meetingDates = getMeetingDates();

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
            Meeting Scheduler
          </Text>
          <Text style={[styles.headerSubtitle, { color: C.textSecondary }]}>
            Schedule and manage team meetings
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreateForm(!showCreateForm)}
          style={[
            styles.createBtn,
            { backgroundColor: C.primary, borderColor: C.border },
          ]}
        >
          {showCreateForm ? (
            <X size={wp('4%')} color="#fff" />
          ) : (
            <Plus size={wp('4%')} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: C.surface, borderColor: C.border },
            ]}
          >
            <Calendar size={wp('5%')} color={C.primary} />
            <Text style={[styles.statValue, { color: C.textPrimary }]}>
              {myMeetings.length}
            </Text>
            <Text style={[styles.statLabel, { color: C.textSecondary }]}>
              Total Meetings
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: C.surface, borderColor: C.border },
            ]}
          >
            <Users size={wp('5%')} color={C.success} />
            <Text style={[styles.statValue, { color: C.textPrimary }]}>
              {myMeetings.reduce((sum, m) => sum + m.attendees.length, 0)}
            </Text>
            <Text style={[styles.statLabel, { color: C.textSecondary }]}>
              Total Participants
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: C.surface, borderColor: C.border },
            ]}
          >
            <Video size={wp('5%')} color={C.info} />
            <Text style={[styles.statValue, { color: C.textPrimary }]}>
              {myMeetings.filter(m => m.type === 'virtual').length}
            </Text>
            <Text style={[styles.statLabel, { color: C.textSecondary }]}>
              Virtual Meetings
            </Text>
          </View>
        </View>

        {/* Calendar Component with Meeting Dots */}
        <View style={styles.calendarWrapper}>
          <ReusableCalendar
            year={year}
            userBranch={USER_BRANCH}
            startDate={selectedDate}
            endDate={null}
            selectionMode="start"
            leaveType="full"
            todayStr={todayStr}
            onStartDateChange={(date) => handleDayPress(date)}
            onEndDateChange={() => {}}
            onSelectionModeChange={() => {}}
            onFullHolidayPress={() => {}}
            onHalfHolidayPress={() => {}}
            showHolidayList={false}
            showStats={false}
          />
          
          {/* Meeting indicator overlay - custom meeting dots */}
          {Object.keys(meetingDates).length > 0 && (
            <View style={styles.meetingDotsContainer} pointerEvents="none">
              {Object.entries(meetingDates).map(([date, count]) => {
                const dateObj = new Date(date);
                if (dateObj.getFullYear() === year) {
                  // Position calculation would require complex calendar cell positioning
                  // For simplicity, we'll show a note below the calendar
                  return null;
                }
                return null;
              })}
            </View>
          )}
          
          {/* Meeting count note */}
          {Object.keys(meetingDates).length > 0 && (
            <View style={[styles.meetingNote, { backgroundColor: C.primary + '10', borderColor: C.primary + '30' }]}>
              <Info size={wp('3%')} color={C.primary} />
              <Text style={[styles.meetingNoteText, { color: C.primary }]}>
                📅 {Object.keys(meetingDates).length} date{Object.keys(meetingDates).length !== 1 ? 's' : ''} have meetings scheduled
              </Text>
            </View>
          )}
        </View>

        {/* Selected Date Meetings */}
        {selectedDate && (
          <View
            style={[
              styles.meetingsListCard,
              { backgroundColor: C.surface, borderColor: C.border },
            ]}
          >
            <View style={styles.meetingsListHeader}>
              <Text style={[styles.meetingsListTitle, { color: C.textPrimary }]}>
                Meetings on {formatDate(selectedDate)}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDate(null)}>
                <X size={wp('4%')} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedDateMeetings.length > 0 ? (
              <FlatList
                data={selectedDateMeetings}
                renderItem={renderMeetingItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                contentContainerStyle={styles.meetingsList}
              />
            ) : (
              <View style={styles.noMeetingsContainer}>
                <CalendarDays size={wp('8%')} color={C.disabled} />
                <Text style={[styles.noMeetingsText, { color: C.textSecondary }]}>
                  No meetings scheduled for this date
                </Text>
                <TouchableOpacity
                  style={[styles.scheduleBtn, { backgroundColor: C.primary + '20' }]}
                  onPress={() => {
                    setMeetingDate(selectedDate);
                    setShowCreateForm(true);
                    scrollToForm();
                  }}
                >
                  <Plus size={wp('3%')} color={C.primary} />
                  <Text style={[styles.scheduleBtnText, { color: C.primary }]}>
                    Schedule Meeting
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Create Meeting Form */}
        {showCreateForm && (
          <View
            ref={formRef}
            style={[
              styles.createForm,
              { backgroundColor: C.surface, borderColor: C.border },
            ]}
          >
            <Text style={[styles.formTitle, { color: C.textPrimary }]}>
              Create New Meeting
            </Text>

            {/* Meeting Title */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: C.textSecondary }]}>
                Meeting Title <Text style={{ color: C.error }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: C.background,
                    borderColor: C.border,
                    color: C.textPrimary,
                  },
                ]}
                placeholder="e.g., Sprint Planning Meeting"
                placeholderTextColor={C.disabled}
                value={meetingTitle}
                onChangeText={setMeetingTitle}
              />
            </View>

            {/* Date and Time */}
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: wp('2%') }]}>
                <Text style={[styles.formLabel, { color: C.textSecondary }]}>
                  Date <Text style={{ color: C.error }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: C.background,
                      borderColor: C.border,
                    },
                  ]}
                  onPress={() => {
                    // Show calendar selection
                    dispatch(setAlert('Please tap on a date in the calendar above', 'info'));
                  }}
                >
                  <Calendar size={wp('3.5%')} color={C.textSecondary} />
                  <Text
                    style={[
                      styles.dateInputText,
                      { color: meetingDate ? C.textPrimary : C.disabled },
                    ]}
                  >
                    {meetingDate ? formatShortDate(meetingDate) : 'Select Date from Calendar'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.formLabel, { color: C.textSecondary }]}>
                  Time <Text style={{ color: C.error }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: C.background,
                      borderColor: C.border,
                      color: C.textPrimary,
                    },
                  ]}
                  placeholder="10:00 AM"
                  placeholderTextColor={C.disabled}
                  value={meetingTime}
                  onChangeText={setMeetingTime}
                />
              </View>
            </View>

            {/* Duration */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: C.textSecondary }]}>
                Duration (minutes)
              </Text>
              <View style={styles.durationButtons}>
                {['15', '30', '45', '60', '90', '120'].map((dur) => (
                  <TouchableOpacity
                    key={dur}
                    style={[
                      styles.durationBtn,
                      {
                        backgroundColor:
                          meetingDuration === dur
                            ? C.primary + '20'
                            : C.background,
                        borderColor:
                          meetingDuration === dur ? C.primary : C.border,
                      },
                    ]}
                    onPress={() => setMeetingDuration(dur)}
                  >
                    <Text
                      style={[
                        styles.durationBtnText,
                        {
                          color:
                            meetingDuration === dur ? C.primary : C.textSecondary,
                        },
                      ]}
                    >
                      {dur}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Meeting Type */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: C.textSecondary }]}>
                Meeting Type
              </Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor:
                        meetingType === 'in-person'
                          ? C.primary + '20'
                          : C.background,
                      borderColor:
                        meetingType === 'in-person' ? C.primary : C.border,
                    },
                  ]}
                  onPress={() => setMeetingType('in-person')}
                >
                  <MapPin
                    size={wp('3.5%')}
                    color={meetingType === 'in-person' ? C.primary : C.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      {
                        color:
                          meetingType === 'in-person'
                            ? C.primary
                            : C.textSecondary,
                      },
                    ]}
                  >
                    In-Person
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor:
                        meetingType === 'virtual'
                          ? C.info + '20'
                          : C.background,
                      borderColor:
                        meetingType === 'virtual' ? C.info : C.border,
                    },
                  ]}
                  onPress={() => setMeetingType('virtual')}
                >
                  <Video
                    size={wp('3.5%')}
                    color={meetingType === 'virtual' ? C.info : C.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      {
                        color:
                          meetingType === 'virtual' ? C.info : C.textSecondary,
                      },
                    ]}
                  >
                    Virtual
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Location */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: C.textSecondary }]}>
                Location / Meeting Link
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: C.background,
                    borderColor: C.border,
                    color: C.textPrimary,
                  },
                ]}
                placeholder={
                  meetingType === 'virtual'
                    ? 'e.g., https://zoom.us/j/123456789'
                    : 'e.g., Conference Room A'
                }
                placeholderTextColor={C.disabled}
                value={meetingLocation}
                onChangeText={setMeetingLocation}
              />
            </View>

            {/* Agenda */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: C.textSecondary }]}>
                Agenda / Description
              </Text>
              <TextInput
                style={[
                  styles.formTextArea,
                  {
                    backgroundColor: C.background,
                    borderColor: C.border,
                    color: C.textPrimary,
                  },
                ]}
                placeholder="Meeting agenda and topics to discuss..."
                placeholderTextColor={C.disabled}
                value={meetingAgenda}
                onChangeText={setMeetingAgenda}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Attendees */}
            <View style={styles.formGroup}>
              <View style={styles.attendeesHeaderForm}>
                <Text style={[styles.formLabel, { color: C.textSecondary }]}>
                  Select Attendees <Text style={{ color: C.error }}>*</Text>
                </Text>
                {selectedEmployees.length > 0 && (
                  <TouchableOpacity onPress={() => setSelectedEmployees([])}>
                    <Text style={[styles.clearAllText, { color: C.warning }]}>
                      Clear all
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.selectedCount, { color: C.primary }]}>
                {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
              </Text>

              <View
                style={[
                  styles.attendeesContainer,
                  {
                    backgroundColor: C.background,
                    borderColor: C.border,
                  },
                ]}
              >
                {employees.map((employee) => (
                  <TouchableOpacity
                    key={employee.id}
                    style={[
                      styles.attendeeItem,
                      {
                        backgroundColor: selectedEmployees.includes(employee.id)
                          ? C.primary + '15'
                          : 'transparent',
                        borderColor: selectedEmployees.includes(employee.id)
                          ? C.primary
                          : C.border,
                      },
                    ]}
                    onPress={() => toggleEmployee(employee.id)}
                  >
                    <View style={styles.attendeeInfo}>
                      <Text style={[styles.attendeeNameForm, { color: C.textPrimary }]}>
                        {employee.name}
                      </Text>
                      <Text style={[styles.attendeeEmail, { color: C.textSecondary }]}>
                        {employee.email}
                      </Text>
                      <Text style={[styles.attendeeDept, { color: C.primary }]}>
                        {employee.department}
                      </Text>
                    </View>
                    {selectedEmployees.includes(employee.id) && (
                      <View
                        style={[
                          styles.selectedCheck,
                          { backgroundColor: C.primary },
                        ]}
                      >
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  { borderColor: C.border, backgroundColor: C.background },
                ]}
                onPress={() => setShowCreateForm(false)}
              >
                <Text style={[styles.cancelBtnText, { color: C.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: C.primary },
                ]}
                onPress={handleScheduleMeeting}
              >
                <Send size={wp('4%')} color="#fff" />
                <Text style={styles.submitBtnText}>Schedule & Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* All Upcoming Meetings */}
        <View
          style={[
            styles.upcomingCard,
            { backgroundColor: C.surface, borderColor: C.border },
          ]}
        >
          <Text style={[styles.upcomingTitle, { color: C.textPrimary }]}>
            All Meetings ({myMeetings.length})
          </Text>
          {myMeetings.length > 0 ? (
            myMeetings.map((meeting) => (
              <View key={meeting.id}>
                {renderMeetingItem({ item: meeting })}
              </View>
            ))
          ) : (
            <View style={styles.noMeetingsContainer}>
              <CalendarDays size={wp('8%')} color={C.disabled} />
              <Text style={[styles.noMeetingsText, { color: C.textSecondary }]}>
                No meetings scheduled yet
              </Text>
              <TouchableOpacity
                style={[styles.scheduleBtn, { backgroundColor: C.primary + '20' }]}
                onPress={() => setShowCreateForm(true)}
              >
                <Plus size={wp('3%')} color={C.primary} />
                <Text style={[styles.scheduleBtnText, { color: C.primary }]}>
                  Schedule Your First Meeting
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Legend */}
        <View
          style={[
            styles.legendCard,
            { backgroundColor: C.surface, borderColor: C.border },
          ]}
        >
          <TouchableOpacity style={styles.legendToggleBtn} onPress={toggleLegend}>
            <View style={styles.legendToggleLeft}>
              <View
                style={[
                  styles.legendToggleIcon,
                  { backgroundColor: C.primary + '18' },
                ]}
              >
                <Info size={wp('3.5%')} color={C.primary} />
              </View>
              <Text style={[styles.legendToggleTitle, { color: C.textPrimary }]}>
                Calendar Legend
              </Text>
            </View>
            <View
              style={[
                styles.legendChevronWrap,
                { backgroundColor: C.background, borderColor: C.border },
              ]}
            >
              {legendExpanded ? (
                <ChevronUp size={wp('4%')} color={C.textSecondary} />
              ) : (
                <ChevronDown size={wp('4%')} color={C.textSecondary} />
              )}
            </View>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.legendContent,
              {
                maxHeight: legendAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 250],
                }),
                opacity: legendAnim,
                overflow: 'hidden',
              },
            ]}
          >
            <View style={[styles.legendDivider, { backgroundColor: C.border }]} />
            <View style={styles.legendGrid}>
              {[
                { color: C.primary, label: 'Full Day Holiday' },
                { color: C.warning, label: 'Half Day Holiday' },
                { color: C.error, label: 'Weekly Off' },
                { color: C.success, label: 'Selected Date' },
                { color: C.info, label: 'Date with Meetings' },
              ].map((item, i) => (
                <View key={i} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: item.color },
                    ]}
                  />
                  <Text style={[styles.legendText, { color: C.textSecondary }]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        <View style={{ height: hp('4%') }} />
      </ScrollView>

      {/* Meeting Detail Modal */}
      <Modal
        visible={meetingDetailModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setMeetingDetailModal(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: C.overlayBg }]}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: C.surfaceSolid, borderColor: C.border },
            ]}
          >
            {meetingDetailModal && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: C.textPrimary }]}>
                    {meetingDetailModal.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setMeetingDetailModal(null)}
                    style={[
                      styles.modalCloseBtn,
                      { backgroundColor: C.background, borderColor: C.border },
                    ]}
                  >
                    <X size={wp('4%')} color={C.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Meeting Type Badge */}
                  <View style={styles.modalTypeBadge}>
                    <View
                      style={[
                        styles.meetingTypeBadgeLarge,
                        {
                          backgroundColor:
                            meetingDetailModal.type === 'virtual'
                              ? C.info + '20'
                              : C.primary + '20',
                        },
                      ]}
                    >
                      {meetingDetailModal.type === 'virtual' ? (
                        <Video size={wp('4%')} color={C.info} />
                      ) : (
                        <MapPin size={wp('4%')} color={C.primary} />
                      )}
                      <Text
                        style={[
                          styles.modalTypeText,
                          {
                            color:
                              meetingDetailModal.type === 'virtual'
                                ? C.info
                                : C.primary,
                          },
                        ]}
                      >
                        {meetingDetailModal.type === 'virtual'
                          ? 'Virtual Meeting'
                          : 'In-Person Meeting'}
                      </Text>
                    </View>
                  </View>

                  {/* Date & Time */}
                  <View style={styles.modalDetailSection}>
                    <View style={styles.modalDetailRow}>
                      <Calendar size={wp('4%')} color={C.primary} />
                      <Text style={[styles.modalDetailText, { color: C.textPrimary }]}>
                        {formatDate(meetingDetailModal.date)}
                      </Text>
                    </View>
                    <View style={styles.modalDetailRow}>
                      <Clock size={wp('4%')} color={C.primary} />
                      <Text style={[styles.modalDetailText, { color: C.textPrimary }]}>
                        {meetingDetailModal.time} · {meetingDetailModal.duration} minutes
                      </Text>
                    </View>
                    <View style={styles.modalDetailRow}>
                      {meetingDetailModal.type === 'virtual' ? (
                        <Video size={wp('4%')} color={C.primary} />
                      ) : (
                        <MapPin size={wp('4%')} color={C.primary} />
                      )}
                      <Text style={[styles.modalDetailText, { color: C.textPrimary }]}>
                        {meetingDetailModal.location}
                      </Text>
                      {meetingDetailModal.type === 'virtual' && (
                        <TouchableOpacity
                          onPress={() => copyToClipboard(meetingDetailModal.location)}
                          style={styles.copyBtn}
                        >
                          {copiedLink ? (
                            <Check size={wp('3%')} color={C.success} />
                          ) : (
                            <Copy size={wp('3%')} color={C.textSecondary} />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Agenda */}
                  {meetingDetailModal.agenda && (
                    <View style={styles.modalAgendaSection}>
                      <Text style={[styles.modalSectionTitle, { color: C.textPrimary }]}>
                        Agenda
                      </Text>
                      <Text style={[styles.modalAgendaText, { color: C.textSecondary }]}>
                        {meetingDetailModal.agenda}
                      </Text>
                    </View>
                  )}

                  {/* Attendees */}
                  <View style={styles.modalAttendeesSection}>
                    <Text style={[styles.modalSectionTitle, { color: C.textPrimary }]}>
                      Attendees ({meetingDetailModal.attendees.length})
                    </Text>
                    <View style={styles.modalAttendeesList}>
                      {meetingDetailModal.attendees.map((attendee, index) => (
                        <View
                          key={index}
                          style={[
                            styles.modalAttendeeItem,
                            { backgroundColor: C.background, borderColor: C.border },
                          ]}
                        >
                          <Users size={wp('3%')} color={C.primary} />
                          <View style={styles.modalAttendeeInfo}>
                            <Text style={[styles.modalAttendeeName, { color: C.textPrimary }]}>
                              {attendee}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Organizer */}
                  <View style={styles.modalOrganizerSection}>
                    <Mail size={wp('3.5%')} color={C.textSecondary} />
                    <Text style={[styles.modalOrganizerText, { color: C.textSecondary }]}>
                      Organized by {meetingDetailModal.organizer}
                    </Text>
                  </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.modalJoinBtn,
                      { backgroundColor: C.primary },
                    ]}
                    onPress={() => joinMeeting(meetingDetailModal)}
                  >
                    {meetingDetailModal.type === 'virtual' ? (
                      <ExternalLink size={wp('4%')} color="#fff" />
                    ) : (
                      <MapPin size={wp('4%')} color="#fff" />
                    )}
                    <Text style={styles.modalJoinBtnText}>
                      {meetingDetailModal.type === 'virtual' ? 'Join Meeting' : 'View Location'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalCancelBtn,
                      { borderColor: C.border, backgroundColor: C.background },
                    ]}
                    onPress={() => setMeetingDetailModal(null)}
                  >
                    <Text style={[styles.modalCancelBtnText, { color: C.textSecondary }]}>
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  createBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('2.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp('4%'),
    marginTop: hp('2%'),
    gap: wp('2%'),
  },
  statCard: {
    flex: 1,
    padding: wp('3%'),
    borderRadius: wp('3%'),
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: wp('6%'),
    fontFamily: Fonts.bold,
    marginTop: hp('0.5%'),
  },
  statLabel: {
    fontSize: wp('2.5%'),
    fontFamily: Fonts.medium,
    textAlign: 'center',
    marginTop: 2,
  },
  calendarWrapper: {
    position: 'relative',
  },
  meetingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp('4%'),
    marginTop: hp('1%'),
    padding: wp('2.5%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
    gap: wp('2%'),
  },
  meetingNoteText: {
    fontSize: wp('2.6%'),
    fontFamily: Fonts.medium,
    flex: 1,
  },
  meetingsListCard: {
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    borderRadius: wp('4%'),
    borderWidth: 1,
    padding: wp('4%'),
  },
  meetingsListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  meetingsListTitle: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.bold,
    flex: 1,
  },
  meetingsList: {
    gap: hp('1%'),
  },
  meetingItem: {
    borderRadius: wp('3%'),
    borderWidth: 1,
    padding: wp('3%'),
    marginBottom: hp('1%'),
  },
  meetingHeader: {
    gap: hp('0.8%'),
  },
  meetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: wp('2%'),
  },
  meetingTitle: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.bold,
    flex: 1,
  },
  meetingTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('2%'),
    paddingVertical: 3,
    borderRadius: wp('2%'),
    gap: 4,
  },
  meetingTypeText: {
    fontSize: wp('2.2%'),
    fontFamily: Fonts.medium,
  },
  meetingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('3%'),
    marginTop: hp('0.5%'),
  },
  meetingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  meetingDetailText: {
    fontSize: wp('2.6%'),
    fontFamily: Fonts.regular,
  },
  attendeesSection: {
    marginTop: hp('0.5%'),
  },
  attendeesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    marginBottom: hp('0.5%'),
  },
  attendeesLabel: {
    fontSize: wp('2.4%'),
    fontFamily: Fonts.medium,
  },
  attendeesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('1.5%'),
  },
  attendeeChip: {
    paddingHorizontal: wp('2%'),
    paddingVertical: 3,
    borderRadius: wp('2%'),
    borderWidth: 0,
  },
  attendeeName: {
    fontSize: wp('2.2%'),
    fontFamily: Fonts.medium,
  },
  meetingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
    paddingTop: hp('1%'),
    borderTopWidth: 1,
    marginTop: hp('0.5%'),
  },
  footerText: {
    fontSize: wp('2.2%'),
    fontFamily: Fonts.regular,
  },
  createForm: {
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    borderRadius: wp('4%'),
    borderWidth: 1,
    padding: wp('4%'),
    gap: hp('1.5%'),
  },
  formTitle: {
    fontSize: wp('4%'),
    fontFamily: Fonts.bold,
    marginBottom: hp('0.5%'),
  },
  formGroup: {
    gap: hp('0.5%'),
  },
  formLabel: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.medium,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    fontSize: wp('3%'),
    fontFamily: Fonts.regular,
  },
  formTextArea: {
    borderWidth: 1,
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    fontSize: wp('3%'),
    fontFamily: Fonts.regular,
    minHeight: hp('10%'),
  },
  row: {
    flexDirection: 'row',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    gap: wp('2%'),
  },
  dateInputText: {
    fontSize: wp('3%'),
    fontFamily: Fonts.regular,
    flex: 1,
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
  },
  durationBtn: {
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
  },
  durationBtnText: {
    fontSize: wp('2.6%'),
    fontFamily: Fonts.medium,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: wp('2%'),
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('1.5%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('2.5%'),
    borderWidth: 1,
  },
  typeBtnText: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.medium,
  },
  attendeesHeaderForm: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: wp('2.4%'),
    fontFamily: Fonts.medium,
  },
  selectedCount: {
    fontSize: wp('2.4%'),
    fontFamily: Fonts.medium,
  },
  attendeesContainer: {
    borderWidth: 1,
    borderRadius: wp('3%'),
    maxHeight: hp('30%'),
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp('3%'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeNameForm: {
    fontSize: wp('3%'),
    fontFamily: Fonts.medium,
  },
  attendeeEmail: {
    fontSize: wp('2.2%'),
    fontFamily: Fonts.regular,
    marginTop: 1,
  },
  attendeeDept: {
    fontSize: wp('2.2%'),
    fontFamily: Fonts.medium,
    marginTop: 2,
  },
  selectedCheck: {
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: wp('3%'),
    fontWeight: 'bold',
  },
  formActions: {
    flexDirection: 'row',
    gap: wp('3%'),
    marginTop: hp('1%'),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: hp('1.2%'),
    borderRadius: wp('2.5%'),
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.medium,
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    paddingVertical: hp('1.2%'),
    borderRadius: wp('2.5%'),
  },
  submitBtnText: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.bold,
    color: '#fff',
  },
  upcomingCard: {
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    borderRadius: wp('4%'),
    borderWidth: 1,
    padding: wp('4%'),
  },
  upcomingTitle: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.bold,
    marginBottom: hp('1.5%'),
  },
  noMeetingsContainer: {
    alignItems: 'center',
    paddingVertical: hp('3%'),
    gap: hp('1%'),
  },
  noMeetingsText: {
    fontSize: wp('3%'),
    fontFamily: Fonts.regular,
  },
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('2%'),
    marginTop: hp('1%'),
  },
  scheduleBtnText: {
    fontSize: wp('2.6%'),
    fontFamily: Fonts.medium,
  },
  legendCard: {
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    borderRadius: wp('4%'),
    borderWidth: 1,
    overflow: 'hidden',
  },
  legendToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp('4%'),
  },
  legendToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
  },
  legendToggleIcon: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendToggleTitle: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.bold,
  },
  legendChevronWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  legendContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: wp('4%'),
  },
  legendDivider: {
    height: 1,
    marginBottom: wp('3%'),
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('3%'),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    width: '47%',
  },
  legendDot: {
    width: wp('3%'),
    height: wp('3%'),
    borderRadius: wp('1.5%'),
  },
  legendText: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.regular,
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: wp('5%'),
    borderTopRightRadius: wp('5%'),
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: hp('80%'),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: wp('4.5%'),
    fontFamily: Fonts.bold,
    flex: 1,
    marginRight: wp('2%'),
  },
  modalCloseBtn: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  modalBody: {
    padding: wp('4%'),
    maxHeight: hp('60%'),
  },
  modalTypeBadge: {
    marginBottom: hp('2%'),
  },
  meetingTypeBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('2%'),
    gap: wp('2%'),
  },
  modalTypeText: {
    fontSize: wp('3%'),
    fontFamily: Fonts.medium,
  },
  modalDetailSection: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: wp('3%'),
    padding: wp('3%'),
    marginBottom: hp('2%'),
    gap: hp('1%'),
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  modalDetailText: {
    fontSize: wp('3%'),
    fontFamily: Fonts.regular,
    flex: 1,
  },
  copyBtn: {
    padding: wp('1%'),
  },
  modalAgendaSection: {
    marginBottom: hp('2%'),
  },
  modalSectionTitle: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.bold,
    marginBottom: hp('1%'),
  },
  modalAgendaText: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.regular,
    lineHeight: hp('2.2%'),
  },
  modalAttendeesSection: {
    marginBottom: hp('2%'),
  },
  modalAttendeesList: {
    gap: hp('0.8%'),
  },
  modalAttendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    padding: wp('2%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
  },
  modalAttendeeInfo: {
    flex: 1,
  },
  modalAttendeeName: {
    fontSize: wp('2.8%'),
    fontFamily: Fonts.medium,
  },
  modalOrganizerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    paddingTop: hp('1%'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: hp('0.5%'),
  },
  modalOrganizerText: {
    fontSize: wp('2.6%'),
    fontFamily: Fonts.regular,
  },
  modalActions: {
    flexDirection: 'row',
    gap: wp('3%'),
    padding: wp('4%'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalJoinBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    paddingVertical: hp('1.2%'),
    borderRadius: wp('2.5%'),
  },
  modalJoinBtnText: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.bold,
    color: '#fff',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: hp('1.2%'),
    borderRadius: wp('2.5%'),
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: wp('3.2%'),
    fontFamily: Fonts.medium,
  },
});

export default MeetingsScreen;