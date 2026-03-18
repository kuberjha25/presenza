// src/components/modals/BreakReasonModal.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Fonts } from '../../utils/GlobalText';

const BreakReasonModal = ({ visible, onClose, onConfirm, loading }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const C = theme.colors;
  
  const [remarks, setRemarks] = useState('');
  const [breakType, setBreakType] = useState('LUNCH');

  const breakTypes = [
    { label: t.breaks.lunch, value: 'LUNCH' },
    { label: t.breaks.tea, value: 'TEA' },
    { label: t.breaks.coffee, value: 'COFFEE' },
    { label: t.breaks.personal, value: 'PERSONAL' },
    { label: t.breaks.other, value: 'OTHER' },
  ];

  const handleConfirm = () => {
    if (!remarks.trim()) {
      alert(t.breaks.reasonRequired || 'Please enter a reason for break');
      return;
    }
    onConfirm(breakType, remarks);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: C.overlayBg }]}>
        <View style={[styles.modalContent, { 
          backgroundColor: C.surfaceSolid,
          borderColor: C.border,
        }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>
              {t.breaks.startBreak}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X size={wp('6%')} color={C.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: C.textSecondary }]}>
            {t.breaks.breakType}
          </Text>
          <View style={styles.breakTypeContainer}>
            {breakTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.breakTypeButton,
                  { 
                    borderColor: breakType === type.value ? C.primary : C.border,
                    backgroundColor: breakType === type.value ? C.primary + '20' : 'transparent',
                  },
                ]}
                onPress={() => setBreakType(type.value)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.breakTypeText,
                    { color: breakType === type.value ? C.primary : C.textPrimary },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: C.textSecondary }]}>
            {t.breaks.reason}
          </Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: C.inputBg,
              borderColor: C.inputBorder,
              color: C.textPrimary,
            }]}
            placeholder={t.breaks.reasonPlaceholder}
            placeholderTextColor={C.textSecondary}
            value={remarks}
            onChangeText={setRemarks}
            multiline
            numberOfLines={3}
            editable={!loading}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { 
                borderColor: C.border,
              }]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: C.textSecondary }]}>
                {t.breaks.cancel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, { 
                backgroundColor: C.primary,
              }, loading && { opacity: 0.5 }]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={C.textDark} />
              ) : (
                <Text style={[styles.confirmButtonText, { color: C.textDark }]}>
                  {t.breaks.confirm}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: wp('90%'),
    borderRadius: wp('5%'),
    padding: wp('5%'),
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  modalTitle: {
    fontSize: wp('5%'),
    fontFamily: Fonts.bold,
  },
  label: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.medium,
    marginBottom: hp('1%'),
    marginTop: hp('1.5%'),
  },
  breakTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
    marginBottom: hp('1%'),
  },
  breakTypeButton: {
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
    marginBottom: hp('1%'),
  },
  breakTypeText: {
    fontSize: wp('3%'),
    fontFamily: Fonts.regular,
  },
  input: {
    borderWidth: 1,
    borderRadius: wp('3%'),
    padding: wp('3%'),
    fontFamily: Fonts.regular,
    fontSize: wp('3.5%'),
    textAlignVertical: 'top',
    minHeight: hp('10%'),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('3%'),
    gap: wp('3%'),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.medium,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: wp('3.5%'),
    fontFamily: Fonts.medium,
  },
});

export default BreakReasonModal;