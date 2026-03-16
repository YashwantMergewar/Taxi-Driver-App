import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from './../../component/Card';
import { getPassengerRideHistoryApi } from '../../api/rideHistory.api';

const RideCard = ({ item }) => {
  // rideHistory doc — with populated passengerRef and direct properties
  const driver    = item.driverRef;  // Note: driverRef is usually not populated from backend
  const fare      = item.fareAmount ?? 0;
  const createdAt = item.createdAt;

  return (
    <Card style={{ marginBottom: 12 }}>
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <Text className="text-xs text-gray-400 mb-[2px]">
            {createdAt
              ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </Text>
          <Text className="text-black font-semibold">{typeof driver === 'object' ? driver?.fullname : 'Driver'}</Text>
        </View>
        <View className="items-end">
          {fare > 0 && <Text className="text-xl font-bold text-black">₹{fare}</Text>}
          <View className="bg-green-100 rounded-[20px] px-2 py-[2px] mt-1">
            <Text className="text-green-700 text-[11px] font-semibold">Completed</Text>
          </View>
        </View>
      </View>
      <View className="border-t border-gray-100 pt-3">
        <View className="flex-row items-center mb-[6px]">
          <View className="w-2 h-2 bg-black rounded-full mr-2" />
          <Text className="text-gray-500 text-[13px] flex-1" numberOfLines={1}>{item?.pickupLocation || '—'}</Text>
        </View>
        <View className="flex-row items-center mb-[6px]">
          <View className="w-2 h-2 rounded-full mr-2" style={{ borderWidth: 1.5, borderColor: '#000' }} />
          <Text className="text-gray-500 text-[13px] flex-1" numberOfLines={1}>{item?.dropoffLocation || '—'}</Text>
        </View>
      </View>
    </Card>
  );
};

const PassengerRideHistory = () => {
  const [history,    setHistory]    = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      // GET /api/v1/ride-history/passenger
      const res = await getPassengerRideHistoryApi();
      const raw = res?.data?.rides ?? [];
      setHistory(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.log('History error:', err?.response?.data);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-6 pb-2">
        <Text className="text-[22px] font-bold text-black mb-1">Ride History</Text>
        <Text className="text-sm text-gray-400">{history.length} rides completed</Text>
      </View>
      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <RideCard item={item} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-[40px] mb-4">🚗</Text>
            <Text className="text-black font-semibold text-lg mb-1">No rides yet</Text>
            <Text className="text-gray-400 text-sm">Your completed rides will appear here</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default PassengerRideHistory;