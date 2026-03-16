import React from 'react';
import { View } from 'react-native';

const Card = ({ children, style }) => (
  <View
    className="bg-white rounded-2xl p-4 border border-gray-100"
    style={[
      {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
      style,
    ]}
  >
    {children}
  </View>
);

export default Card;