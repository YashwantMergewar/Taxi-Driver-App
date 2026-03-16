import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getMyPassengerProfileApi, getMyBookingsApi } from '../../api/passenger.api';
import Card   from './../../component/Card';
import Button from './../../component/Button';

// Safely extract array from ANY API response shape
const extractArray = (res) => {
  const candidate = res?.data ?? res?.bookings ?? res?.booking ?? res ?? [];
  return Array.isArray(candidate) ? candidate : [];
};

// Dynamic status badge/text classes — must be full strings for NativeWind static extraction
const STATUS_BADGE = {
  Pending:   'bg-yellow-100',
  Accepted:  'bg-blue-100',
  Completed: 'bg-green-100',
  Cancelled: 'bg-red-100',
};
const STATUS_TEXT = {
  Pending:   'text-yellow-900',
  Accepted:  'text-blue-700',
  Completed: 'text-green-700',
  Cancelled: 'text-red-700',
};

const BookingCard = ({ item, onPress }) => {
  const badge = STATUS_BADGE[item.status] || STATUS_BADGE.Pending;
  const text  = STATUS_TEXT[item.status]  || STATUS_TEXT.Pending;

  return (
    <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.8} className="mb-3">
      <Card>
        {/* Status + Fare row */}
        <View className="flex-row justify-between items-start mb-[10px]">
          <View className={`${badge} rounded-lg px-[10px] py-1`}>
            <Text className={`${text} text-xs font-semibold`}>{item.status}</Text>
          </View>
          {item.fare
            ? <Text className="text-lg font-bold text-black">₹{item.fare}</Text>
            : null}
        </View>

        {/* Pickup row */}
        <View className="flex-row items-start mb-2">
          <View className="w-[10px] h-[10px] bg-black rounded-full mt-[3px] mr-[10px]" />
          <View className="flex-1">
            <Text className="text-[11px] text-gray-400">Pickup</Text>
            <Text className="text-black font-medium text-[13px]" numberOfLines={1}>
              {item.pickupLocation}
            </Text>
          </View>
        </View>

        {/* Route connector */}
        <View className="w-px h-3 bg-gray-200 ml-1 mb-1" />

        {/* Drop row */}
        <View className="flex-row items-start">
          {/* borderWidth/borderColor must stay inline — dynamic values */}
          <View
            className="w-[10px] h-[10px] rounded-full mt-[3px] mr-[10px]"
            style={{ borderWidth: 2, borderColor: '#000' }}
          />
          <View className="flex-1">
            <Text className="text-[11px] text-gray-400">Drop</Text>
            <Text className="text-black font-medium text-[13px]" numberOfLines={1}>
              {item.dropoffLocation}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const PassengerHome = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [profile,    setProfile]    = useState(null);
  const [bookings,   setBookings]   = useState([]); // always []
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, bookingsRes] = await Promise.all([
        getMyPassengerProfileApi(),
        getMyBookingsApi(),
      ]);
      setProfile(profileRes?.data ?? profileRes ?? null);
      setBookings(extractArray(bookingsRes));
    } catch (err) {
      console.log('PassengerHome fetch error:', err?.response?.data ?? err?.message);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const activeBooking = bookings.find(b => b.status === 'Pending' || b.status === 'Accepted');
  const initials      = (profile?.fullname || user?.name || 'P').charAt(0).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/*
        contentContainerStyle must stay as prop — ScrollView doesn't support className
        for contentContainer. paddingHorizontal/paddingTop/paddingBottom work correctly here.
      */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-gray-500 text-sm">Hello,</Text>
            <Text className="text-[22px] font-bold text-black">
              {profile?.fullname || user?.name || 'Passenger'}
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-black items-center justify-center"
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-base">{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Active Booking Banner ───────────────────────────────────────── */}
        {activeBooking && (
          <View className="mb-6">
            <Text
              className="text-[11px] font-semibold text-gray-400 uppercase mb-3"
              style={{ letterSpacing: 1 }}
            >
              Active Booking
            </Text>
            <BookingCard
              item={activeBooking}
              onPress={(b) => navigation.navigate('PassengerRideStatus', { booking: b })}
            />
          </View>
        )}

        {/* ── Book CTA (no active booking) ───────────────────────────────── */}
        {!activeBooking && (
          <View className="flex-1 justify-center items-center pb-[60px]">
            <View className="w-24 h-24 bg-gray-100 rounded-3xl items-center justify-center mb-6">
              <Text className="text-5xl">🚕</Text>
            </View>
            <Text className="text-2xl font-bold text-black mb-2 text-center">Where to?</Text>
            <Text className="text-gray-400 text-base mb-10 text-center">Book a ride in minutes</Text>
            {/* w-full wrapper replaces style={{ width: '100%' }} on Button */}
            <View className="w-full">
              <Button title="Book a Ride" onPress={() => navigation.navigate('Booking')} />
            </View>
          </View>
        )}

        {/* ── Recent Bookings List ────────────────────────────────────────── */}
        {bookings.length > 0 && (
          <View className="mb-6">
            <Text
              className="text-[11px] font-semibold text-gray-400 uppercase mb-3"
              style={{ letterSpacing: 1 }}
            >
              Recent Bookings
            </Text>
            {bookings.slice(0, 3).map(item => (
              <BookingCard
                key={item._id}
                item={item}
                onPress={(b) => navigation.navigate('PassengerRideStatus', { booking: b })}
              />
            ))}
          </View>
        )}

        {/* ── Bottom Action Buttons ───────────────────────────────────────── */}
        {/* flex wrapper replaces style={{ flex: 1, marginRight: 10 }} on Button */}
        <View className="flex-row mb-3">
          <View className="flex-1 mr-[10px]">
            <Button
              title="Book Ride"
              onPress={() => navigation.navigate('Booking')}
              variant="primary"
            />
          </View>
          <View className="flex-1">
            <Button
              title="History"
              onPress={() => navigation.navigate('PassengerRideHistory')}
              variant="outline"
            />
          </View>
        </View>

        <Button title="Sign Out" onPress={logout} variant="ghost" />

      </ScrollView>
    </SafeAreaView>
  );
};

export default PassengerHome;