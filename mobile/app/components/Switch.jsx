import React from 'react';
import { Switch as RNSwitch } from 'react-native';

const Switch = ({ id, checked, onChange, disabled = false }) => {
  return (
    <RNSwitch
      value={checked}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{ false: '#ccc', true: '#4caf50' }}
      thumbColor={checked ? '#ffffff' : '#ffffff'}
      ios_backgroundColor="#ccc"
    />
  );
};

export default Switch;
