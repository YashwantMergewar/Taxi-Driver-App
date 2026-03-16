import React, { useState } from 'react';
import { View, TextInput, Text } from 'react-native';

const Input = ({ label, error, style, ...props }) => {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? '#EF4444'
    : focused
    ? '#000000'
    : '#E5E7EB';

  return (
    <View className="mb-4" style={style}>
      {label && <Text className="text-black font-medium text-sm mb-[6px]">{label}</Text>}
      <TextInput
        className="rounded-xl px-4 py-[14px] text-black text-base bg-white"
        style={{ borderWidth: 1.5, borderColor }}
        placeholderTextColor="#9CA3AF"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <Text className="text-red-400 text-xs mt-1">{error}</Text>}
    </View>
  );
};

export default Input;