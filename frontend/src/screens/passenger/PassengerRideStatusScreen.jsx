import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMyBookingsApi, cancelBookingApi } from '../../api/passenger.api';
import Card   from './../../component/Card';
import Button from './../../component/Button';

const STATUS_STEPS = ['Pending', 'Accepted', 'Completed'];

// backgroundColor is dynamic (prop-based) — must stay inline
const StepConnector = ({ done }) => (
  <View
    className="flex-1 h-px mb-5"
    style={{ backgroundColor: done ? '#000' : '#E5E7EB' }}
  />
);

// backgroundColor + color + fontWeight are all dynamic — must stay inline
const StatusStep = ({ label, active, done }) => (
  <View className="items-center flex-1">
    <View
      className="w-8 h-8 rounded-2xl items-center justify-center mb-1"
      style={{ backgroundColor: done || active ? '#000' : '#E5E7EB' }}
    >
      {done
        ? <Text className="text-white text-[11px] font-bold">✓</Text>
        : active
        ? <ActivityIndicator color="#fff" size="small" />
        : <View className="w-2 h-2 bg-gray-300 rounded-full" />
      }
    </View>
    <Text
      className="text-[10px] text-center"
      style={{
        color:      active || done ? '#000' : '#9CA3AF',
        fontWeight: active || done ? '600' : '400',
      }}
    >
      {label}
    </Text>
  </View>
);

