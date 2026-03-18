import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	useWindowDimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const ICONS = [
	{ icon: '🐰', name: 'bunny', color: '#ffb6c1' },
	{ icon: '🐻', name: 'bear', color: '#8b4513' },
	{ icon: '🦊', name: 'fox', color: '#ff6b35' },
	{ icon: '🐼', name: 'panda', color: '#2e2e2e' },
	{ icon: '🐱', name: 'cat', color: '#f59e0b' },
	{ icon: '🐶', name: 'dog', color: '#d97706' },
	{ icon: '🐵', name: 'monkey', color: '#92400e' },
	{ icon: '🐸', name: 'frog', color: '#22c55e' },
	{ icon: '🐯', name: 'tiger', color: '#ef4444' },
	{ icon: '🐹', name: 'hamster', color: '#c08457' },
]

const QUOTES = [
	"You're pawsome! Keep going!",
	'Cuteness overload! You are amazing!',
	'Wow! You have the heart of a panda!',
	'You are as clever as a fox! Keep it up!',
	'Great job! You are on fire!',
	'Purrfect match! You are on a roll!',
	'You are hopping to success!',
	'Bear-y good job!',
]

const LEVEL_EMOJIS = ['🌱', '🌿', '🍃', '🌳', '🌟']

const shuffleCards = cards => [...cards].sort(() => Math.random() - 0.5)

const generateCards = level => {
	const numPairs = 2 + (level - 1) * 2
	const selectedIcons = ICONS.slice(0, numPairs)

	return shuffleCards(
		[...selectedIcons, ...selectedIcons].map((content, index) => ({
			id: `${level}-${index + 1}`,
			content,
			matched: false,
			flipped: false,
		})),
	)
}

function StatCard({ label, value, accent }) {
	return (
		<View style={styles.statCard}>
			<Text style={styles.statLabel}>{label}</Text>
			<Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text>
		</View>
	)
}

function MemoryCard({ card, size, disabled, onPress }) {
	const revealed = card.flipped || card.matched

	return (
		<Pressable
			disabled={card.matched || disabled}
			onPress={() => onPress(card)}
			style={[
				styles.card,
				{
					width: size,
					height: size,
					backgroundColor: card.matched
						? `${card.content.color}22`
						: revealed
							? card.content.color
							: '#4f46e5',
					borderColor: card.matched ? '#facc15' : 'transparent',
					opacity: disabled && !revealed ? 0.65 : 1,
				},
			]}
		>
			<Text style={[styles.cardFace, revealed ? styles.cardFaceLarge : null]}>
				{revealed ? card.content.icon : '❓'}
			</Text>
			{card.matched ? <Text style={styles.matchSpark}>✨</Text> : null}
		</Pressable>
	)
}

