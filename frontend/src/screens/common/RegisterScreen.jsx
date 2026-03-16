import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerApi } from '../../api/auth.api';
import Input from './../../component/Input';
import Button from './../../component/Button';

const INITIAL_FORM = {
  fullname:          '',
  username:          '',
  email:             '',
  phone:             '',
  password:          '',
  confirmPassword:   '',
  role:              'Passenger',
  vehicleName:       '',
  vehicleNumber:     '',
  yearOfExperience:  '',
};

const RegisterScreen = ({ navigation }) => {
  const [form,    setForm]    = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const selectRole = (role) => {
    setForm((prev) => ({ ...prev, role }));
    setErrors({});
  };

  const validate = () => {
    const errs = {};

    if (!form.fullname.trim())        errs.fullname        = 'Full name is required';
    if (!form.username.trim())        errs.username        = 'Username is required';
    if (!form.email.trim())           errs.email           = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.phone.trim())           errs.phone           = 'Phone number is required';
    else if (form.phone.trim().length < 10)    errs.phone  = 'Enter a valid phone number';
    if (!form.password)               errs.password        = 'Password is required';
    else if (form.password.length < 6)         errs.password = 'Password must be at least 6 characters';
    if (!form.confirmPassword)        errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';

    if (form.role === 'Driver') {
      if (!form.vehicleName.trim())   errs.vehicleName   = 'Vehicle name is required';
      if (!form.vehicleNumber.trim()) errs.vehicleNumber = 'Vehicle number is required';
      if (!form.yearOfExperience.toString().trim()) errs.yearOfExperience = 'Years of experience is required';
      else if (isNaN(Number(form.yearOfExperience)) || Number(form.yearOfExperience) < 0)
        errs.yearOfExperience = 'Enter a valid number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = () => {
    const base = {
        username:  form.username.trim(),
        fullname:  form.fullname.trim(),
        email:     form.email.trim().toLowerCase(),
        password:  form.password,
      confirmPassword: form.confirmPassword,
      phone:     form.phone.trim(),
      role:      form.role,
    };

    if (form.role === 'Driver') {
      return {
        ...base,
        vehicleName:       form.vehicleName.trim(),
        vehicleNumber:     form.vehicleNumber.trim().toUpperCase(),
        yearOfExperience:  Number(form.yearOfExperience),
      };
    }

    return base;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await registerApi(buildPayload());
      console.log(res);
      Alert.alert(
        'Registration Successful 🎉',
        `Your ${form.role} account has been created. Please sign in.`,
        [{ text: 'Sign In', onPress: () => navigation.replace('Login') }]
      );
    } catch (err) {
      console.log("ERROR:", err.response?.data);

    Alert.alert(
      "Registration Failed",
      err.response?.message || "Server not reachable."
    );
      
    } finally {
      setLoading(false);
    }
  };

  const isDriver = form.role === 'Driver';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center mb-8">
            <TouchableOpacity
              className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center mr-3"
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text className="text-xl text-black" style={{ lineHeight: 22 }}>←</Text>
            </TouchableOpacity>
            <Text className="text-base font-semibold text-black">Create Account</Text>
          </View>

          <View className="mb-8">
            <Text className="text-[28px] font-bold text-black mb-[6px]">Join Taxi Driver</Text>
            <Text className="text-[15px] text-gray-500">Create your account and start your journey</Text>
          </View>

          {/* ── Role Toggle ── */}
          <Text
            className="text-[11px] font-semibold text-gray-400 uppercase mb-[10px]"
            style={{ letterSpacing: 1 }}
          >
            I want to join as
          </Text>
          <View className="flex-row bg-gray-100 rounded-[14px] p-1 mb-7">
            {[
              { key: 'Passenger', label: 'Passenger', emoji: '🧑' },
              { key: 'Driver',    label: 'Driver',    emoji: '🚕' },
            ].map(({ key, label, emoji }) => (
              <TouchableOpacity
                key={key}
                onPress={() => selectRole(key)}
                className={`flex-1 py-[13px] rounded-[11px] items-center flex-row justify-center ${form.role === key ? 'bg-black' : ''}`}
                activeOpacity={0.8}
              >
                <Text className="text-base mr-[6px]">{emoji}</Text>
                <Text className={`font-semibold text-sm ${form.role === key ? 'text-white' : 'text-gray-500'}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Personal Info ── */}
          <View className="flex-row items-center mb-5 mt-1">
            <View className="flex-1 h-px bg-gray-100" />
            <Text
              className="text-[11px] font-semibold text-gray-400 uppercase mx-3"
              style={{ letterSpacing: 1 }}
            >
              Personal Info
            </Text>
            <View className="flex-1 h-px bg-gray-100" />
          </View>

          <Input
            label="Full Name"
            placeholder="John Doe"
            value={form.fullname}
            onChangeText={(v) => updateField('fullname', v)}
            autoCapitalize="words"
            error={errors.fullname}
          />
          <Input
            label="Username"
            placeholder="johndoe"
            value={form.username}
            onChangeText={(v) => updateField('username', v.toLowerCase())}
            autoCapitalize="none"
            error={errors.username}
          />
          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Input
            label="Phone Number"
            placeholder="+91 00000 00000"
            value={form.phone}
            onChangeText={(v) => updateField('phone', v)}
            keyboardType="phone-pad"
            error={errors.phone}
          />

          {/* ── Security ── */}
          <View className="flex-row items-center mb-5 mt-1">
            <View className="flex-1 h-px bg-gray-100" />
            <Text
              className="text-[11px] font-semibold text-gray-400 uppercase mx-3"
              style={{ letterSpacing: 1 }}
            >
              Security
            </Text>
            <View className="flex-1 h-px bg-gray-100" />
          </View>

          <Input
            label="Password"
            placeholder="Minimum 6 characters"
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            secureTextEntry
            error={errors.password}
          />
          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChangeText={(v) => updateField('confirmPassword', v)}
            secureTextEntry
            error={errors.confirmPassword}
          />

          {/* ── Driver-only fields ── */}
          {isDriver && (
            <>
              <View className="flex-row items-center mb-5 mt-1">
                <View className="flex-1 h-px bg-gray-100" />
                <Text
                  className="text-[11px] font-semibold text-gray-400 uppercase mx-3"
                  style={{ letterSpacing: 1 }}
                >
                  Vehicle Details
                </Text>
                <View className="flex-1 h-px bg-gray-100" />
              </View>

              <View className="flex-row items-center bg-green-50 rounded-xl p-3 mb-5 border border-green-200">
                <Text className="text-xl mr-[10px]">🚗</Text>
                <Text className="text-green-700 text-[13px] font-medium flex-1">
                  As a driver, please provide your vehicle and experience details for verification.
                </Text>
              </View>

              <Input
                label="Vehicle Name"
                placeholder="e.g. Maruti Swift, Honda City"
                value={form.vehicleName}
                onChangeText={(v) => updateField('vehicleName', v)}
                autoCapitalize="words"
                error={errors.vehicleName}
              />
              <Input
                label="Vehicle Number"
                placeholder="e.g. MH 01 AB 1234"
                value={form.vehicleNumber}
                onChangeText={(v) => updateField('vehicleNumber', v.toUpperCase())}
                autoCapitalize="characters"
                error={errors.vehicleNumber}
              />
              <Input
                label="Years of Experience"
                placeholder="e.g. 3"
                value={form.yearOfExperience.toString()}
                onChangeText={(v) => updateField('yearOfExperience', v)}
                keyboardType="numeric"
                error={errors.yearOfExperience}
              />
            </>
          )}

          <Button
            title={loading ? 'Creating Account...' : `Register as ${isDriver ? 'Driver' : 'Passenger'}`}
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={{ marginTop: 8 }}
          />

          <View className="flex-row justify-center items-center mt-6">
            <Text className="text-gray-500 text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text className="text-black font-bold text-sm">Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;