import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0 mins';
  
  const units = [
    { label: 'week', value: 7 * 24 * 60 }, // minutes in a week
    { label: 'day', value: 24 * 60 },      // minutes in a day
    { label: 'hour', value: 60 },           // minutes in an hour
    { label: 'min', value: 1 }              // minutes
  ];

  const result = [];
  let remaining = minutes;

  for (const unit of units) {
    if (remaining >= unit.value) {
      const count = Math.floor(remaining / unit.value);
      remaining %= unit.value;
      
      if (count > 0) {
        const plural = count > 1 ? `${unit.label}s` : unit.label;
        result.push(`${count} ${plural}`);
      }
    }
  }

  return result.join(' ') || `${minutes} mins`;
};

// Alternative formats based on need
export const formatDurationShort = (minutes) => {
  if (!minutes || minutes === 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const formatDurationDetailed = (minutes) => {
  if (!minutes || minutes === 0) return '0 minutes';
  
  const weeks = Math.floor(minutes / (7 * 24 * 60));
  const days = Math.floor((minutes % (7 * 24 * 60)) / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = minutes % 60;
  
  const parts = [];
  if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (mins > 0) parts.push(`${mins} minute${mins > 1 ? 's' : ''}`);
  
  return parts.join(', ') || '0 minutes';
};

// For attendance/tracking specific format
export const formatAttendanceDuration = (minutes) => {
  if (!minutes || minutes === 0) return '--:--';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} hrs`;
};


// const GOOGLE_API_KEY = 'my-google-api-key';

// export const getAddressFromCoords = async (lat, lng) => {
//   try {
//     const response = await fetch(
//       `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
//       {
//         headers: {
//           'User-Agent': 'PresenzaApp/1.0',
//         },
//       },
//     );

//     const data = await response.json();

//     if (!data || !data.display_name) {
//       return 'Address unavailable';
//     }

//     return data.display_name;
//   } catch (error) {
//     console.log('Geocode error:', error);
//     return 'Address unavailable';
//   }
// };

export const getAddressFromCoords = async (lat, lng) => {
    const GOOGLE_API_KEY = 'AIzaSyBq2vZw0vfoiTSm2DypMQ6-odWpsJYLCEc';

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results.length) {
      return 'Address unavailable';
    }

    return data.results[0].formatted_address;
  } catch (error) {
    console.log('Geocode error:', error);
    return 'Address unavailable';
  }
};



export const getCurrentLocation = async () => {
  try {
    // =========================
    // ANDROID PERMISSION
    // =========================
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs your location to mark attendance',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw { code: 1, message: 'Location permission not granted.' };
      }
    }

    // =========================
    // IOS PERMISSION
    // =========================
    if (Platform.OS === 'ios') {
      const permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

      const status = await check(permission);

      if (status === RESULTS.DENIED) {
        const requestStatus = await request(permission);

        if (requestStatus !== RESULTS.GRANTED) {
          throw { code: 1, message: 'Location permission denied' };
        }
      }

      if (status === RESULTS.BLOCKED) {
        throw {
          code: 1,
          message: 'Location permission blocked. Enable from Settings.',
        };
      }
    }

    // =========================
    // GET LOCATION
    // =========================
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          forceRequestLocation: true,
          showLocationDialog: true,
        },
      );
    });
  } catch (error) {
    throw error;
  }
};


export const requestCameraPermission = async () => {
  const permission =
    Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.CAMERA
      : PERMISSIONS.IOS.CAMERA;

  try {
    const status = await check(permission);

    if (status === RESULTS.GRANTED) {
      return true;
    }

    const result = await request(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.log('Camera permission error:', error);
    return false;
  }
};

export const formatMinutesToHours = (minutes) => {
  if (!minutes && minutes !== 0) return '---';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} min`;
};