const PassengerRideStatus = ({ route, navigation }) => {
  const initialBooking = route.params?.booking;
  const [booking,   setBooking]   = useState(initialBooking);
  const [canceling, setCanceling] = useState(false);

  // Map backend status values to frontend display values
  const mapStatus = (backendStatus) => {
    const statusMap = {
      'pending': 'Pending',
      'assigned': 'Pending',
      'confirmed': 'Accepted',
      'completed': 'Completed',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled',
    };
    return statusMap[backendStatus?.toLowerCase()] || backendStatus || 'Pending';
  };

  const fetchBooking = useCallback(async () => {
    if (!booking?._id) return;
    try {
      const res  = await getMyBookingsApi();
      const raw  = res?.data ?? res?.bookings ?? res ?? [];
      const list = Array.isArray(raw) ? raw : [];
      const updated = list.find(b => b._id === booking._id);
      if (updated) {
        setBooking(updated);
        if (updated.status === 'completed') {
          setTimeout(() => navigation.replace('PassengerHome'), 2500);
        }
      }
    } catch (err) {
      console.log('fetchBooking error:', err?.response?.data ?? err?.message);
    }
  }, [booking?._id]);

  useEffect(() => {
    const interval = setInterval(fetchBooking, 5000);
    return () => clearInterval(interval);
  }, [fetchBooking]);

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Booking', style: 'destructive',
        onPress: async () => {
          setCanceling(true);
          try {
            await cancelBookingApi(booking._id);
            navigation.replace('PassengerHome');
          } catch (err) {
            Alert.alert('Error', err?.response?.data?.message || 'Could not cancel booking');
          } finally { setCanceling(false); }
        },
      },
    ]);
  };

  const currentIndex = STATUS_STEPS.indexOf(mapStatus(booking?.status));
  const driver       = booking?.driverRef;
  const isCancelled  = booking?.status === 'cancelled';
  const isCompleted  = booking?.status === 'completed';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-5 pt-6 pb-8">

        <Text className="text-[22px] font-bold text-black mb-6">Booking Status</Text>

        {/* ── Progress Steps ──────────────────────────────────────────────── */}
        <View className="mb-4">
          <Card>
            <View className="flex-row items-center">
              {STATUS_STEPS.map((step, i) => (
                <React.Fragment key={step}>
                  <StatusStep label={step} active={i === currentIndex} done={i < currentIndex} />
                  {i < STATUS_STEPS.length - 1 && <StepConnector done={i < currentIndex} />}
                </React.Fragment>
              ))}
            </View>
          </Card>
        </View>

        {/* ── Fare + Distance Card ────────────────────────────────────────── */}
        {(booking?.estimatedFare || booking?.fare || booking?.distanceKm) && (
          <View className="mb-4">
            <Card>
              <View className="flex-row justify-between items-center">
                <View>
                  <Text
                    className="text-[11px] font-semibold text-gray-400 uppercase"
                    style={{ letterSpacing: 1 }}
                  >
                    {booking?.fare ? 'Final Fare' : 'Estimated Fare'}
                  </Text>
                  {booking?.distanceKm && (
                    <Text className="text-gray-400 text-xs mt-1">{booking.distanceKm} km</Text>
                  )}
                </View>
                <Text className="text-[28px] font-bold text-black">
                  ₹{booking?.fare ?? booking?.estimatedFare}
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* ── Driver Info (visible once Accepted) ────────────────────────── */}
        {driver && (
          <View className="mb-4">
            <Card>
              <Text
                className="text-[11px] font-semibold text-gray-400 uppercase mb-3"
                style={{ letterSpacing: 1 }}
              >
                Your Driver
              </Text>
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-gray-100 rounded-[14px] items-center justify-center mr-3">
                  <Text style={{ fontSize: 22 }}>🧑‍✈️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-black font-semibold text-base">
                    {driver.fullname || 'Driver'}
                  </Text>
                  {driver.vehicleNumber && (
                    <View className="bg-gray-100 rounded-lg px-2 py-[2px] self-start mt-1">
                      <Text className="text-gray-700 text-xs font-semibold">
                        {driver.vehicleNumber}
                      </Text>
                    </View>
                  )}
                  {driver.vehicleName && (
                    <Text className="text-gray-400 text-xs mt-1">{driver.vehicleName}</Text>
                  )}
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* ── Route ──────────────────────────────────────────────────────── */}
        <View className="mb-4">
          <Card>
            <Text
              className="text-[11px] font-semibold text-gray-400 uppercase mb-3"
              style={{ letterSpacing: 1 }}
            >
              Route
            </Text>

            {/* Pickup */}
            <View className="flex-row items-start mb-3">
              <View className="w-3 h-3 bg-black rounded-full mt-[3px] mr-3" />
              <View className="flex-1">
                <Text className="text-xs text-gray-400 mb-[2px]">Pickup</Text>
                <Text className="text-black font-medium">{booking?.pickupLocation}</Text>
              </View>
            </View>

            {/* Connector line */}
            <View className="w-px h-4 bg-gray-200 ml-[5px] mb-1" />

            {/* Drop */}
            <View className="flex-row items-start">
              {/* borderWidth + borderColor must stay inline — static Tailwind border-black
                  works but border-2 border-black on a rounded View needs inline for RN */}
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

        {/* ── Booking Metadata ────────────────────────────────────────────── */}
        <View className="mb-6">
          <Card>
            <View className="flex-row justify-between py-[6px]">
              <Text className="text-gray-400 text-[13px]">Booking ID</Text>
              <Text className="text-black font-semibold text-[13px]">
                {booking?._id?.slice(-8).toUpperCase()}
              </Text>
            </View>
            <View className="h-px bg-gray-100 my-1" />
            <View className="flex-row justify-between py-[6px]">
              <Text className="text-gray-400 text-[13px]">Status</Text>
              <Text className="text-black font-semibold text-[13px]">{booking?.status}</Text>
            </View>
          </Card>
        </View>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        {!isCompleted && !isCancelled && booking?.status === 'Pending' && (
          <Button
            title="Cancel Booking"
            onPress={handleCancel}
            loading={canceling}
            variant="outline"
          />
        )}

        {isCompleted && (
          <View className="items-center py-4">
            <Text className="text-[36px] mb-2">🎉</Text>
            <Text className="text-black font-bold text-lg">Trip Completed!</Text>
            <Text className="text-gray-400 text-sm">Thank you for riding with us</Text>
          </View>
        )}

        {isCancelled && (
          <View className="items-center py-4">
            <Text className="text-[36px] mb-2">❌</Text>
            <Text className="text-red-700 font-bold text-lg">Booking Cancelled</Text>
            <Text className="text-gray-400 text-sm">Your booking has been cancelled</Text>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
};

export default PassengerRideStatus;