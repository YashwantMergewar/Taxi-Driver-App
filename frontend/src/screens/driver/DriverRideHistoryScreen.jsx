import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../component/Card';
import { getDriverRideHistoryApi } from '../../api/rideHistory.api';

const HistoryCard = ({ item }) => {
  console.log('HistoryCard render:', { item });
  const passenger = item.passengerRef;
  const fare      = item.fareAmount ?? 0;
  const createdAt = item.createdAt;

  return (
    <View className="mb-3">
      <Card>
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-xs text-gray-400 mb-[2px]">
              {createdAt
                ? new Date(createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })
                : '—'}
            </Text>
            <Text className="text-black font-semibold">{passenger?.fullname || 'Passenger'}</Text>
          </View>
          <View className="items-end">
            {fare > 0 && <Text className="text-xl font-bold text-black">₹{fare}</Text>}
            <View className="bg-green-100 rounded-[20px] px-2 py-[2px] mt-1">
              <Text className="text-[11px] font-semibold text-green-700">Completed</Text>
            </View>
          </View>
        </View>

        <View className="border-t border-gray-100 pt-3">
          <View className="flex-row items-center mb-[6px]">
            <View className="w-2 h-2 bg-black rounded-full mr-2" />
            <Text className="text-gray-500 text-[13px] flex-1" numberOfLines={1}>
              {item?.pickupLocation || '—'}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View
              className="w-2 h-2 rounded-full mr-2"
              style={{ borderWidth: 1.5, borderColor: '#000' }}
            />
            <Text className="text-gray-500 text-[13px] flex-1" numberOfLines={1}>
              {item?.dropoffLocation || '—'}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

const DriverRideHistory = () => {
  const [history,    setHistory]    = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await getDriverRideHistoryApi();
      console.log(res);
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

  const totalFare = history.reduce((sum, item) => {
    return sum + Number(item.fareAmount || item.fare || 0);
  }, 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-6 pb-2">
        <Text className="text-[22px] font-bold text-black mb-4">Ride History</Text>

        {/* Summary card — wrapper View replaces Card style={{ marginBottom: 16 }} */}
        <View className="mb-4">
          <Card>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-xs text-gray-400 mb-1">Total Rides</Text>
                <Text className="text-2xl font-bold text-black">{history.length}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-gray-400 mb-1">Total Earned</Text>
                <Text className="text-2xl font-bold text-black">₹{totalFare}</Text>
              </View>
            </View>
          </Card>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <HistoryCard item={item} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-[40px] mb-4">📋</Text>
            <Text className="text-black font-semibold text-lg mb-1">No rides yet</Text>
            <Text className="text-gray-400 text-sm">Completed rides will appear here</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default DriverRideHistory;