// src/redux/actions/leaveActions.js

import apiService from "../../services/apiService";
import {
  APPLY_LEAVE_REQUEST,
  APPLY_LEAVE_SUCCESS,
  APPLY_LEAVE_FAIL,
} from "./types";

export const applyLeave = payload => async dispatch => {
  try {
    console.log('📝 Applying leave...');

    dispatch({ type: APPLY_LEAVE_REQUEST });

    const response = await apiService.post('/leave', payload);

    console.log('📡 Response status:', response.status);

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data?.message || 'Failed to apply leave');
    }

    const leaveData = response.data?.data || response.data;

    console.log('✅ Leave applied successfully:', leaveData);

    dispatch({
      type: APPLY_LEAVE_SUCCESS,
      payload: leaveData,
    });

    return {
      success: true,
      data: leaveData,
    };
  } catch (error) {
    console.log('❌ Apply leave error:', error.message);

    dispatch({
      type: APPLY_LEAVE_FAIL,
      payload: error.response?.data?.message || error.message || 'Failed to apply leave',
    });

    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};