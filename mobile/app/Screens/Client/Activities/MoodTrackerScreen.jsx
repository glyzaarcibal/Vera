import React, { useEffect, useMemo, useState } from 'react'
import {
	ActivityIndicator,
	Alert,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	useWindowDimensions,
} from 'react-native'
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { useSelector } from 'react-redux'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

import axiosInstance from '../../../utils/axios.instance'
import { selectUser } from '../../../store/slices/authSelectors'

const MOOD_LEVELS = [
	{ category: 'Positive', subcategory: 'Low Energy', mood: 'Calm', color: '#4CAF50', bgColor: '#E8F5E9', emoji: '😌', score: 4 },
	{ category: 'Positive', subcategory: 'Low Energy', mood: 'Relaxed', color: '#66BB6A', bgColor: '#E8F5E9', emoji: '😌', score: 4 },
	{ category: 'Positive', subcategory: 'Low Energy', mood: 'Content', color: '#26A69A', bgColor: '#E0F2F1', emoji: '😊', score: 4.2 },
	{ category: 'Positive', subcategory: 'Low Energy', mood: 'Peaceful', color: '#00ACC1', bgColor: '#E0F7FA', emoji: '😇', score: 4.5 },
	{ category: 'Positive', subcategory: 'Low Energy', mood: 'Grateful', color: '#673AB7', bgColor: '#EDE7F6', emoji: '🙏', score: 5 },
	{ category: 'Positive', subcategory: 'High Energy', mood: 'Excited', color: '#FFD700', bgColor: '#FFF9C4', emoji: '🤩', score: 5 },
	{ category: 'Positive', subcategory: 'High Energy', mood: 'Joyful', color: '#FFB300', bgColor: '#FFF8E1', emoji: '😄', score: 5 },
	{ category: 'Positive', subcategory: 'High Energy', mood: 'Thrilled', color: '#FF8F00', bgColor: '#FFF3E0', emoji: '🥳', score: 5 },
	{ category: 'Positive', subcategory: 'High Energy', mood: 'Inspired', color: '#9C27B0', bgColor: '#F3E5F5', emoji: '✨', score: 4.7 },
	{ category: 'Positive', subcategory: 'High Energy', mood: 'Playful', color: '#E91E63', bgColor: '#FCE4EC', emoji: '😜', score: 4.5 },
	{ category: 'Negative', subcategory: 'Low Energy', mood: 'Depressed', color: '#5C6BC0', bgColor: '#E8EAF6', emoji: '😔', score: 1 },
	{ category: 'Negative', subcategory: 'Low Energy', mood: 'Tired', color: '#8D6E63', bgColor: '#EFEBE9', emoji: '😴', score: 2 },
	{ category: 'Negative', subcategory: 'Low Energy', mood: 'Disappointed', color: '#7E57C2', bgColor: '#F3E5F5', emoji: '😞', score: 1.5 },
	{ category: 'Negative', subcategory: 'Low Energy', mood: 'Annoyed', color: '#FB8C00', bgColor: '#FFF3E0', emoji: '😒', score: 2.5 },
	{ category: 'Negative', subcategory: 'Low Energy', mood: 'Bored', color: '#B0BEC5', bgColor: '#F5F5F5', emoji: '😑', score: 2.2 },
	{ category: 'Negative', subcategory: 'High Energy', mood: 'Anxious', color: '#FFA726', bgColor: '#FFF3E0', emoji: '😰', score: 1.5 },
	{ category: 'Negative', subcategory: 'High Energy', mood: 'Overwhelmed', color: '#F44336', bgColor: '#FFEBEE', emoji: '🤯', score: 1 },
	{ category: 'Negative', subcategory: 'High Energy', mood: 'Panicked', color: '#D32F2F', bgColor: '#FFEBEE', emoji: '😱', score: 0.5 },
	{ category: 'Negative', subcategory: 'High Energy', mood: 'Irritated', color: '#E64A19', bgColor: '#FBE9E7', emoji: '😤', score: 2 },
	{ category: 'Negative', subcategory: 'High Energy', mood: 'Frustrated', color: '#D84315', bgColor: '#FBE9E7', emoji: '😖', score: 1.2 },
]

