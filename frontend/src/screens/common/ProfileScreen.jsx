import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { updateProfileApi } from './../../api/auth.api';
import Card from './../../component/Card';
import Button from './../../component/Button';
import Input from './../../component/Input';
import { getCurrentUserApi } from '../../api/auth.api';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getCurrentUserApi();
      const userData = res.data;
      setProfile(userData);
      const displayName = userData?.driverRef?.fullname || userData?.passengerRef?.fullname || userData?.fullname || userData?.username || '';
      setName(displayName);
      setPhone(userData?.phone || '');
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfileApi({ name, phone });
      setEditing(false);
      await fetchProfile();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = (name || profile?.username || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center mb-8">
          <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center mr-3">
            <Text className="text-lg text-black" onPress={() => navigation.goBack()}>←</Text>
          </View>
          <Text className="text-[22px] font-bold text-black">My Profile</Text>
        </View>

        <View className="items-center mb-8">
          <View className="w-[88px] h-[88px] rounded-full bg-black items-center justify-center mb-3">
            <Text className="text-[36px] text-white font-bold">{initials}</Text>
          </View>
          <Text className="text-xl font-bold text-black mb-1">{profile?.name || user?.name}</Text>
          <Text
            className="text-[13px] text-gray-500 capitalize bg-gray-100 px-3 py-1 rounded-[20px]"
          >
            {profile?.role || user?.role}
          </Text>
        </View>

        {!editing ? (
          <>
            <Text
              className="text-[11px] font-semibold text-gray-400 uppercase mb-3"
              style={{ letterSpacing: 1 }}
            >
              Account Details
            </Text>
            <Card style={{ marginBottom: 24 }}>
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-400 text-sm">Full Name</Text>
                <Text className="text-black font-medium text-sm">{name}</Text>
              </View>
              <View className="h-px bg-gray-100 my-1" />
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-400 text-sm">Email</Text>
                <Text className="text-black font-medium text-sm">{profile?.email}</Text>
              </View>
              <View className="h-px bg-gray-100 my-1" />
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-400 text-sm">Phone</Text>
                <Text className="text-black font-medium text-sm">{profile?.phone || '—'}</Text>
              </View>
              <View className="h-px bg-gray-100 my-1" />
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-400 text-sm">Role</Text>
                <Text className="text-black font-medium text-sm capitalize">{profile?.role}</Text>
              </View>
            </Card>
            <Button title="Edit Profile" onPress={() => setEditing(true)} variant="outline" style={{ marginBottom: 16 }} />
            <Button title="Sign Out" onPress={handleLogout} variant="danger" />
          </>
        ) : (
          <>
            <Text
              className="text-[11px] font-semibold text-gray-400 uppercase mb-3"
              style={{ letterSpacing: 1 }}
            >
              Edit Details
            </Text>
            <Input label="Full Name" placeholder="Your full name" value={name} onChangeText={setName} />
            <Input label="Phone" placeholder="+91 00000 00000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Button title="Save Changes" onPress={handleSave} loading={saving} style={{ marginBottom: 16 }} />
            <Button title="Cancel" onPress={() => setEditing(false)} variant="ghost" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;