import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSelector } from 'react-redux'

import axiosInstance from '../../utils/axios.instance'
import DailyMoodModal from '../../components/DailyMoodModal'
import { selectUser } from '../../store/slices/authSelectors'

const Home = ({ navigation }) => {
  const user = useSelector(selectUser)
  const [showMoodModal, setShowMoodModal] = useState(false)
  const [dailyMoodPending, setDailyMoodPending] = useState(false)
  const [resources, setResources] = useState([])
  const [assignedCount, setAssignedCount] = useState(0)
  const [assignedResourceDetails, setAssignedResourceDetails] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHomeData()
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchAssignedResources()
    }
  }, [user?.id])

  const normalizeResources = payload => {
    if (Array.isArray(payload?.resources)) {
      return payload.resources
    }

    if (Array.isArray(payload)) {
      return payload
    }

    return []
  }

  const loadHomeData = async () => {
    setLoading(true)

    try {
      await Promise.all([retrieveDailyMoods(), fetchResources()])
    } finally {
      setLoading(false)
    }
  }

  const retrieveDailyMoods = async () => {
    try {
      const res = await axiosInstance.get('/moods/retrieve-daily-moods')
      const moods = Array.isArray(res.data?.moods) ? res.data.moods : []
      const hasMoodForToday = moods.length > 0

      setDailyMoodPending(!hasMoodForToday)

      if (!hasMoodForToday) {
        setShowMoodModal(true)
      }
    } catch (e) {
      Alert.alert(
        'Unable to load mood check-in',
        e.response?.data?.message || 'Internal Server Error',
      )
    }
  }

  const handleSaveMood = async moodScore => {
    try {
      await axiosInstance.post('/moods/save-daily-mood', {
        mood_score: moodScore,
      })
      setShowMoodModal(false)
      setDailyMoodPending(false)
      retrieveDailyMoods()
    } catch (e) {
      Alert.alert(
        'Failed to save mood',
        e.response?.data?.message || 'Failed to save mood',
      )
    }
  }

  const fetchResources = async () => {
    try {
      const res = await axiosInstance.get('/resources')
      setResources(normalizeResources(res.data))
    } catch (e) {
      console.error('Error fetching resources:', e)
    }
  }

  const fetchAssignedResources = async () => {
    if (!user?.id) return

    try {
      const res = await axiosInstance.get(`/resources/get-assignments/${user.id}`)
      const assignments = Array.isArray(res.data?.assignments)
        ? res.data.assignments
        : []
      setAssignedCount(assignments.length)

      const resourcesRes = await axiosInstance.get('/resources')
      const allResources = normalizeResources(resourcesRes.data)
      const details = assignments
        .map(assignment =>
          allResources.find(resource => resource.id === assignment.resource_id),
        )
        .filter(Boolean)

      setAssignedResourceDetails(details)
    } catch (e) {
      console.error('Error fetching assigned resources:', e)
    }
  }

  const handleOpenLink = async url => {
    try {
      const supported = await Linking.canOpenURL(url)

      if (!supported) {
        Alert.alert('Invalid link', 'Unable to open this resource right now.')
        return
      }

      await Linking.openURL(url)
    } catch {
      Alert.alert('Link error', 'Unable to open this resource right now.')
    }
  }

  const extractDomain = url => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const getStatCardStyle = tone => {
    switch (tone) {
      case 'orange':
        return styles.statCardOrange
      case 'green':
        return styles.statCardGreen
      default:
        return styles.statCardPurple
    }
  }

  const renderLinkChips = (links, compact = false) => {
    const visibleLinks = compact ? links.slice(0, 2) : links

    return (
      <View style={styles.linksWrap}>
        {visibleLinks.map((link, index) => (
          <TouchableOpacity
            key={`${link}-${index}`}
            onPress={() => handleOpenLink(link)}
            style={compact ? styles.linkChipSmall : styles.linkChip}
            activeOpacity={0.85}
          >
            <Ionicons
              name="link"
              size={compact ? 12 : 14}
              color="#5B21B6"
            />
            <Text style={compact ? styles.linkChipTextSmall : styles.linkChipText}>
              {extractDomain(link)}
            </Text>
          </TouchableOpacity>
        ))}
        {compact && links.length > 2 ? (
          <Text style={styles.moreLinksText}>+{links.length - 2} more</Text>
        ) : null}
      </View>
    )
  }

  const firstName =
    user?.username?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const featuredResource = resources[0]
  const otherResources = resources.slice(1, 7)
  const featureCards = [
    {
      icon: 'mic',
      title: 'Voice Emotion Recognition',
      description:
        'Express yourself naturally and let VERA read emotional cues through your voice.',
    },
    {
      icon: 'chatbubbles',
      title: 'AI Chatbot Support',
      description:
        'Reach calm support quickly when you need a grounded response or a safe first step.',
    },
    {
      icon: 'bar-chart',
      title: 'Mood Tracking',
      description:
        'Notice patterns over time and build clearer awareness of what helps you feel steady.',
    },
    {
      icon: 'analytics',
      title: 'Predictive Analytics',
      description:
        'Spot early changes and surface useful guidance before stress starts to build.',
    },
  ]
  const statCards = [
    {
      label: 'Curated resources',
      value: String(resources.length),
      tone: 'orange',
      icon: 'library-outline',
    },
    {
      label: 'Assigned for you',
      value: String(assignedCount),
      tone: 'purple',
      icon: 'sparkles-outline',
    },
    {
      label: 'Daily check-in',
      value: dailyMoodPending ? 'Needed' : 'Done',
      tone: 'green',
      icon: 'happy-outline',
    },
  ]

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.blob, styles.blobTopRight]} />
      <View style={[styles.blob, styles.blobMidLeft]} />
      <View style={[styles.blob, styles.blobBottomRight]} />

      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>MENTAL HEALTH SUPPORT</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.notificationButton}
            activeOpacity={0.85}
          >
            <View style={styles.notificationIconWrap}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#7C3AED"
              />
              <View style={styles.notificationDot} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>WELCOME TO VERA</Text>
          </View>

          <Text style={styles.heroTitle}>Hello, {firstName}</Text>
          <Text style={styles.heroSubtitle}>
            A calmer home for voice check-ins, guided support, and the small
            signals that help you care for yourself better.
          </Text>

          <View style={styles.heroPillsRow}>
            <View style={styles.heroPill}>
              <Ionicons name="heart-outline" size={14} color="#D97706" />
              <Text style={styles.heroPillText}>Private support</Text>
            </View>
            <View style={styles.heroPill}>
              <Ionicons name="leaf-outline" size={14} color="#D97706" />
              <Text style={styles.heroPillText}>Gentle routines</Text>
            </View>
          </View>

          <View style={styles.focusCard}>
            <Text style={styles.focusLabel}>TODAY'S FOCUS</Text>
            <Text style={styles.focusTitle}>
              {dailyMoodPending
                ? 'Take a quick mood check-in'
                : 'Keep your rhythm going'}
            </Text>
            <Text style={styles.focusBody}>
              {dailyMoodPending
                ? 'A short check-in helps VERA tailor support and surface better suggestions.'
                : 'You are up to date today. Explore a resource or revisit your support tools.'}
            </Text>
          </View>

          <View style={styles.statsRow}>
            {statCards.map(stat => (
              <View
                key={stat.label}
                style={[styles.statCard, getStatCardStyle(stat.tone)]}
              >
                <View style={styles.statIconWrap}>
                  <Ionicons name={stat.icon} size={18} color="#5B4C72" />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>CORE TOOLS</Text>
          <Text style={styles.sectionTitle}>What VERA helps you do</Text>
          <Text style={styles.sectionSubtitle}>
            The home screen now focuses on support features and your current
            progress instead of auth actions.
          </Text>
        </View>

        <View style={styles.featuresWrap}>
          {featureCards.map(feature => (
            <View key={feature.title} style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={feature.icon} size={22} color="#7C3AED" />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('AvatarAI')}
          style={styles.avatarCta}
          activeOpacity={0.85}
        >
          <View style={styles.avatarCtaContent}>
            <View style={styles.avatarCtaIcon}>
              <Ionicons name="robot-outline" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.avatarCtaText}>
              <Text style={styles.avatarCtaTitle}>Try Avatar AI</Text>
              <Text style={styles.avatarCtaSubtitle}>
                Chat with your personalized AI companion
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {!loading && resources.length > 0 ? (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>CURATED PICKS</Text>
              <Text style={styles.sectionTitle}>Helpful resources</Text>
              <Text style={styles.sectionSubtitle}>
                Explore practical tools, articles, and content to support your
                mental wellness journey.
              </Text>
            </View>

            {featuredResource ? (
              <View style={styles.featuredCard}>
                {featuredResource.image_url ? (
                  <View style={styles.featuredImageWrap}>
                    <Image
                      source={{ uri: featuredResource.image_url }}
                      style={styles.featuredImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View style={styles.featuredFallback}>
                    <Ionicons name="book-outline" size={92} color="#FFFFFF" />
                  </View>
                )}

                <View style={styles.featuredBody}>
                  {featuredResource.category ? (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {featuredResource.category}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.featuredTitle}>{featuredResource.title}</Text>
                  <Text style={styles.featuredDescription} numberOfLines={3}>
                    {featuredResource.description}
                  </Text>
                  {featuredResource.links && featuredResource.links.length > 0 ? (
                    <View>
                      <Text style={styles.linksLabel}>Resources</Text>
                      {renderLinkChips(featuredResource.links)}
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {otherResources.length > 0 ? (
              <View>
                {otherResources.map(resource => (
                  <View key={resource.id} style={styles.resourceCard}>
                    {resource.image_url ? (
                      <View style={styles.resourceImageWrap}>
                        <Image
                          source={{ uri: resource.image_url }}
                          style={styles.resourceImage}
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      <View style={styles.resourceFallback}>
                        <Ionicons
                          name="book-outline"
                          size={56}
                          color="#FFFFFF"
                        />
                      </View>
                    )}

                    <View style={styles.resourceBody}>
                      {resource.category ? (
                        <View style={styles.smallCategoryBadge}>
                          <Text style={styles.smallCategoryBadgeText}>
                            {resource.category}
                          </Text>
                        </View>
                      ) : null}
                      <Text style={styles.resourceTitle}>{resource.title}</Text>
                      <Text style={styles.resourceDescription} numberOfLines={2}>
                        {resource.description}
                      </Text>
                      {resource.links && resource.links.length > 0 ? (
                        <View>
                          <Text style={styles.linksLabelSmall}>Links</Text>
                          {renderLinkChips(resource.links, true)}
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {!loading && assignedResourceDetails.length > 0 ? (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={styles.personalizedBadge}>
                <Ionicons name="sparkles" size={15} color="#6D28D9" />
                <Text style={styles.personalizedBadgeText}>
                  Personalized for you
                </Text>
              </View>
              <Text style={styles.sectionTitle}>Suggested resources</Text>
              <Text style={styles.sectionSubtitle}>
                Recommended by your advisor to support the next part of your
                mental wellness journey.
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalCardsContent}
            >
              {assignedResourceDetails.map(resource => (
                <View key={resource.id} style={styles.assignedCard}>
                  {resource.image_url ? (
                    <View style={styles.assignedImageWrap}>
                      <Image
                        source={{ uri: resource.image_url }}
                        style={styles.assignedImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <View style={styles.assignedFallback}>
                      <Ionicons name="book-outline" size={62} color="#FFFFFF" />
                    </View>
                  )}

                  <View style={styles.assignedBody}>
                    <View style={styles.assignedMetaRow}>
                      {resource.category ? (
                        <View style={styles.smallCategoryBadge}>
                          <Text style={styles.smallCategoryBadgeText}>
                            {resource.category}
                          </Text>
                        </View>
                      ) : (
                        <View />
                      )}
                      <Ionicons name="star" size={16} color="#7C3AED" />
                    </View>

                    <Text style={styles.resourceTitle}>{resource.title}</Text>
                    <Text style={styles.resourceDescription} numberOfLines={3}>
                      {resource.description}
                    </Text>
                    {resource.links && resource.links.length > 0 ? (
                      <View style={styles.assignedLinksWrap}>
                        <Text style={styles.linksLabelSmall}>Links</Text>
                        {renderLinkChips(resource.links, true)}
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading your support space...</Text>
          </View>
        ) : null}

        <View style={styles.footerCard}>
          <Text style={styles.footerText}>
            A safe, accessible, and stigma-free platform for mental health
            support.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('About')}>
            <Text style={styles.footerLink}>Learn more about our mission {'->'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DailyMoodModal
        visible={showMoodModal}
        onClose={() => setShowMoodModal(false)}
        onSave={handleSaveMood}
      />
    </ScrollView>
  )
}

export default Home

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8F3',
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
  container: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFF0E8',
    borderWidth: 1,
    borderColor: '#FFD8C2',
    borderRadius: 999,
  },
  headerBadgeText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#D8B4FE',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  notificationIconWrap: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: '#FFE4D6',
    shadowColor: '#E8A87C',
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F3FF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#6D28D9',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#2D1B4E',
    letterSpacing: -0.6,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: '#7C6B8A',
    marginBottom: 14,
  },
  heroPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFF8F3',
    borderWidth: 1,
    borderColor: '#FFE4D6',
    marginRight: 10,
    marginBottom: 10,
  },
  heroPillText: {
    color: '#9A6B3D',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  focusCard: {
    borderRadius: 20,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 16,
    marginBottom: 18,
  },
  focusLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#7C3AED',
    marginBottom: 6,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B235A',
    marginBottom: 6,
  },
  focusBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#7C6B8A',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    flexGrow: 1,
    minWidth: 96,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  statCardOrange: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  statCardPurple: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  statCardGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFFB3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D1B4E',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 18,
    color: '#7C6B8A',
    fontWeight: '500',
  },
  sectionBlock: {
    marginBottom: 28,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#D97706',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#2D1B4E',
    textAlign: 'center',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#7C6B8A',
    textAlign: 'center',
    maxWidth: 520,
  },
  featuresWrap: {
    marginBottom: 28,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#D8B4FE',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: 14,
  },
  featureIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D1B4E',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6F6281',
  },
  avatarCta: {
    marginBottom: 28,
  },
  avatarCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: '#6D28D9',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  avatarCtaIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarCtaText: {
    flex: 1,
  },
  avatarCtaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  avatarCtaSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#C4B5FD',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    marginBottom: 18,
  },
  featuredImageWrap: {
    height: 260,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredFallback: {
    height: 260,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBody: {
    padding: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  featuredTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#2D1B4E',
    marginBottom: 10,
  },
  featuredDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6F6281',
    marginBottom: 16,
  },
  linksLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B4C72',
    marginBottom: 10,
  },
  linksLabelSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B4C72',
    marginBottom: 8,
  },
  linksWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginRight: 8,
    marginBottom: 8,
  },
  linkChipSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginRight: 8,
    marginBottom: 8,
  },
  linkChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5B21B6',
    marginLeft: 6,
  },
  linkChipTextSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5B21B6',
    marginLeft: 5,
  },
  moreLinksText: {
    fontSize: 11,
    color: '#7C6B8A',
    paddingVertical: 8,
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#DDD6FE',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: 14,
  },
  resourceImageWrap: {
    height: 180,
  },
  resourceImage: {
    width: '100%',
    height: '100%',
  },
  resourceFallback: {
    height: 180,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceBody: {
    padding: 18,
  },
  smallCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    marginBottom: 10,
  },
  smallCategoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  resourceTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#2D1B4E',
    marginBottom: 8,
  },
  resourceDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6F6281',
    marginBottom: 14,
  },
  personalizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 10,
  },
  personalizedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
    marginLeft: 6,
  },
  horizontalCardsContent: {
    paddingRight: 10,
  },
  assignedCard: {
    width: 286,
    marginRight: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#C4B5FD',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  assignedImageWrap: {
    height: 190,
  },
  assignedImage: {
    width: '100%',
    height: '100%',
  },
  assignedFallback: {
    height: 190,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignedBody: {
    padding: 18,
    minHeight: 210,
  },
  assignedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  assignedLinksWrap: {
    marginTop: 'auto',
  },
  loadingCard: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6F6281',
    marginLeft: 10,
  },
  footerCard: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#DDD6FE',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  footerText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#6F6281',
    textAlign: 'center',
    marginBottom: 10,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
  },
})