const FILTERS = [
	{ id: 'all', label: 'All' },
	{ id: 'week', label: 'Week' },
	{ id: 'month', label: 'Month' },
]

const sanitizePdfText = value =>
	String(value ?? '')
		.normalize('NFKD')
		.replace(/[^\x20-\x7E\n\r\t]/g, '')
		.replace(/\s+/g, ' ')
		.trim()

const getFilterLabel = filter => {
	if (filter === 'week') {
		return 'Last 7 Days'
	}

	if (filter === 'month') {
		return 'Last 30 Days'
	}

	return 'All Time'
}

function MoodTrendChart({ history, chartWidth }) {
	if (!history.length) {
		return null
	}

	const width = Number.isFinite(chartWidth) && chartWidth > 0 ? chartWidth : 320
	const height = 180
	const padding = 18
	const points = [...history].reverse().map((entry, index, array) => {
		const x = array.length === 1 ? width / 2 : padding + (index * (width - padding * 2)) / (array.length - 1)
		const y = padding + ((5.5 - entry.score) / 5.5) * (height - padding * 2)
		return { ...entry, x, y }
	})

	return (
		<View style={styles.chartWrap}>
			<Text style={styles.sectionTitle}>Mood Over Time</Text>
			<Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
				{[1, 2, 3, 4, 5].map(level => {
					const y = padding + ((5.5 - level) / 5.5) * (height - padding * 2)
					return (
						<React.Fragment key={level}>
							<Line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" />
							<SvgText x={4} y={y + 4} fontSize="10" fill="#94a3b8">{level}</SvgText>
						</React.Fragment>
					)
				})}
				<Polyline points={points.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#6366f1" strokeWidth="3" />
				{points.map(point => (
					<Circle key={point.id || point.timestamp} cx={point.x} cy={point.y} r="4.5" fill={point.color || '#6366f1'} />
				))}
			</Svg>
			<Text style={styles.chartHint}>Recent trend based on recorded mood scores.</Text>
		</View>
	)
}

export default function MoodTrackerScreen({ navigation }) {
	const authState = useSelector(selectUser)
	const user = authState?.user ?? authState
	const { width: screenWidth } = useWindowDimensions()
	const isCompact = screenWidth < 390
	const isVeryCompact = screenWidth < 350
	const chartWidth = Math.max(280, Math.min(screenWidth - 72, 420))

	const [selectedMood, setSelectedMood] = useState(null)
	const [reason, setReason] = useState('')
	const [moodHistory, setMoodHistory] = useState([])
	const [filter, setFilter] = useState('all')
	const [isLoading, setIsLoading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	const groupedMoods = useMemo(() => {
		return MOOD_LEVELS.reduce((accumulator, mood) => {
			if (!accumulator[mood.category]) {
				accumulator[mood.category] = {}
			}
			if (!accumulator[mood.category][mood.subcategory]) {
				accumulator[mood.category][mood.subcategory] = []
			}
			accumulator[mood.category][mood.subcategory].push(mood)
			return accumulator
		}, {})
	}, [])

	useEffect(() => {
		loadMoodHistory()
	}, [user?.id, user?.user_id, user?.userId])

	const filteredHistory = useMemo(() => {
		const now = new Date()
		const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
		const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

		return moodHistory.filter(entry => {
			const entryDate = new Date(entry.timestamp)
			if (filter === 'week') {
				return entryDate >= oneWeekAgo
			}
			if (filter === 'month') {
				return entryDate >= oneMonthAgo
			}
			return true
		})
	}, [filter, moodHistory])

	const moodStats = useMemo(() => {
		const stats = { moods: {}, categories: {}, subcategories: {} }
		filteredHistory.forEach(entry => {
			stats.moods[entry.mood] = (stats.moods[entry.mood] || 0) + 1
			const moodObj = MOOD_LEVELS.find(mood => mood.mood === entry.mood)
			if (moodObj) {
				stats.categories[moodObj.category] = (stats.categories[moodObj.category] || 0) + 1
				stats.subcategories[moodObj.subcategory] = (stats.subcategories[moodObj.subcategory] || 0) + 1
			}
		})
		return stats
	}, [filteredHistory])

	const moodBreakdown = useMemo(() => {
		return Object.entries(moodStats.moods)
			.map(([mood, count]) => {
				const moodData = MOOD_LEVELS.find(item => item.mood === mood)
				const percentage = filteredHistory.length ? ((count / filteredHistory.length) * 100).toFixed(1) : '0.0'
				return {
					mood,
					count,
					percentage,
					moodData,
				}
			})
			.sort((left, right) => right.count - left.count)
	}, [filteredHistory.length, moodStats.moods])

	const categorySummary = useMemo(() => {
		return Object.entries(moodStats.categories).map(([category, count]) => ({
			category,
			count,
			percentage: filteredHistory.length ? ((count / filteredHistory.length) * 100).toFixed(0) : '0',
		}))
	}, [filteredHistory.length, moodStats.categories])

	const subcategorySummary = useMemo(() => {
		return Object.entries(moodStats.subcategories)
			.map(([subcategory, count]) => ({ subcategory, count }))
			.sort((left, right) => right.count - left.count)
	}, [moodStats.subcategories])

	const topMood = moodBreakdown[0]
	const filterLabel = getFilterLabel(filter)

	const loadMoodHistory = async () => {
		try {
			setIsLoading(true)
			const response = await axiosInstance.get('/activities')
			const activities = response.data?.activities || []
			const history = activities
				.filter(activity => activity.activity_type === 'mood')
				.map(activity => {
					const moodMeta = MOOD_LEVELS.find(mood => mood.mood === activity.data?.mood)
					return {
						id: activity.id,
						...activity.data,
						color: activity.data?.moodColor || moodMeta?.color || '#6366f1',
						score: moodMeta?.score || 3,
					}
				})
				.sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
			setMoodHistory(history)
		} catch (error) {
			console.error('Error loading mood history:', error)
			Alert.alert('Load failed', error?.response?.data?.message || 'Failed to load mood history. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	const saveMood = async () => {
		if (!selectedMood) {
			Alert.alert('Select mood', 'Please choose a mood first.')
			return
		}

		const now = new Date()
		const newEntry = {
			mood: selectedMood.mood,
			moodEmoji: selectedMood.emoji,
			moodColor: selectedMood.color,
			reason: reason.trim(),
			timestamp: now.toISOString(),
			date: now.toLocaleDateString('en-US', {
				weekday: 'short',
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			}),
			time: now.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
			}),
		}

		try {
			setIsSaving(true)
			await axiosInstance.post('/activities/save', {
				activityType: 'mood',
				data: newEntry,
			})
			await loadMoodHistory()
			setSelectedMood(null)
			setReason('')
		} catch (error) {
			console.error('Error saving mood:', error)
			Alert.alert('Save failed', error?.response?.data?.message || 'Failed to save mood. Please try again.')
		} finally {
			setIsSaving(false)
		}
	}

	const exportMoodHistoryPdf = async () => {
		if (!filteredHistory.length) {
			Alert.alert('No data', 'Add mood entries before exporting a PDF report.')
			return
		}

		try {
			const statsRows = moodBreakdown
				.map(item => `
					<tr>
						<td>${sanitizePdfText(item.mood)}</td>
						<td>${item.count}</td>
						<td>${item.percentage}%</td>
					</tr>
				`)
				.join('')

			const rows = filteredHistory
				.map(entry => `
					<tr>
						<td>${sanitizePdfText(entry.date || '-')}</td>
						<td>${sanitizePdfText(entry.time || '-')}</td>
						<td>${sanitizePdfText(entry.mood || '-')}</td>
						<td>${sanitizePdfText(entry.reason || 'No reason provided')}</td>
					</tr>
				`)
				.join('')

			const html = `
				<html>
					<head>
						<meta charset="utf-8" />
						<style>
							body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; padding: 24px; }
							h1 { margin: 0 0 8px; color: #4f46e5; }
							h2 { margin: 26px 0 10px; color: #1e293b; }
							p { margin: 0 0 18px; color: #475569; }
							.badge { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #eef2ff; color: #312e81; font-size: 12px; margin-bottom: 16px; }
							table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
							th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; text-align: left; vertical-align: top; }
							th { background: #eef2ff; color: #312e81; }
							tr:nth-child(even) { background: #f8fafc; }
						</style>
					</head>
					<body>
						<h1>Mood Tracker Report</h1>
						<div class="badge">Period: ${sanitizePdfText(filterLabel)}</div>
						<p>Generated on ${sanitizePdfText(new Date().toLocaleString())} • Total entries: ${filteredHistory.length}</p>
						<h2>Mood Statistics</h2>
						<table>
							<thead>
								<tr>
									<th>Mood</th>
									<th>Count</th>
									<th>Percentage</th>
								</tr>
							</thead>
							<tbody>${statsRows}</tbody>
						</table>
						<h2>Mood History</h2>
						<table>
							<thead>
								<tr>
									<th>Date</th>
									<th>Time</th>
									<th>Mood</th>
									<th>Reason</th>
								</tr>
							</thead>
							<tbody>${rows}</tbody>
						</table>
					</body>
				</html>
			`

			const { uri } = await Print.printToFileAsync({ html })
			if (Platform.OS === 'ios' || Platform.OS === 'android') {
				const canShare = await Sharing.isAvailableAsync()
				if (canShare) {
					await Sharing.shareAsync(uri, {
						mimeType: 'application/pdf',
						dialogTitle: 'Export Mood Tracker Report',
						UTI: 'com.adobe.pdf',
					})
				} else {
					Alert.alert('PDF created', `Saved report at: ${uri}`)
				}
			} else {
				Alert.alert('PDF created', `Saved report at: ${uri}`)
			}
		} catch (error) {
			console.error('Error exporting PDF:', error)
			Alert.alert('Export failed', 'Unable to generate PDF right now. Please try again.')
		}
	}

	const clearLocalHistory = () => {
		Alert.alert('Clear visible history', 'This only clears the current mobile view. It does not remove backend entries.', [
			{ text: 'Cancel', style: 'cancel' },
			{ text: 'Clear', style: 'destructive', onPress: () => setMoodHistory([]) },
		])
	}

	const deleteEntryFromView = id => {
		Alert.alert('Delete entry', 'Delete this mood entry?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					if (!id) {
						Alert.alert('Delete failed', 'Unable to delete this mood entry.')
						return
					}

					try {
						setIsLoading(true)
						await axiosInstance.delete(`/activities/${id}`)
						setMoodHistory(currentHistory =>
							currentHistory.filter(entry => entry.id !== id),
						)
					} catch (error) {
						console.error('Error deleting mood entry:', error?.response?.data || error.message)
						Alert.alert(
							'Delete failed',
							error?.response?.data?.message ||
								'Failed to delete mood entry. Please try again.',
						)
					} finally {
						setIsLoading(false)
					}
				},
			},
		])
	}

	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={[styles.contentContainer, isCompact ? styles.contentContainerCompact : null]}
		>
			<View style={styles.backgroundOrbTop} />
			<View style={styles.backgroundOrbBottom} />
			<View style={[styles.container, isCompact ? styles.containerCompact : null]}>
				<View style={styles.headerRow}>
					<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
						<Ionicons name="arrow-back" size={22} color="#ffffff" />
					</TouchableOpacity>
					<Text style={[styles.headerTitle, isCompact ? styles.headerTitleCompact : null]}>Mood Tracker</Text>
					<View style={styles.headerSpacer} />
				</View>

				{!selectedMood ? (
					<View style={styles.sectionBlock}>
						<Text style={[styles.promptTitle, isCompact ? styles.promptTitleCompact : null]}>
							How are you feeling today?
						</Text>
						{Object.entries(groupedMoods).map(([category, subcategories]) => (
							<View
								key={category}
								style={[
									styles.categoryCard,
									isCompact ? styles.categoryCardCompact : null,
									category === 'Positive' ? styles.categoryPositive : styles.categoryNegative,
								]}
							>
								<Text style={[styles.categoryTitle, category === 'Positive' ? styles.categoryTitlePositive : styles.categoryTitleNegative]}>
									{category === 'Positive' ? 'Positive Moods' : 'Negative Moods'}
								</Text>
								{Object.entries(subcategories).map(([subcategory, subMoods]) => (
									<View key={subcategory} style={styles.subcategoryWrap}>
										<Text style={styles.subcategoryTitle}>{subcategory}</Text>
										<View style={styles.moodGrid}>
											{subMoods.map(mood => (
												<TouchableOpacity
													key={mood.mood}
													onPress={() => setSelectedMood(mood)}
													style={[
														styles.moodCard,
														isCompact ? styles.moodCardCompact : null,
														isVeryCompact ? styles.moodCardVeryCompact : null,
														{ backgroundColor: mood.bgColor, borderColor: mood.color },
													]}
												>
													<Text style={styles.moodEmoji}>{mood.emoji}</Text>
													<Text style={[styles.moodName, { color: mood.color }]}>{mood.mood}</Text>
												</TouchableOpacity>
											))}
										</View>
									</View>
								))}
							</View>
						))}
					</View>
				) : (
					<View style={[styles.selectionCard, isCompact ? styles.selectionCardCompact : null]}>
						<Text style={[styles.selectionIntro, isCompact ? styles.selectionIntroCompact : null]}>
							You selected
						</Text>
						<View style={[styles.selectionBadge, { backgroundColor: selectedMood.bgColor, borderColor: selectedMood.color }]}>
							<Text style={styles.selectionEmoji}>{selectedMood.emoji}</Text>
							<Text style={[styles.selectionMood, isCompact ? styles.selectionMoodCompact : null, { color: selectedMood.color }]}>
								{selectedMood.mood}
							</Text>
						</View>
						<TextInput
							multiline
							value={reason}
							onChangeText={setReason}
							placeholder="Why do you feel this way? (optional)"
							placeholderTextColor="#94a3b8"
							style={[styles.reasonInput, isCompact ? styles.reasonInputCompact : null, { borderColor: selectedMood.color }]}
							textAlignVertical="top"
						/>
						<View style={[styles.selectionActions, isVeryCompact ? styles.selectionActionsStacked : null]}>
							<TouchableOpacity
								onPress={saveMood}
								disabled={isSaving}
								style={[
									styles.saveButton,
									isVeryCompact ? styles.selectionActionCompact : null,
									{ backgroundColor: selectedMood.color },
								]}
							>
								<Text style={styles.actionButtonText}>{isSaving ? 'Saving...' : 'Save Mood'}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => {
									setSelectedMood(null)
									setReason('')
								}}
								style={[styles.cancelButton, isVeryCompact ? styles.selectionActionCompact : null]}
							>
								<Text style={styles.actionButtonText}>Cancel</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}

				{isLoading ? (
					<View style={styles.loadingCard}>
						<ActivityIndicator size="large" color="#6366f1" />
						<Text style={styles.loadingText}>Loading mood history...</Text>
					</View>
				) : null}

				{!isLoading && filteredHistory.length > 0 ? <MoodTrendChart history={filteredHistory} chartWidth={chartWidth} /> : null}

				{!isLoading && filteredHistory.length > 0 ? (
					<View style={styles.statsCard}>
						<View style={styles.statsHeader}>
							<Text style={styles.sectionTitle}>Your Mood Statistics</Text>
							<View style={styles.totalBadge}>
								<Text style={styles.totalBadgeText}>Total: {filteredHistory.length}</Text>
							</View>
						</View>

						<View style={styles.periodBadge}>
							<Text style={styles.periodBadgeText}>{filterLabel}</Text>
						</View>

						{topMood ? (
							<View style={styles.insightCard}>
								<Text style={styles.insightLabel}>Most frequent mood</Text>
								<Text style={styles.insightValue}>
									{topMood.moodData?.emoji} {topMood.mood} • {topMood.count} entries
								</Text>
							</View>
						) : null}

						<View style={styles.summaryStrip}>
							{categorySummary.map(item => (
								<View key={item.category} style={styles.summaryItem}>
									<Text style={styles.summaryLabel}>{item.category}</Text>
									<Text style={[styles.summaryValue, { color: item.category === 'Positive' ? '#2E7D32' : '#C62828' }]}>
										{item.count}
									</Text>
									<Text style={styles.summaryPercent}>{item.percentage}%</Text>
								</View>
							))}
						</View>

						{subcategorySummary.length > 0 ? (
							<View style={styles.subcategoryStrip}>
								{subcategorySummary.map(item => (
									<View key={item.subcategory} style={styles.subcategoryBadge}>
										<Text style={styles.subcategoryBadgeLabel}>{item.subcategory}</Text>
										<Text style={styles.subcategoryBadgeValue}>{item.count}</Text>
									</View>
								))}
							</View>
						) : null}

						<View style={styles.statsGrid}>
							{moodBreakdown.map(item => (
								<View
									key={item.mood}
									style={[
										styles.statMoodCard,
										isCompact ? styles.statMoodCardCompact : null,
										isVeryCompact ? styles.statMoodCardVeryCompact : null,
										{
											backgroundColor: item.moodData?.bgColor || '#f8fafc',
											borderColor: item.moodData?.color || '#cbd5e1',
										},
									]}
								>
									<Text style={styles.statMoodEmoji}>{item.moodData?.emoji}</Text>
									<Text style={styles.statMoodName}>{item.mood}</Text>
									<Text style={[styles.statMoodCount, { color: item.moodData?.color || '#334155' }]}>{item.count}</Text>
									<Text style={styles.statMoodPercent}>{item.percentage}%</Text>
								</View>
							))}
						</View>
					</View>
				) : null}

				<View style={styles.historyCard}>
					<View style={styles.historyHeader}>
						<Text style={styles.historyTitle}>Mood History</Text>
						<View style={styles.filterRow}>
							{FILTERS.map(item => (
								<TouchableOpacity key={item.id} onPress={() => setFilter(item.id)} style={[styles.filterChip, filter === item.id ? styles.filterChipActive : null]}>
									<Text style={[styles.filterChipText, filter === item.id ? styles.filterChipTextActive : null]}>{item.label}</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>

					{filteredHistory.length === 0 ? (
						<View style={styles.emptyState}>
							<Text style={styles.emptyEmoji}>📭</Text>
							<Text style={styles.emptyTitle}>No mood entries found</Text>
							<Text style={styles.emptyText}>Start tracking your mood to see your history here.</Text>
						</View>
					) : (
						<View>
							{filteredHistory.map((item, index) => {
								const moodData = MOOD_LEVELS.find(mood => mood.mood === item.mood)
								return (
									<View key={item.id || `${item.timestamp}-${index}`} style={[styles.historyItem, { backgroundColor: moodData?.bgColor || '#f8fafc', borderColor: `${moodData?.color || '#cbd5e1'}66` }]}>
										<View style={styles.historyLeft}>
											<View style={[styles.historyMoodBubble, { backgroundColor: moodData?.color || '#6366f1' }]}>
												<Text style={styles.historyMoodEmoji}>{item.moodEmoji || moodData?.emoji}</Text>
											</View>
											<View style={styles.historyContent}>
												<View style={[styles.historyTopRow, isVeryCompact ? styles.historyTopRowCompact : null]}>
													<Text style={[styles.historyMoodName, { color: moodData?.color || '#334155' }]}>{item.mood}</Text>
													<Text style={[styles.historyTime, isVeryCompact ? styles.historyTimeCompact : null]}>{item.time}</Text>
												</View>
												{item.reason ? <Text style={styles.historyReason}>"{item.reason}"</Text> : null}
												<Text style={styles.historyDate}>{item.date}</Text>
											</View>
										</View>
										<TouchableOpacity onPress={() => deleteEntryFromView(item.id)} style={styles.removeButton}>
											<Ionicons name="trash-outline" size={18} color="#ef4444" />
										</TouchableOpacity>
									</View>
								)
							})}
						</View>
					)}

					{moodHistory.length > 0 ? (
						<View style={styles.historyActions}>
							<TouchableOpacity style={styles.exportButton} onPress={exportMoodHistoryPdf}>
								<Ionicons name="download-outline" size={18} color="#ffffff" />
								<Text style={styles.exportButtonText}>Export PDF {filter !== 'all' ? `(${FILTERS.find(item => item.id === filter)?.label})` : ''}</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.clearButton} onPress={clearLocalHistory}>
								<Text style={styles.clearButtonText}>Clear All History</Text>
							</TouchableOpacity>
						</View>
					) : null}
				</View>
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: '#eef4ff' },
	contentContainer: { padding: 20, paddingTop: 56, paddingBottom: 32 },
	contentContainerCompact: { paddingHorizontal: 14, paddingTop: 42, paddingBottom: 24 },
	backgroundOrbTop: { position: 'absolute', top: 40, left: -30, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(99, 102, 241, 0.12)' },
	backgroundOrbBottom: { position: 'absolute', right: -50, bottom: 80, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(168, 85, 247, 0.1)' },
	container: { maxWidth: 480, width: '100%', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 32, padding: 20, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 },
	containerCompact: { borderRadius: 24, padding: 14 },
	headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
	backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
	headerTitle: { fontSize: 30, fontWeight: '800', color: '#4f46e5' },
	headerTitleCompact: { fontSize: 24 },
	headerSpacer: { width: 42 },
	sectionBlock: { marginBottom: 24 },
	promptTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 18 },
	promptTitleCompact: { fontSize: 18, marginBottom: 14 },
	categoryCard: { borderRadius: 24, padding: 16, marginBottom: 16 },
	categoryCardCompact: { borderRadius: 18, padding: 12, marginBottom: 12 },
	categoryPositive: { backgroundColor: 'rgba(232, 245, 233, 0.7)' },
	categoryNegative: { backgroundColor: 'rgba(255, 235, 238, 0.7)' },
	categoryTitle: { fontSize: 19, fontWeight: '800', marginBottom: 12 },
	categoryTitlePositive: { color: '#2E7D32' },
	categoryTitleNegative: { color: '#C62828' },
	subcategoryWrap: { marginBottom: 14 },
	subcategoryTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
	moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
	moodCard: { width: '31%', minWidth: 95, borderRadius: 18, borderWidth: 2, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center' },
	moodCardCompact: { width: '48%', minWidth: 0, paddingVertical: 12 },
	moodCardVeryCompact: { width: '100%' },
	moodEmoji: { fontSize: 28, marginBottom: 6 },
	moodName: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
	selectionCard: { backgroundColor: '#f8fafc', borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
	selectionCardCompact: { borderRadius: 18, padding: 14 },
	selectionIntro: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
	selectionIntroCompact: { fontSize: 20, marginBottom: 10 },
	selectionBadge: { width: '100%', borderRadius: 22, borderWidth: 2, paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center', marginBottom: 16 },
	selectionEmoji: { fontSize: 48, marginBottom: 8 },
	selectionMood: { fontSize: 26, fontWeight: '800' },
	selectionMoodCompact: { fontSize: 22 },
	reasonInput: { width: '100%', minHeight: 120, borderWidth: 2, borderRadius: 18, backgroundColor: '#ffffff', padding: 14, fontSize: 16, color: '#0f172a', marginBottom: 14 },
	reasonInputCompact: { minHeight: 96, borderRadius: 14, padding: 10, fontSize: 14 },
	selectionActions: { flexDirection: 'row', gap: 12, width: '100%' },
	selectionActionsStacked: { flexDirection: 'column' },
	selectionActionCompact: { width: '100%' },
	saveButton: { flex: 1, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
	cancelButton: { flex: 1, borderRadius: 999, paddingVertical: 14, alignItems: 'center', backgroundColor: '#ef4444' },
	actionButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
	loadingCard: { alignItems: 'center', paddingVertical: 28 },
	loadingText: { marginTop: 10, color: '#64748b', fontWeight: '600' },
	chartWrap: { backgroundColor: '#ffffff', borderRadius: 24, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
	sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
	chartHint: { marginTop: 6, fontSize: 12, color: '#64748b' },
	statsCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
	statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
	totalBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#eef2ff' },
	totalBadgeText: { color: '#4f46e5', fontWeight: '700', fontSize: 12 },
	periodBadge: { alignSelf: 'flex-start', marginBottom: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#eef2ff' },
	periodBadgeText: { color: '#312e81', fontWeight: '700', fontSize: 12 },
	insightCard: { borderRadius: 16, backgroundColor: '#f8fafc', padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0' },
	insightLabel: { color: '#64748b', fontSize: 12, textTransform: 'uppercase', fontWeight: '700', marginBottom: 4 },
	insightValue: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
	summaryStrip: { flexDirection: 'row', gap: 12, marginBottom: 16 },
	summaryItem: { flex: 1, borderRadius: 16, backgroundColor: '#f8fafc', padding: 12, alignItems: 'center' },
	summaryLabel: { color: '#64748b', fontSize: 12, marginBottom: 4, textTransform: 'uppercase', fontWeight: '700' },
	summaryValue: { fontSize: 22, fontWeight: '800' },
	summaryPercent: { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginTop: 2 },
	subcategoryStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
	subcategoryBadge: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
	subcategoryBadgeLabel: { color: '#475569', fontSize: 12, fontWeight: '700' },
	subcategoryBadgeValue: { color: '#6366f1', fontSize: 12, fontWeight: '800' },
	statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
	statMoodCard: { width: '31%', minWidth: 95, borderRadius: 16, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' },
	statMoodCardCompact: { width: '48%', minWidth: 0 },
	statMoodCardVeryCompact: { width: '100%' },
	statMoodEmoji: { fontSize: 22, marginBottom: 4 },
	statMoodName: { fontSize: 12, color: '#334155', fontWeight: '700', textAlign: 'center', marginBottom: 4 },
	statMoodCount: { fontSize: 20, fontWeight: '800' },
	statMoodPercent: { fontSize: 11, color: '#94a3b8' },
	historyCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#e2e8f0' },
	historyHeader: { marginBottom: 16 },
	historyTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
	filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
	filterChip: { borderRadius: 999, backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 8 },
	filterChipActive: { backgroundColor: '#6366f1' },
	filterChipText: { color: '#64748b', fontWeight: '700' },
	filterChipTextActive: { color: '#ffffff' },
	emptyState: { alignItems: 'center', paddingVertical: 48 },
	emptyEmoji: { fontSize: 52, marginBottom: 10 },
	emptyTitle: { fontSize: 20, fontWeight: '800', color: '#475569', marginBottom: 6 },
	emptyText: { color: '#94a3b8', textAlign: 'center' },
	historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 10 },
	historyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
	historyMoodBubble: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
	historyMoodEmoji: { fontSize: 22 },
	historyContent: { flex: 1 },
	historyTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
	historyTopRowCompact: { flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
	historyMoodName: { fontSize: 17, fontWeight: '800', flex: 1 },
	historyTime: { fontSize: 11, color: '#64748b', backgroundColor: '#ffffff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
	historyTimeCompact: { alignSelf: 'flex-start' },
	historyReason: { fontSize: 14, color: '#475569', fontStyle: 'italic', marginBottom: 4 },
	historyDate: { fontSize: 12, color: '#94a3b8' },
	removeButton: { padding: 6, marginLeft: 12 },
	historyActions: { marginTop: 12, gap: 10 },
	exportButton: { borderRadius: 999, backgroundColor: '#2563eb', paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
	exportButtonText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
	clearButton: { borderRadius: 999, backgroundColor: '#ef4444', paddingVertical: 14, alignItems: 'center' },
	clearButtonText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
})
