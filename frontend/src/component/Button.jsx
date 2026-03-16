import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

const BG_CLASS = {
  primary: 'bg-black',
  outline: 'bg-white border border-black',
  danger:  'bg-red-600',
  ghost:   'bg-gray-100',
};

const TEXT_CLASS = {
  primary: 'text-white font-semibold text-base',
  outline: 'text-black font-semibold text-base',
  danger:  'text-white font-semibold text-base',
  ghost:   'text-black font-semibold text-base',
};

const LOADER_COLOR = { primary: '#fff', outline: '#000', danger: '#fff', ghost: '#000' };

const Button = ({ title, onPress, loading = false, disabled = false, variant = 'primary', style }) => {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        variant === 'outline' ? { borderWidth: 1.5, borderColor: '#000' } : null,
        style,
      ]}
      className={`rounded-xl py-4 px-6 items-center justify-center flex-row ${BG_CLASS[variant] ?? BG_CLASS.primary} ${isDisabled ? 'opacity-40' : ''}`}
    >
      {loading
        ? <ActivityIndicator color={LOADER_COLOR[variant]} size="small" />
        : <Text className={TEXT_CLASS[variant]}>{title}</Text>
      }
    </TouchableOpacity>
  );
};

export default Button;