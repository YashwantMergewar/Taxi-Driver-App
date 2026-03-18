import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getMyDriverProfileApi,
  joinQueueApi,
  leaveQueueApi,
} from '../../api/driver.api';
import { acceptBookingApi, rejectBookingApi } from '../../api/booking.api';
import Card   from '../../component/Card';
import Button from '../../component/Button';

// ── Booking Card ──────────────────────────────────────────────────────────
const BookingCard = ({ item, onAccept, onReject, accepting, rejecting }) => {
  const passenger = item.passengerRef || item.passenger;
  console.log('BookingCard render:', { item, passenger });
  return (
    <View className="mb-3">
      <Card>
        {/* Status + fare */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="bg-yellow-100 rounded-lg px-[10px] py-1">
            <Text className="text-xs font-semibold text-yellow-900">
              {item.status || 'Pending'}
            </Text>
          </View>
          {item.fare ? <Text className="text-[22px] font-bold text-black">₹{item.fare}</Text> : null}
        </View>

        {/* Passenger name */}
        {passenger?.fullname && (
          <View className="flex-row items-center mb-3 bg-gray-50 rounded-[10px] p-[10px]">
            <Text className="text-lg mr-2">👤</Text>
            <Text className="text-black font-semibold text-[13px]">{passenger.fullname}</Text>
          </View>
        )}

        {/* Distance badge (if available from fare estimation) */}
        {item.distanceKm && (
          <View className="flex-row items-center mb-3">
            <View className="bg-gray-100 rounded-lg px-[10px] py-1">
              <Text className="text-xs font-semibold text-gray-600">📍 {item.distanceKm} km</Text>
            </View>
          </View>
        )}

        {/* Route */}
        <View className="mb-4">
          <View className="flex-row items-start mb-2">
            <View className="w-[10px] h-[10px] bg-black rounded-full mt-[3px] mr-[10px]" />
            <View className="flex-1">
              <Text className="text-[11px] text-gray-400">Pickup</Text>
              <Text className="text-black font-medium text-[13px]">{item.pickupLocation}</Text>
            </View>
          </View>
          <View className="w-px h-[14px] bg-gray-200 ml-1 mb-1" />
          <View className="flex-row items-start">
            <View
              className="w-[10px] h-[10px] rounded-full mt-[3px] mr-[10px]"
              style={{ borderWidth: 2, borderColor: '#000' }}
            />
            <View className="flex-1">
              <Text className="text-[11px] text-gray-400">Drop</Text>
              <Text className="text-black font-medium text-[13px]">{item.dropoffLocation}</Text>
            </View>
          </View>
        </View>

        {/* Action buttons — flex wrappers replace style={{ flex, marginRight }} */}
        <View className="flex-row">
          <View className="flex-1 mr-2">
            <Button
              title="Reject"
              onPress={() => onReject(item._id)}
              loading={rejecting === item._id}
              variant="ghost"
            />
          </View>
          <View className="flex-1">
            <Button
              title="Accept"
              onPress={() => onAccept(item._id, item)}
              loading={accepting === item._id}
            />
          </View>
        </View>
      </Card>
    </View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────
const DriverQueueScreen = ({ navigation }) => {
  const [bookings,      setBookings]      = useState([]);
  const [inQueue,       setInQueue]       = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [accepting,     setAccepting]     = useState(null);
  const [rejecting,     setRejecting]     = useState(null);
  const [togglingQueue, setTogglingQueue] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // GET /api/v1/driver/me — profile contains queue position + pending bookings
      const res = await getMyDriverProfileApi();
      const p   = res?.data ?? res?.driver ?? res ?? null;

      // Driver is in queue if queuePosition > 0
      setInQueue((p?.queuePosition ?? 0) > 0);

      // pendingBookings: bookings assigned/available for this driver to accept
      const raw = p?.pendingBookings ?? p?.bookings ?? [];
      setBookings(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.log('DriverQueue fetch error:', err?.response?.data ?? err?.message);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleToggleQueue = async () => {
    setTogglingQueue(true);
    try {
      inQueue ? await leaveQueueApi() : await joinQueueApi();
      await fetchData();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not update queue');
    } finally { setTogglingQueue(false); }
  };

  const handleAccept = async (bookingId, bookingObj) => {
    setAccepting(bookingId);
    try {
      const res = await acceptBookingApi(bookingId);
      // Debug: log API response shape
      // eslint-disable-next-line no-console
      console.log('acceptBookingApi response:', res);

      const updated = res?.data ?? res?.booking ?? res ?? bookingObj;
      // Debug: log resolved booking object before navigation
      // eslint-disable-next-line no-console
      console.log('Resolved booking for navigation:', updated);

      // Ensure booking has a status for the UI
      if (updated && !updated.status) updated.status = 'confirmed';

      // Navigate to active ride screen with accepted booking
      navigation.navigate('DriverRideActive', { booking: updated });
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not accept booking');
    } finally { setAccepting(null); }
  };

  const handleReject = async (bookingId) => {
    setRejecting(bookingId);
    try {
      await rejectBookingApi(bookingId);
      // Remove from local list immediately for instant UI feedback
      setBookings(prev => prev.filter(b => b._id !== bookingId));
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not reject booking');
    } finally { setRejecting(null); }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-5 pt-6 pb-2 flex-row items-center justify-between">
        <Text className="text-[22px] font-bold text-black">Ride Queue</Text>
        <View className="bg-black rounded-[20px] px-3 py-1">
          <Text className="text-white text-xs font-semibold">{bookings.length} pending</Text>
        </View>
      </View>

      {/* Queue status banner */}
      <View
        className="mx-5 mb-3 rounded-[14px] p-[14px] flex-row items-center justify-between"
        style={
          inQueue
            ? { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' }
            : { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' }
        }
      >
        <Text
          className="font-semibold text-sm flex-1 mr-3"
          style={{ color: inQueue ? '#15803D' : '#C2410C' }}
        >
          {inQueue ? '✓ You are in the queue' : '⚠ Join queue to receive bookings'}
        </Text>
        <Button
          title={inQueue ? 'Leave' : 'Join Queue'}
          onPress={handleToggleQueue}
          loading={togglingQueue}
          variant={inQueue ? 'outline' : 'primary'}
        />
      </View>

      {/* Bookings list */}
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <BookingCard
            item={item}
            onAccept={handleAccept}
            onReject={handleReject}
            accepting={accepting}
            rejecting={rejecting}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-[40px] mb-4">🚦</Text>
            <Text className="text-black font-semibold text-lg mb-1">No pending bookings</Text>
            <Text className="text-gray-400 text-sm text-center">
              {inQueue
                ? 'Waiting for passenger bookings...'
                : 'Join the queue to receive bookings'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default DriverQueueScreen;