import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

import SplashScreen from './../screens/SplashScreen';
import LoginScreen from './../screens/auth/LoginScreen';
import ProfileScreen from './../screens/common/ProfileScreen';
import DriverHome from './../screens/driver/DriverHome';
import DriverQueueScreen from './../screens/driver/DriverQueueScreen';
import DriverRideActive from './../screens/driver/DriverRideActiveScreen';
import DriverRideHistory from './../screens/driver/DriverRideHistoryScreen';
import PassengerHome from './../screens/passenger/PassengerHomeScreen';
import BookingScreen from './../screens/passenger/BookingScreen';
import PassengerRideStatus from './../screens/passenger/PassengerRideStatusScreen';
import PassengerRideHistory from './../screens/passenger/PassengerRideHistoryScreen';
import RegisterScreen from './../screens/common/RegisterScreen';

import { useAuth } from '../context/AuthContext';

enableScreens();

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  animation: 'fade',
};

const AppNavigator = () => {
  const { user, loading } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {loading ? (
          // 1. Loading State
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !user ? (
          // 2. Auth Stack
          <>
            <Stack.Screen name="Login"    component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // 3. Protected Stack
          <>
            {user.role === 'Driver' ? (
              // Driver Screens
              <>
                <Stack.Screen name="DriverHome"        component={DriverHome} />
                <Stack.Screen name="DriverQueue"       component={DriverQueueScreen} />
                <Stack.Screen name="DriverRideActive"  component={DriverRideActive} />
                <Stack.Screen name="DriverRideHistory" component={DriverRideHistory} />
              </>
            ) : (
              // Passenger Screens
              <>
                <Stack.Screen name="PassengerHome"        component={PassengerHome} />
                <Stack.Screen name="Booking"              component={BookingScreen} />
                <Stack.Screen name="PassengerRideStatus"  component={PassengerRideStatus} />
                <Stack.Screen name="PassengerRideHistory" component={PassengerRideHistory} />
              </>
            )}
            {/* Common Protected Screens */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;