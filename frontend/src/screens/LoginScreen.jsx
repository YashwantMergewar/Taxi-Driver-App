import React from "react";
import { View, Text, Pressable } from "react-native";
import { signInWithGoogle } from "../services/googleAuth";

export default function LoginScreen({ navigation }) {
  const handleGoogleSignIn = async () => {
    try {
      const token = await signInWithGoogle();
      console.log("Google token:", token);
      // optional: send token to your backend / Firebase
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Pressable
        className="bg-red-500 px-4 py-2 rounded"
        onPress={handleGoogleSignIn}
      >
        <Text className="text-white font-bold">Sign in with Google</Text>
      </Pressable>
    </View>
  );
}
