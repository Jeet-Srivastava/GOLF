import { siteConfig } from '@/config/site'

/**
 * Draw Engine — handles random and algorithmic draw number generation,
 * match checking, and prize pool calculations.
 */

/** Generate 5 random Stableford scores (1–45) */
export function generateRandomNumbers(): number[] {
  const numbers: number[] = []
  while (numbers.length < 5) {
    const n = Math.floor(Math.random() * 45) + 1
    // Allow duplicates — real golf scores can repeat
    numbers.push(n)
  }
  return numbers.sort((a, b) => a - b)
}

/**
 * Generate algorithmically weighted numbers.
 * Uses frequency data to bias towards most/least common user scores.
 */
export function generateAlgorithmicNumbers(
  allScores: number[],
  bias: 'frequent' | 'infrequent' = 'frequent'
): number[] {
  if (allScores.length === 0) return generateRandomNumbers()

  // Build frequency map
  const freq: Record<number, number> = {}
  allScores.forEach((s) => {
    freq[s] = (freq[s] || 0) + 1
  })

  // Create weighted pool
  const pool: number[] = []
  for (let i = 1; i <= 45; i++) {
    const count = freq[i] || 0
    const weight = bias === 'frequent' ? count + 1 : Math.max(1, allScores.length - count)
    for (let j = 0; j < weight; j++) {
      pool.push(i)
    }
  }

  // Pick 5 from weighted pool
  const result: number[] = []
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool[idx])
  }

  return result.sort((a, b) => a - b)
}

/**
 * Count how many numbers match between user scores and winning numbers.
 * Uses sorted comparison — position matters.
 */
export function countMatches(userNumbers: number[], winningNumbers: number[]): {
  count: number
  matched: number[]
} {
  const userSorted = [...userNumbers].sort((a, b) => a - b)
  const winningSorted = [...winningNumbers].sort((a, b) => a - b)

  const matched: number[] = []
  let ui = 0
  let wi = 0

  while (ui < userSorted.length && wi < winningSorted.length) {
    if (userSorted[ui] === winningSorted[wi]) {
      matched.push(userSorted[ui])
      ui++
      wi++
    } else if (userSorted[ui] < winningSorted[wi]) {
      ui++
    } else {
      wi++
    }
  }

  return { count: matched.length, matched }
}

/**
 * Determine the match type based on count.
 */
export function getMatchType(count: number): 'five_match' | 'four_match' | 'three_match' | null {
  if (count >= 5) return 'five_match'
  if (count === 4) return 'four_match'
  if (count === 3) return 'three_match'
  return null
}

/**
 * Calculate prize pool distribution based on active subscriber count.
 * Each subscriber contributes a fixed portion of their subscription to the pool.
 */
export function calculatePrizePool(
  activeSubscribers: number,
  avgPriceCents: number,
  jackpotRolloverCents: number = 0
) {
  // 50% of subscription goes to prize pool (after charity deduction)
  const poolContributionRate = 0.50
  const totalPoolCents = Math.floor(activeSubscribers * avgPriceCents * poolContributionRate)

  const { poolDistribution } = siteConfig.draw

  return {
    totalPoolCents: totalPoolCents + jackpotRolloverCents,
    fiveMatchPoolCents: Math.floor(totalPoolCents * poolDistribution.fiveMatch) + jackpotRolloverCents,
    fourMatchPoolCents: Math.floor(totalPoolCents * poolDistribution.fourMatch),
    threeMatchPoolCents: Math.floor(totalPoolCents * poolDistribution.threeMatch),
  }
}

/**
 * Calculate individual winner's prize.
 * Prizes are split equally among all winners in the same tier.
 */
export function calculateWinnerPrize(poolCents: number, winnerCount: number): number {
  if (winnerCount === 0) return 0
  return Math.floor(poolCents / winnerCount)
}
