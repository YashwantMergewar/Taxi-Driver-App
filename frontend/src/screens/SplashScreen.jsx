import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const SplashScreen = ({ navigation }) => {
  const { user, loading } = useAuth();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center p-6">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
          <View className="w-16 h-16 bg-black rounded-2xl mb-6 items-center justify-center">
            <Text style={{ fontSize: 32 }}>🚕</Text>
          </View>
          <Text className="text-[36px] font-bold text-black mb-2">Taxi Driver</Text>
          <Text
            className="text-xs text-gray-400 mb-12 uppercase"
            style={{ letterSpacing: 3 }}
          >
            Book. Ride. Arrive.
          </Text>
          <ActivityIndicator color="#000" size="small" />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default SplashScreen;