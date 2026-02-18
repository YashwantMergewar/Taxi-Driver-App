import "./global.css";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import { SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-blue-500">
      <Text className="text-white text-xl font-bold">NativeWind OK</Text>
      <AppNavigator />
    </SafeAreaView>
  );
}
