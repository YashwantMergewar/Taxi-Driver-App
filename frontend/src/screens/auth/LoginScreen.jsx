import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { loginApi } from "../../api/auth.api";
import Input from "./../../component/Input";
import Button from "./../../component/Button";

// Must match backend Zod regex exactly
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&])[A-Za-z\d#@$!%*?&]{8,}$/;

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();

  const [data, setData] = useState({
    email: "",
    password: "",
    role: "Passenger",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const updateField = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const errs = {};

    if (!data.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email))
      errs.email = "Enter a valid email address";

    if (!data.password) errs.password = "Password is required";
    else if (!PASSWORD_REGEX.test(data.password))
      errs.password =
        "Min 8 chars, uppercase, lowercase, number & special char (#@$!%*?&)";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // ✅ Send ONLY email + password — role is NOT in your Zod schema
      // Extra fields cause Zod to fail validation on backend
      const payload = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
      };

      const res = await loginApi(payload);

      // Backend sends token in both httpOnly cookie AND JSON body
      // We pass the accessToken from the body to AuthContext for SecureStore storage
      if (res.accessToken) {
        await login(res.accessToken, res.user);
        console.log("Login successful", res.user);
      } else {
        // Fallback if token is missing
        await login("", res.user);
        console.warn("Warning: AccessToken was missing from response");
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Invalid credentials. Please try again.";
      console.log(err);
      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 64,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-[28px] font-bold text-black mb-2">
          Welcome back
        </Text>
        <Text className="text-[15px] text-gray-500 mb-8">
          Sign in to continue your journey
        </Text>

        <Text
          className="text-[11px] font-semibold text-gray-400 uppercase mb-[10px]"
          style={{ letterSpacing: 1 }}
        >
          Signing in as
        </Text>
        <View className="flex-row bg-gray-100 rounded-[14px] p-1 mb-7">
          {[
            { key: "Passenger", emoji: "🧑" },
            { key: "Driver", emoji: "🚕" },
          ].map(({ key, emoji }) => (
            <TouchableOpacity
              key={key}
              onPress={() => updateField("role", key)}
              className={`flex-1 py-[13px] rounded-[11px] items-center flex-row justify-center ${data.role === key ? "bg-black" : ""}`}
              activeOpacity={0.8}
            >
              <Text className="text-base mr-[6px]">{emoji}</Text>
              <Text
                className={`font-semibold text-sm ${data.role === key ? "text-white" : "text-gray-500"}`}
              >
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Email"
          placeholder="you@example.com"
          value={data.email}
          onChangeText={(v) => updateField("email", v)}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          value={data.password}
          onChangeText={(v) => updateField("password", v)}
          secureTextEntry
          error={errors.password}
        />

        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={{ marginTop: 8 }}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate("Register")}
          className="mt-6 items-center"
          activeOpacity={0.7}
        >
          <Text className="text-gray-500 text-sm">
            Don't have an account?{" "}
            <Text className="text-black font-bold text-sm">Register</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;
