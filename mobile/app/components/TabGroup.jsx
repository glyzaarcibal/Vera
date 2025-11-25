import React from 'react';
import { View, ScrollView } from 'react-native';
import TabButton from './TabButton';

const TabGroup = ({ tabs, activeTab, onTabChange }) => {
  return (
    <View className="bg-white border-b-2 border-gray-200">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4"
      >
        <View className="flex-row gap-2">
          {tabs.map((tab) => (
            <TabButton
              key={tab.value}
              label={tab.label}
              isActive={activeTab === tab.value}
              onClick={() => onTabChange(tab.value)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default TabGroup;
