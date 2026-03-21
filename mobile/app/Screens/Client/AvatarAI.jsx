import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const AvatarAI = ({ navigation }) => {
  const avatarOptions = [
    {
      id: 'human',
      name: 'Human Agent',
      icon: 'person-outline',
      description:
        'Realistic human avatar with voice emotion detection via AI integration',
    },
    {
      id: 'animal',
      name: 'Animal Avatar',
      icon: 'paw-outline',
      description: 'Cute animal character AI assistant for a friendly touch',
    },
  ]

  const handleAvatarSelect = type => {
    if (type === 'human') {
      navigation.navigate('DIDAgent')
      return
    }
    // Animal avatar - placeholder for future implementation
    console.log('Animal avatar selected - coming soon')
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTopRight]} />
      <View style={[styles.blob, styles.blobMidLeft]} />
      <View style={[styles.blob, styles.blobBottomRight]} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={28} color="#7C3AED" />
            </TouchableOpacity>
            <Text style={styles.headerEyebrow}>Avatar AI</Text>
            <View style={{ width: 28 }} />
          </View>

          <Text style={styles.headerTitle}>
            Meet Your AI{' '}
            <Text style={styles.headerTitleAccent}>Companion</Text>
          </Text>
          <Text style={styles.headerSubtitle}>
            Choose your avatar and start a conversation
          </Text>
        </View>

        {/* Avatar Options */}
        <View style={styles.optionsContainer}>
          {avatarOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleAvatarSelect(option.id)}
              style={styles.optionCard}
              activeOpacity={0.85}
            >
              <View style={styles.optionIconWrap}>
                <Ionicons name={option.icon} size={32} color="#7C3AED" />
              </View>

              <Text style={styles.optionName}>{option.name}</Text>
              <Text style={styles.optionDesc} numberOfLines={2}>
                {option.description}
              </Text>

              <View style={styles.optionStatus}>
                <Ionicons name="chevron-forward" size={16} color="#A7A3B8" />
                <Text style={styles.optionStatusText}>Select</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

export default AvatarAI

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8F3',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.34,
  },
  blobTopRight: {
    width: 280,
    height: 280,
    top: -90,
    right: -90,
    backgroundColor: '#F9C7A7',
  },
  blobMidLeft: {
    width: 220,
    height: 220,
    top: 360,
    left: -90,
    backgroundColor: '#C4B5FD',
  },
  blobBottomRight: {
    width: 260,
    height: 260,
    bottom: 100,
    right: -110,
    backgroundColor: '#A7F3D0',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#D8B4FE',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  headerEyebrow: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  headerTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: '#2D1B4E',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerTitleAccent: {
    color: '#7C3AED',
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#7C6B8A',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#DDD6FE',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  optionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D1B4E',
    marginBottom: 8,
  },
  optionDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6F6281',
    marginBottom: 12,
  },
  optionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
  },
  optionStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A7A3B8',
    marginLeft: 6,
  },
})
