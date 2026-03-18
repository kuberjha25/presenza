import * as types from './types';
import apiService from '../../services/apiService';

export const getEmployeeProfile = () => async dispatch => {
  try {
    console.log('👤 Fetching employee profile...');

    dispatch({
      type: types.EMPLOYEE_PROFILE_REQUEST,
    });

    const response = await apiService.get('/employee/profile');

    console.log('📡 Response status:', response.status);

    if (response.status !== 200) {
      throw new Error(response.data?.message || 'Failed to fetch profile');
    }

    const profileData = response.data?.data || {};

    console.log('✅ Profile fetched:', profileData);

    dispatch({
      type: types.EMPLOYEE_PROFILE_SUCCESS,
      payload: profileData,
    });

    return {
      success: true,
      data: profileData,
    };
  } catch (error) {
    console.log('❌ Profile fetch error:', error.message);

    dispatch({
      type: types.EMPLOYEE_PROFILE_FAIL,
      payload:
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch profile',
    });

    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};