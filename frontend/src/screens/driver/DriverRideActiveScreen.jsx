import React, { useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { completeTripApi } from '../../api/booking.api';
import Card   from '../../component/Card';
import Button from '../../component/Button';

const DriverRideActive = ({ route, navigation }) => {
  // Safe access to route params to avoid crashes when params are missing
  const booking = route?.params?.booking;
  // Debug: log incoming route params
  // eslint-disable-next-line no-console
  console.log('DriverRideActive route.params ->', route?.params);
  const [loading, setLoading] = useState(false);

  const passenger = booking?.passengerRef || booking?.passenger;
  const bookingId = booking?._id;

  const handleCompleteTrip = () => {
    Alert.alert('Complete Trip', 'Mark this trip as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          setLoading(true);
          try {
            await completeTripApi(bookingId);
            navigation.replace('DriverHome');
          } catch (err) {
            Alert.alert('Error', err?.response?.data?.message || 'Could not complete trip');
          } finally { setLoading(false); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 }}>

        {/* Debug: show booking JSON when something looks wrong */}
        {!booking && (
          <Card>
            <Text className="text-red-500 font-semibold">Booking data not available</Text>
          </Card>
        )}

        <Text className="text-[22px] font-bold text-black mb-6">Active Ride</Text>

        {/* Status badge */}
        <View className="bg-green-100 rounded-2xl px-4 py-2 self-start mb-6">
          <Text className="text-green-700 font-semibold text-[13px]">Ride in Progress</Text>
        </View>

        {/* Passenger Info */}
        <View className="mb-4">
          <Card>
            <Text
              className="text-[11px] font-semibold text-gray-400 uppercase mb-3"
              style={{ letterSpacing: 1 }}
            >
              Passenger
            </Text>
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-gray-100 rounded-[14px] items-center justify-center mr-3">
                <Text className="text-[22px]">👤</Text>
              </View>
              <View>
                <Text className="text-black font-semibold text-[17px]">
                  {passenger?.fullname || 'Passenger'}
                </Text>
                <Text className="text-gray-400 text-sm">{passenger?.phone || ''}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Route */}
        <View className="mb-4">
          <Card>
            <Text
              className="text-[11px] font-semibold text-gray-400 uppercase mb-3"
              style={{ letterSpacing: 1 }}
            >
              Route
            </Text>
            <View className="flex-row items-start mb-3">
              <View className="w-3 h-3 bg-black rounded-full mt-[3px] mr-3" />
              <View className="flex-1">
                <Text className="text-xs text-gray-400 mb-[2px]">Pickup</Text>
                <Text className="text-black font-medium">{booking?.pickupLocation}</Text>
              </View>
            </View>
            <View className="w-px h-5 bg-gray-300 ml-[5px] mb-1" />
            <View className="flex-row items-start">
              <View
                className="w-3 h-3 rounded-full mt-[3px] mr-3"
                style={{ borderWidth: 2, borderColor: '#000' }}
              />
              <View className="flex-1">
                <Text className="text-xs text-gray-400 mb-[2px]">Drop</Text>
                <Text className="text-black font-medium">{booking?.dropoffLocation}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Fare & booking info */}
        <View className="mb-8">
          <Card>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-500">Fare</Text>
              <Text className="text-[26px] font-bold text-black">
                {booking?.fare
                  ? `₹${booking.fare}`
                  : booking?.estimatedFare
                  ? `₹${booking.estimatedFare}`
                  : 'As metered'}
              </Text>
            </View>

            {booking?.distanceKm && (
              <>
                <View className="h-px bg-gray-100 my-[10px]" />
                <View className="flex-row justify-between">
                  <Text className="text-gray-400 text-[13px]">Distance</Text>
                  <Text className="text-black font-medium text-[13px]">{booking.distanceKm} km</Text>
                </View>
              </>
            )}

            {booking?.status && (
              <>
                <View className="h-px bg-gray-100 my-[10px]" />
                <View className="flex-row justify-between">
                  <View className="flex-1">
                    <Text className="text-gray-400 text-[11px] mb-[2px]">Booking ID</Text>
                    <Text className="text-black font-semibold text-[13px]" numberOfLines={1}>
                      {booking._id?.slice(-8).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1 items-end">
                    <Text className="text-gray-400 text-[11px] mb-[2px]">Status</Text>
                    <Text className="text-black font-semibold text-[13px]">{booking.status}</Text>
                  </View>
                </View>
              </>
            )}
          </Card>
        </View>

        {/* Complete Trip button - show when booking status is confirmed or when booking exists (fallback) */}
        {(booking?.status === 'confirmed' || (booking && !booking.status)) && (
          <Button
            title="Complete Trip"
            onPress={handleCompleteTrip}
            loading={loading}
            variant="danger"
          />
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

export default DriverRideActive;