export default function ClipCardGame({ navigation }) {
	const { width } = useWindowDimensions()
	const mismatchTimeoutRef = useRef(null)

	const [level, setLevel] = useState(1)
	const [cards, setCards] = useState(() => generateCards(1))
	const [selectedCards, setSelectedCards] = useState([])
	const [gameStatus, setGameStatus] = useState('playing')
	const [motivationQuote, setMotivationQuote] = useState('')
	const [moves, setMoves] = useState(0)
	const [score, setScore] = useState(0)
	const [timeLeft, setTimeLeft] = useState(60)
	const [isTimerActive, setIsTimerActive] = useState(false)
	const [isChecking, setIsChecking] = useState(false)

	useEffect(() => {
		return () => {
			if (mismatchTimeoutRef.current) {
				clearTimeout(mismatchTimeoutRef.current)
			}
		}
	}, [])

	useEffect(() => {
		if (selectedCards.length !== 2) {
			return
		}

		const [first, second] = selectedCards
		setIsChecking(true)
		setMoves(previous => previous + 1)

		if (first.content.icon === second.content.icon) {
			setCards(previousCards =>
				previousCards.map(card =>
					card.content.icon === first.content.icon ? { ...card, matched: true } : card,
				),
			)
			setScore(previous => previous + 10 * level)
			setSelectedCards([])
			setIsChecking(false)
			return
		}

		mismatchTimeoutRef.current = setTimeout(() => {
			setCards(previousCards =>
				previousCards.map(card =>
					card.id === first.id || card.id === second.id
						? { ...card, flipped: false }
						: card,
				),
			)
			setSelectedCards([])
			setIsChecking(false)
		}, 800)

		return () => {
			if (mismatchTimeoutRef.current) {
				clearTimeout(mismatchTimeoutRef.current)
			}
		}
	}, [selectedCards, level])

	useEffect(() => {
		if (cards.length > 0 && cards.every(card => card.matched)) {
			setGameStatus('won')
			setMotivationQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
			setIsTimerActive(false)
			setScore(previous => previous + timeLeft * 5)
		}
	}, [cards, timeLeft])

	useEffect(() => {
		if (!isTimerActive || gameStatus !== 'playing') {
			return
		}

		const timer = setInterval(() => {
			setTimeLeft(previous => {
				if (previous <= 1) {
					clearInterval(timer)
					setGameStatus('lost')
					setIsTimerActive(false)
					return 0
				}

				return previous - 1
			})
		}, 1000)

		return () => clearInterval(timer)
	}, [gameStatus, isTimerActive])

	const cardSize = useMemo(() => {
		const availableWidth = Math.min(width - 56, 420)
		const computed = Math.floor((availableWidth - 24) / 4)
		return Math.max(66, computed)
	}, [width])

	const matchedCount = cards.filter(card => card.matched).length
	const progress = cards.length ? Math.round((matchedCount / cards.length) * 100) : 0
	const levelEmoji = LEVEL_EMOJIS[level - 1] || '🎯'

	const handleCardPress = card => {
		if (
			gameStatus !== 'playing' ||
			isChecking ||
			selectedCards.length >= 2 ||
			card.flipped ||
			card.matched
		) {
			return
		}

		if (!isTimerActive) {
			setIsTimerActive(true)
		}

		setCards(previousCards =>
			previousCards.map(current =>
				current.id === card.id ? { ...current, flipped: true } : current,
			),
		)

		setSelectedCards(previous => [...previous, card])
	}

	const startLevel = nextLevel => {
		setLevel(nextLevel)
		setCards(generateCards(nextLevel))
		setSelectedCards([])
		setGameStatus('playing')
		setMotivationQuote('')
		setMoves(0)
		setTimeLeft(60 + (nextLevel - 1) * 10)
		setIsTimerActive(false)
		setIsChecking(false)
	}

	const handleNextLevel = () => {
		if (level < 5) {
			startLevel(level + 1)
			return
		}

		handleResetGame()
	}

	const handleResetGame = () => {
		setScore(0)
		startLevel(1)
	}

	return (
		<ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
			<View style={styles.backgroundOrbTop} />
			<View style={styles.backgroundOrbBottom} />

			<View style={styles.container}>
				<View style={styles.headerRow}>
					<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
						<Ionicons name="arrow-back" size={22} color="#0f172a" />
					</TouchableOpacity>

					<View style={styles.headerTextWrap}>
						<Text style={styles.headerTitle}>Clip Card Game</Text>
						<Text style={styles.headerSubtitle}>Match the animal pairs before time runs out.</Text>
					</View>
				</View>

				<View style={styles.statsGrid}>
					<StatCard label="Level" value={`${level} ${levelEmoji}`} accent="#f97316" />
					<StatCard label="Score" value={score} accent="#0f766e" />
					<StatCard label="Moves" value={moves} accent="#7c3aed" />
					<StatCard label="Time" value={`${timeLeft}s`} accent={timeLeft < 10 ? '#dc2626' : '#1d4ed8'} />
				</View>

				<View style={styles.progressWrap}>
					<View style={styles.progressBarTrack}>
						<View style={[styles.progressBarFill, { width: `${progress}%` }]} />
					</View>
					<Text style={styles.progressText}>{matchedCount}/{cards.length} cards matched</Text>
				</View>

				<View style={styles.sectionCard}>
					<Text style={styles.sectionTitle}>Level {level}</Text>
					<Text style={styles.sectionHint}>Tap cards to reveal and match the cute animals.</Text>

					{gameStatus === 'playing' ? (
						<>
							<View style={styles.cardsGrid}>
								{cards.map(card => (
									<MemoryCard
										key={card.id}
										card={card}
										size={cardSize}
										disabled={isChecking}
										onPress={handleCardPress}
									/>
								))}
							</View>

							<View style={styles.tipCard}>
								<Text style={styles.tipIcon}>💡</Text>
								<Text style={styles.tipText}>Match pairs of animals to earn points and unlock the next level.</Text>
							</View>
						</>
					) : (
						<View style={styles.resultCard}>
							<Text style={styles.resultEmoji}>{gameStatus === 'won' ? '🏆' : '⏰'}</Text>
							<Text style={styles.resultTitle}>
								{gameStatus === 'won' ? 'Round cleared' : 'Time is up'}
							</Text>
							<Text style={styles.resultMessage}>
								{gameStatus === 'won'
									? motivationQuote
									: 'Try again and focus on remembering the animal positions.'}
							</Text>
							<Text style={styles.finalScore}>Final score: {score}</Text>
							<Text style={styles.finalMoves}>Moves: {moves}</Text>

							<TouchableOpacity style={styles.primaryButton} onPress={gameStatus === 'won' ? handleNextLevel : handleResetGame}>
								<Text style={styles.primaryButtonText}>
									{gameStatus === 'won'
										? level < 5
											? 'Next Level'
											: 'Play Again'
										: 'Restart'}
								</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: '#eef4ff',
	},
	contentContainer: {
		padding: 20,
		paddingTop: 56,
		paddingBottom: 32,
	},
	backgroundOrbTop: {
		position: 'absolute',
		top: 40,
		left: -30,
		width: 180,
		height: 180,
		borderRadius: 90,
		backgroundColor: 'rgba(191, 219, 254, 0.7)',
	},
	backgroundOrbBottom: {
		position: 'absolute',
		right: -40,
		bottom: 100,
		width: 220,
		height: 220,
		borderRadius: 110,
		backgroundColor: 'rgba(233, 213, 255, 0.55)',
	},
	container: {
		maxWidth: 460,
		width: '100%',
		alignSelf: 'center',
		backgroundColor: 'rgba(255,255,255,0.94)',
		borderRadius: 32,
		padding: 20,
		shadowColor: '#0f172a',
		shadowOffset: { width: 0, height: 16 },
		shadowOpacity: 0.12,
		shadowRadius: 24,
		elevation: 8,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},
	backButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: '#ffffff',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 14,
		shadowColor: '#0f172a',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.08,
		shadowRadius: 10,
		elevation: 3,
	},
	headerTextWrap: {
		flex: 1,
	},
	headerTitle: {
		fontSize: 28,
		fontWeight: '800',
		color: '#4338ca',
	},
	headerSubtitle: {
		fontSize: 14,
		lineHeight: 20,
		color: '#64748b',
		marginTop: 4,
	},
	statsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginBottom: 20,
	},
	statCard: {
		width: '48%',
		backgroundColor: '#f8fafc',
		borderRadius: 20,
		paddingVertical: 14,
		paddingHorizontal: 12,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: '#e2e8f0',
	},
	statLabel: {
		fontSize: 13,
		color: '#64748b',
		marginBottom: 6,
	},
	statValue: {
		fontSize: 23,
		fontWeight: '800',
	},
	progressWrap: {
		marginBottom: 20,
	},
	progressBarTrack: {
		width: '100%',
		height: 18,
		borderRadius: 999,
		backgroundColor: '#e2e8f0',
		overflow: 'hidden',
	},
	progressBarFill: {
		height: '100%',
		borderRadius: 999,
		backgroundColor: '#22c55e',
	},
	progressText: {
		marginTop: 8,
		textAlign: 'center',
		fontSize: 13,
		color: '#475569',
		fontWeight: '600',
	},
	sectionCard: {
		backgroundColor: '#fff7ed',
		borderRadius: 28,
		padding: 18,
		borderWidth: 1,
		borderColor: '#fed7aa',
	},
	sectionTitle: {
		textAlign: 'center',
		fontSize: 24,
		fontWeight: '800',
		color: '#ea580c',
	},
	sectionHint: {
		textAlign: 'center',
		color: '#9a3412',
		marginTop: 6,
		marginBottom: 18,
	},
	cardsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		marginHorizontal: -6,
		marginBottom: 18,
	},
	card: {
		margin: 6,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 3,
		shadowColor: '#1e293b',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.12,
		shadowRadius: 12,
		elevation: 5,
		position: 'relative',
	},
	cardFace: {
		fontSize: 24,
		color: '#ffffff',
	},
	cardFaceLarge: {
		fontSize: 34,
	},
	matchSpark: {
		position: 'absolute',
		top: 6,
		right: 8,
		fontSize: 14,
	},
	tipCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(79,70,229,0.08)',
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#c7d2fe',
		padding: 14,
	},
	tipIcon: {
		fontSize: 22,
		marginRight: 10,
	},
	tipText: {
		flex: 1,
		color: '#4338ca',
		fontWeight: '600',
		lineHeight: 20,
	},
	resultCard: {
		alignItems: 'center',
		backgroundColor: '#ffffff',
		borderRadius: 24,
		paddingVertical: 28,
		paddingHorizontal: 20,
	},
	resultEmoji: {
		fontSize: 72,
		marginBottom: 10,
	},
	resultTitle: {
		fontSize: 28,
		fontWeight: '800',
		color: '#0f172a',
		marginBottom: 10,
	},
	resultMessage: {
		textAlign: 'center',
		fontSize: 17,
		color: '#475569',
		lineHeight: 24,
		marginBottom: 14,
	},
	finalScore: {
		fontSize: 24,
		fontWeight: '800',
		color: '#16a34a',
		marginBottom: 8,
	},
	finalMoves: {
		fontSize: 17,
		color: '#64748b',
		marginBottom: 24,
	},
	primaryButton: {
		backgroundColor: '#f97316',
		paddingVertical: 14,
		paddingHorizontal: 26,
		borderRadius: 999,
	},
	primaryButtonText: {
		color: '#ffffff',
		fontSize: 17,
		fontWeight: '800',
	},
})
