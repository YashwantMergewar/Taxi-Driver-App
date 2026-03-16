import React, { useState, useEffect, useCallback } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View, Text, Switch, ScrollView,
  RefreshControl, Alert, TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import {
  getMyDriverProfileApi,
  updateDriverStatusApi,
  joinQueueApi,
  leaveQueueApi,
} from '../../api/driver.api';
import {
  acceptBookingApi,
  rejectBookingApi,
  completeTripApi,
} from '../../api/booking.api';
import { getDriverRideHistoryApi } from '../../api/rideHistory.api';
import Card   from '../../component/Card';
import Button from '../../component/Button';

// Safely unwrap profile from any response shape
const extractProfile = (res) => {
  const candidate = res?.data ?? res?.driver ?? res ?? null;
  return candidate && typeof candidate === 'object' && !Array.isArray(candidate)
    ? candidate
    : null;
};

// ── Booking Card (used in Queue view) ──────────────────────────────────────
const BookingCard = ({ item, onAccept, onReject, accepting, rejecting }) => {
  const passenger = item.passengerRef || item.passenger;
  return (
    <View className="mb-3">
      <Card>
        <View className="flex-row justify-between items-start mb-3">
          <View className="bg-yellow-100 rounded-lg px-[10px] py-1">
            <Text className="text-xs font-semibold text-yellow-900">{item.status || 'Pending'}</Text>
          </View>
          {item.fare ? <Text className="text-[22px] font-bold text-black">₹{item.fare}</Text> : null}
        </View>

        {passenger?.fullname && (
          <View className="flex-row items-center mb-3 bg-gray-50 rounded-[10px] p-[10px]">
            <Text className="text-lg mr-2">👤</Text>
            <Text className="text-black font-semibold text-[13px]">{passenger.fullname}</Text>
          </View>
        )}

        <View className="mb-4">
          <View className="flex-row items-start mb-2">
            <View className="w-[10px] h-[10px] bg-black rounded-full mt-[3px] mr-[10px]" />
            <View className="flex-1">
              <Text className="text-[11px] text-gray-400">Pickup</Text>
              <Text className="text-black font-medium text-[13px]">{item.pickupLocation}</Text>
            </View>
          </View>
          <View className="w-px h-[14px] bg-gray-200 ml-1 mb-1" />
          <View className="flex-row items-start mb-2">
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

        {/* flex wrappers replace style={{ flex: 1, marginRight }} on Button */}
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

// ── History Card ───────────────────────────────────────────────────────────
const HistoryCard = ({ item }) => {
  const booking   = item.bookingRef || item;
  const passenger = item.passengerRef || booking?.passengerRef;
  const fare      = item.fareAmount || item.fare || booking?.fareAmount || booking?.fare || booking?.finalFare;
  const createdAt = item.createdAt || booking?.createdAt;

  return (
    <View className="mb-3">
      <Card>
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-xs text-gray-400 mb-[2px]">
              {createdAt
                ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            </Text>
            <Text className="text-black font-semibold">{passenger?.fullname || 'Passenger'}</Text>
          </View>
          <View className="items-end">
            {fare && <Text className="text-xl font-bold text-black">₹{fare}</Text>}
            <View className="bg-green-100 rounded-[20px] px-2 py-[2px] mt-1">
              <Text className="text-[11px] font-semibold text-green-700">Completed</Text>
            </View>
          </View>
        </View>
        <View className="border-t border-gray-100 pt-3">
          <View className="flex-row items-center mb-[6px]">
            <View className="w-2 h-2 bg-black rounded-full mr-2" />
            <Text className="text-gray-500 text-[13px] flex-1" numberOfLines={1}>
              {booking?.pickupLocation || '—'}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full mr-2" style={{ borderWidth: 1.5, borderColor: '#000' }} />
            <Text className="text-gray-500 text-[13px] flex-1" numberOfLines={1}>
              {booking?.dropoffLocation || '—'}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const DriverHome = ({ navigation }) => {
  const { user, logout } = useAuth();

  // currentView controls which panel is rendered inside the single SafeAreaView
  const [currentView,    setCurrentView]    = useState('home');
  const [profile,        setProfile]        = useState(null);
  const [inQueue,        setInQueue]        = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [refreshing,     setRefreshing]     = useState(false);
  const [togglingQueue,  setTogglingQueue]  = useState(false);
  const [accepting,      setAccepting]      = useState(null);
  const [rejecting,      setRejecting]      = useState(null);
  const [bookings,       setBookings]       = useState([]);
  const [history,        setHistory]        = useState([]);
  const [completing,     setCompleting]     = useState(false);

  // status values come from backend as lowercase: 'available' | 'on-trip' | 'offline'
  const isOnline = profile?.status === 'available' || profile?.status === 'on-trip';

  // ── Data Fetching ──────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const res = await getMyDriverProfileApi();
      const p   = extractProfile(res);
      setProfile(p);
      // backend stores queue position as numeric — driver is in queue if > 0
      setInQueue((p?.queuePosition ?? 0) > 0);
      // currentBooking: populated booking object assigned to this driver
      const cb = p?.currentBooking ?? null;
      setCurrentBooking(cb && typeof cb === 'object' ? cb : null);
      // pendingBookings: list shown in Queue view
      const raw = p?.pendingBookings ?? p?.bookings ?? [];
      setBookings(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.log('DriverHome fetchProfile error:', err?.response?.data ?? err?.message);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await getDriverRideHistoryApi();
      const raw = res?.data?.rides ?? res?.rides ?? res ?? [];
      setHistory(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.log('History error:', err?.response?.data ?? err?.message);
    }
  }, []);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    fetchProfile();
    fetchHistory();
    const interval = setInterval(fetchProfile, 10000);
    return () => clearInterval(interval);
  }, [isFocused, fetchProfile, fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchHistory()]);
    setRefreshing(false);
  };

  // ── Status & Queue ─────────────────────────────────────────────────────
  const handleToggleStatus = async (value) => {
    try {
      await updateDriverStatusApi(value ? 'available' : 'offline');
      await fetchProfile();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not update status');
    }
  };

  const handleToggleQueue = async () => {
    setTogglingQueue(true);
    try {
      inQueue ? await leaveQueueApi() : await joinQueueApi();
      await fetchProfile();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not update queue');
    } finally { setTogglingQueue(false); }
  };

  // ── Accept / Reject from Home (incoming booking notification) ──────────
  const handleAcceptFromHome = async () => {
    if (!currentBooking?._id) return;
    setAccepting(true);
    try {
      await acceptBookingApi(currentBooking._id);
      await fetchProfile();
      setCurrentView('active');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to accept booking');
    } finally { setAccepting(false); }
  };

  const handleRejectFromHome = async () => {
    if (!currentBooking?._id) return;
    setRejecting(true);
    try {
      await rejectBookingApi(currentBooking._id);
      setCurrentBooking(null);
      await fetchProfile();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to reject booking');
    } finally { setRejecting(false); }
  };

  // ── Accept / Reject from Queue view ───────────────────────────────────
  const handleAcceptFromQueue = async (bookingId, bookingObj) => {
    setAccepting(bookingId);
    try {
      const res     = await acceptBookingApi(bookingId);
      const updated = res?.data ?? res?.booking ?? bookingObj;
      setCurrentBooking(updated);
      await fetchProfile();
      setCurrentView('active');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not accept booking');
    } finally { setAccepting(null); }
  };

  const handleRejectFromQueue = async (bookingId) => {
    setRejecting(bookingId);
    try {
      await rejectBookingApi(bookingId);
      setBookings(prev => prev.filter(b => b._id !== bookingId));
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not reject booking');
    } finally { setRejecting(null); }
  };

  // ── Complete Trip ──────────────────────────────────────────────────────
  const handleCompleteTrip = () => {
    if (!currentBooking?._id) return;
    Alert.alert('Complete Trip', 'Mark this trip as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          setCompleting(true);
          try {
            await completeTripApi(currentBooking._id);
            setCurrentView('home');
            setCurrentBooking(null);
            await fetchProfile();
            await fetchHistory();
          } catch (err) {
            Alert.alert('Error', err?.response?.data?.message || 'Could not complete trip');
          } finally { setCompleting(false); }
        },
      },
    ]);
  };

  const initials = (profile?.fullname || user?.name || 'D').charAt(0).toUpperCase();
  const totalEarned = history.reduce(
    (sum, item) => sum + Number(item.fare || item.bookingRef?.fare || 0), 0
  );

  // ══════════════════════════════════════════════════════════════════════════
  // HOME VIEW
  // ══════════════════════════════════════════════════════════════════════════
  const renderHome = () => (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-8">
        <View>
          <Text className="text-gray-500 text-sm">Good day,</Text>
          <Text className="text-[22px] font-bold text-black">
            {profile?.fullname || user?.name || 'Driver'}
          </Text>
        </View>
        <View className="flex-row items-center">
          <View className="items-end mr-3">
            <Text className="text-xs text-gray-400 mb-1">{isOnline ? 'Online' : 'Offline'}</Text>
            <Switch
              value={!!isOnline}
              onValueChange={handleToggleStatus}
              trackColor={{ false: '#E5E7EB', true: '#000' }}
              thumbColor="#fff"
            />
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-black items-center justify-center"
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-base">{initials}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Vehicle info card */}
      {profile && (
        <View className="mb-6">
          <Text className="text-[11px] font-semibold text-gray-400 uppercase mb-3" style={{ letterSpacing: 1 }}>
            My Vehicle
          </Text>
          <Card>
            <View className="flex-row items-center">
              <View
                className="w-[10px] h-[10px] rounded-full mr-3"
                style={{
                  backgroundColor:
                    profile.status === 'available' ? '#22C55E'
                    : profile.status === 'on-trip'  ? '#F59E0B'
                    : '#D1D5DB',
                }}
              />
              <Text className="text-black font-medium flex-1">
                {profile.status === 'available' ? 'Available'
                  : profile.status === 'on-trip' ? 'On Trip'
                  : 'Offline'}
              </Text>
              <View
                className="rounded-lg px-[10px] py-1"
                style={{ backgroundColor: inQueue ? '#F0FDF4' : '#F3F4F6' }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: inQueue ? '#15803D' : '#6B7280' }}
                >
                  {inQueue ? 'In Queue' : 'Not in Queue'}
                </Text>
              </View>
            </View>
            <View className="h-px bg-gray-100 my-[10px]" />
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-gray-400 text-[11px] mb-[2px]">Vehicle</Text>
                <Text className="text-black font-semibold text-sm">{profile.vehicleName || '—'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 text-[11px] mb-[2px]">Plate</Text>
                <Text className="text-black font-semibold text-sm">{profile.vehicleNumber || '—'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 text-[11px] mb-[2px]">Experience</Text>
                <Text className="text-black font-semibold text-sm">
                  {profile.yearOfExperience ? `${profile.yearOfExperience} yrs` : '—'}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* Queue toggle */}
      {isOnline && (
        <View className="mb-6">
          <Text className="text-[11px] font-semibold text-gray-400 uppercase mb-3" style={{ letterSpacing: 1 }}>
            Queue
          </Text>
          <Button
            title={inQueue ? 'Leave Queue' : 'Join Queue'}
            onPress={handleToggleQueue}
            loading={togglingQueue}
            variant={inQueue ? 'outline' : 'primary'}
          />
        </View>
      )}

      {/* Incoming booking from backend (assigned directly to driver) */}
      {currentBooking && (
        <View className="mb-6">
          <Text className="text-[11px] font-semibold text-gray-400 uppercase mb-3" style={{ letterSpacing: 1 }}>
            Incoming Booking
          </Text>
          <Card>
            <View className="mb-4">
              <View className="flex-row items-start mb-3">
                <View className="w-3 h-3 bg-black rounded-full mt-1 mr-3" />
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 mb-[2px]">Pickup</Text>
                  <Text className="text-black font-medium">{currentBooking.pickupLocation}</Text>
                </View>
              </View>
              <View className="w-px h-4 bg-gray-200 ml-[5px] mb-1" />
              <View className="flex-row items-start mb-3">
                <View
                  className="w-3 h-3 rounded-full mt-1 mr-3"
                  style={{ borderWidth: 2, borderColor: '#000' }}
                />
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 mb-[2px]">Drop</Text>
                  <Text className="text-black font-medium">{currentBooking.dropoffLocation}</Text>
                </View>
              </View>
            </View>

            {currentBooking.fare && (
              <View className="flex-row justify-between items-center bg-gray-50 rounded-xl p-3 mb-4">
                <Text className="text-gray-500 text-sm">Estimated Fare</Text>
                <Text className="text-black font-bold text-xl">₹{currentBooking.fare}</Text>
              </View>
            )}

            {currentBooking.estimatedFare && !currentBooking.fare && (
              <View className="flex-row justify-between items-center bg-gray-50 rounded-xl p-3 mb-4">
                <Text className="text-gray-500 text-sm">Estimated Fare</Text>
                <Text className="text-black font-bold text-xl">₹{currentBooking.estimatedFare}</Text>
              </View>
            )}

            <View className="flex-row">
              <View className="flex-1 mr-3">
                <Button title="Reject" onPress={handleRejectFromHome} loading={!!rejecting} variant="ghost" />
              </View>
              <View className="flex-1">
                <Button title="Accept" onPress={handleAcceptFromHome} loading={!!accepting} />
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* Bottom nav buttons */}
      <View className="flex-row mb-3">
        <View className="flex-1 mr-3">
          <Button title="Queue" onPress={() => setCurrentView('queue')} variant="outline" />
        </View>
        <View className="flex-1">
          <Button title="History" onPress={() => setCurrentView('history')} variant="outline" />
        </View>
      </View>
      <View className="mb-2">
        <Button title="Profile" onPress={() => navigation.navigate('Profile')} variant="outline" />
      </View>
      <Button title="Sign Out" onPress={logout} variant="ghost" />
    </ScrollView>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // QUEUE VIEW — shows pending bookings waiting for a driver to accept
  // ══════════════════════════════════════════════════════════════════════════
  const renderQueue = () => (
    <View className="flex-1 bg-gray-50">
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
          {inQueue ? '✓ You are in the queue' : '⚠ Not in queue — join to receive bookings'}
        </Text>
        <Button
          title={inQueue ? 'Leave' : 'Join Queue'}
          onPress={handleToggleQueue}
          loading={togglingQueue}
          variant={inQueue ? 'outline' : 'primary'}
        />
      </View>

      {/* Pending bookings list */}
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <BookingCard
            item={item}
            onAccept={handleAcceptFromQueue}
            onReject={handleRejectFromQueue}
            accepting={accepting}
            rejecting={rejecting}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        scrollEnabled
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-[40px] mb-4">🚦</Text>
            <Text className="text-black font-semibold text-lg mb-1">No pending bookings</Text>
            <Text className="text-gray-400 text-sm text-center">
              {inQueue ? 'Waiting for passenger bookings...' : 'Join the queue to see bookings'}
            </Text>
          </View>
        }
      />

      <View className="px-5 pb-6">
        <Button title="← Back to Home" onPress={() => setCurrentView('home')} variant="outline" />
      </View>
    </View>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIVE RIDE VIEW — shown after driver accepts a booking
  // ══════════════════════════════════════════════════════════════════════════
  const renderActive = () => (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 }}
      className="flex-1 bg-gray-50"
    >
      <Text className="text-[22px] font-bold text-black mb-6">Active Ride</Text>

      {/* Status badge */}
      <View className="bg-green-100 rounded-2xl px-4 py-2 self-start mb-6">
        <Text className="text-green-700 font-semibold text-[13px]">Ride in Progress</Text>
      </View>

      {currentBooking && (
        <>
          {/* Passenger info */}
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
                    {currentBooking.passengerRef?.fullname
                      || currentBooking.passenger?.fullname
                      || 'Passenger'}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    {currentBooking.passengerRef?.phone
                      || currentBooking.passenger?.phone
                      || ''}
                  </Text>
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
                  <Text className="text-black font-medium">{currentBooking.pickupLocation}</Text>
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
                  <Text className="text-black font-medium">{currentBooking.dropoffLocation}</Text>
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
                  {currentBooking.fare
                    ? `₹${currentBooking.fare}`
                    : currentBooking.estimatedFare
                    ? `₹${currentBooking.estimatedFare}`
                    : 'As metered'}
                </Text>
              </View>
              {currentBooking.distanceKm && (
                <>
                  <View className="h-px bg-gray-100 my-[10px]" />
                  <View className="flex-row justify-between">
                    <Text className="text-gray-400 text-[13px]">Distance</Text>
                    <Text className="text-black font-medium text-[13px]">{currentBooking.distanceKm} km</Text>
                  </View>
                </>
              )}
              {currentBooking.status && (
                <>
                  <View className="h-px bg-gray-100 my-[10px]" />
                  <View className="flex-row justify-between">
                    <View className="flex-1">
                      <Text className="text-gray-400 text-[11px] mb-[2px]">Booking ID</Text>
                      <Text className="text-black font-semibold text-[13px]" numberOfLines={1}>
                        {currentBooking._id?.slice(-8).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1 items-end">
                      <Text className="text-gray-400 text-[11px] mb-[2px]">Status</Text>
                      <Text className="text-black font-semibold text-[13px]">{currentBooking.status}</Text>
                    </View>
                  </View>
                </>
              )}
            </Card>
          </View>

          {/* Complete trip - only show if booking is confirmed */}
          {currentBooking.status === 'confirmed' && (
            <View className="mb-3">
              <Button
                title="Complete Trip"
                onPress={handleCompleteTrip}
                loading={completing}
                variant="danger"
              />
            </View>
          )}
          <Button title="← Back to Home" onPress={() => setCurrentView('home')} variant="outline" />
        </>
      )}
    </ScrollView>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // HISTORY VIEW
  // ══════════════════════════════════════════════════════════════════════════
  const renderHistory = () => (
    <View className="flex-1 bg-gray-50">
      <View className="px-5 pt-6 pb-2">
        <Text className="text-[22px] font-bold text-black mb-4">Ride History</Text>
        <View className="mb-4">
          <Card>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-xs text-gray-400 mb-1">Total Rides</Text>
                <Text className="text-2xl font-bold text-black">{history.length}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-gray-400 mb-1">Total Earned</Text>
                <Text className="text-2xl font-bold text-black">₹{totalEarned}</Text>
              </View>
            </View>
          </Card>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <HistoryCard item={item} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-[40px] mb-4">📋</Text>
            <Text className="text-black font-semibold text-lg mb-1">No rides yet</Text>
            <Text className="text-gray-400 text-sm">Completed rides will appear here</Text>
          </View>
        }
      />

      <View className="px-5 pb-6">
        <Button title="← Back to Home" onPress={() => setCurrentView('home')} variant="outline" />
      </View>
    </View>
  );

  // ── Root render ────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {currentView === 'home'                     && renderHome()}
      {currentView === 'queue'                    && renderQueue()}
      {currentView === 'active' && currentBooking && renderActive()}
      {currentView === 'history'                  && renderHistory()}
    </SafeAreaView>
  );
};

export default DriverHome;