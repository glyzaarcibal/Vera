import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

const TabButton = ({ label, isActive, onClick }) => {
  return (
    <TouchableOpacity
      className={`px-8 py-4 relative ${
        isActive ? 'bg-white' : 'bg-transparent'
      }`}
      onPress={onClick}
      activeOpacity={0.7}
    >
      <Text
        className={`font-semibold text-center ${
          isActive ? 'text-indigo-500' : 'text-gray-500'
        }`}
      >
        {label}
      </Text>
      {isActive && (
        <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
      )}
    </TouchableOpacity>
  );
};

export default TabButton;
