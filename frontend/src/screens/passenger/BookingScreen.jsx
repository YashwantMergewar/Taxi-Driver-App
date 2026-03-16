import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Alert,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBookingApi } from '../../api/booking.api';
import Card           from '../../component/Card.jsx';
import Button         from '../../component/Button.jsx';
import LocationInput  from '../../component/Locationinput.jsx';
import { getFareEstimate } from '../../utils/Maps.js';

const BookingScreen = ({ navigation }) => {
  const [pickup,      setPickup]      = useState(null);
  const [drop,        setDrop]        = useState(null);
  const [estimate,    setEstimate]    = useState(null);
  const [estimating,  setEstimating]  = useState(false);
  const [estimateErr, setEstimateErr] = useState('');
  const [booking,     setBooking]     = useState(false);
  const [errors,      setErrors]      = useState({});

  const runEstimate = useCallback(async (pickupLoc, dropLoc) => {
    if (!pickupLoc || !dropLoc) return;
    setEstimating(true);
    setEstimate(null);
    setEstimateErr('');
    try {
      const result = await getFareEstimate(
        { lat: pickupLoc.lat, lng: pickupLoc.lng },
        { lat: dropLoc.lat,   lng: dropLoc.lng   },
      );
      setEstimate(result);
    } catch (err) {
      setEstimateErr('Could not calculate distance. Please check the locations.');
      console.log('Estimate error:', err.message);
    } finally {
      setEstimating(false);
    }
  }, []);

  const handlePickupSelect = (loc) => {
    setPickup(loc);
    setEstimate(null);
    setErrors(prev => ({ ...prev, pickup: null }));
    if (loc && drop) runEstimate(loc, drop);
  };

  const handleDropSelect = (loc) => {
    setDrop(loc);
    setEstimate(null);
    setErrors(prev => ({ ...prev, drop: null }));
    if (loc && pickup) runEstimate(pickup, loc);
  };

  const validate = () => {
    const errs = {};
    if (!pickup) errs.pickup = 'Please select a pickup location';
    if (!drop)   errs.drop   = 'Please select a drop location';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirmBooking = async () => {
    if (!validate()) return;
    setBooking(true);
    try {
      const res = await createBookingApi({
        pickupLocation: pickup.address,
        dropoffLocation: drop.address,
        pickupCoords:   { lat: pickup.lat, lng: pickup.lng },
        dropCoords:     { lat: drop.lat,   lng: drop.lng   },
        estimatedFare:  estimate?.fare       ?? null,
        distanceKm:     estimate?.distanceKm ?? null,
      });
      const bookingData = res?.data ?? res?.booking ?? res;
      navigation.replace('PassengerRideStatus', { booking: bookingData });
    } catch (err) {
      Alert.alert(
        'Booking Failed',
        err?.response?.data?.message || 'Unable to create booking. Please try again.'
      );
    } finally {
      setBooking(false);
    }
  };

  const bothSelected = pickup && drop;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center mr-3"
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text className="text-xl text-black">←</Text>
          </TouchableOpacity>
          <Text className="text-[22px] font-bold text-black">Book a Ride</Text>
        </View>

        <Text className="text-sm text-gray-400 mb-6">
          Search and select your pickup and drop locations
        </Text>

        {/* Location Inputs */}
        <LocationInput
          label="Pickup Location"
          placeholder="Search pickup address..."
          value={pickup}
          onSelect={handlePickupSelect}
          error={errors.pickup}
          icon="🟢"
        />
        <View className="pl-[18px] py-[2px]">
          <View className="w-px h-3 bg-gray-300" />
        </View>
        <LocationInput
          label="Drop Location"
          placeholder="Search destination..."
          value={drop}
          onSelect={handleDropSelect}
          error={errors.drop}
          icon="🔴"
        />

        {/* Estimating spinner */}
        {estimating && (
          <View className="mt-4 mb-5">
            <Card>
              <View className="flex-row items-center justify-center py-4">
                <ActivityIndicator color="#000" size="small" />
                <Text className="text-gray-500 text-sm ml-[10px]">Calculating fare...</Text>
              </View>
            </Card>
          </View>
        )}

        {/* Estimate error */}
        {estimateErr
          ? <Text className="text-red-500 text-[13px] text-center mb-3">{estimateErr}</Text>
          : null}

        {/* Fare Estimate Card */}
        {estimate && !estimating && (
          <View className="mt-4 mb-5">
            <Card>
              <Text
                className="text-[11px] font-semibold text-gray-400 uppercase mb-3"
                style={{ letterSpacing: 1 }}
              >
                Fare Estimate
              </Text>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-500 text-[13px]">Estimated Total</Text>
                <Text className="text-[36px] font-bold text-black">₹{estimate.fare}</Text>
              </View>

              <View className="flex-row mb-3">
                <View className="flex-1 bg-gray-50 rounded-[10px] p-[10px]">
                  <Text className="text-gray-400 text-[11px] mb-[2px]">Distance</Text>
                  <Text className="text-black font-semibold text-sm">{estimate.distanceText}</Text>
                </View>
                <View className="flex-1 bg-gray-50 rounded-[10px] p-[10px] ml-2">
                  <Text className="text-gray-400 text-[11px] mb-[2px]">Est. Time</Text>
                  <Text className="text-black font-semibold text-sm">{estimate.durationText}</Text>
                </View>
              </View>

              <View className="h-px bg-gray-100 my-2" />
              <View className="flex-row justify-between py-[5px]">
                <Text className="text-gray-500 text-[13px]">Base fare</Text>
                <Text className="text-black text-[13px] font-medium">₹30</Text>
              </View>
              <View className="flex-row justify-between py-[5px]">
                <Text className="text-gray-500 text-[13px]">Distance ({estimate.distanceKm} km × ₹12)</Text>
                <Text className="text-black text-[13px] font-medium">₹{Math.round(estimate.distanceKm * 12)}</Text>
              </View>
              <View className="flex-row justify-between py-[5px]">
                <Text className="text-gray-500 text-[13px]">Time ({estimate.durationMin} min × ₹1)</Text>
                <Text className="text-black text-[13px] font-medium">₹{estimate.durationMin}</Text>
              </View>
            </Card>
          </View>
        )}

        {/* Info note */}
        {!bothSelected && !estimating && (
          <View className="mt-4 mb-5">
            <Card>
              <View className="flex-row items-start" style={{ backgroundColor: '#F9FAFB' }}>
                <Text className="text-base mr-[10px] mt-[1px]">ℹ️</Text>
                <Text className="text-gray-700 text-[13px] leading-5 flex-1">
                  Select both pickup and drop locations to see fare estimate and distance.
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Confirm button wrapper — replaces style={{ marginTop: 8 }} */}
        <View className="mt-2">
          <Button
            title={
              booking              ? 'Creating Booking...'
              : bothSelected && estimate ? `Confirm Booking · ₹${estimate.fare}`
              : bothSelected            ? 'Confirm Booking'
              :                           'Select Locations to Continue'
            }
            onPress={handleConfirmBooking}
            loading={booking}
            disabled={booking || !bothSelected}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingScreen;