export const siteConfig = {
  name: 'Golf Heroes',
  description:
    'Play golf. Support charity. Win prizes. Every round becomes something meaningful.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',

  charity: {
    minimumContributionPercent: 10,   // PRD §08
    maximumContributionPercent: 100,
  },

  scores: {
    maxStored: 5,        // PRD §05 — rolling window
    minStableford: 1,
    maxStableford: 45,
  },

  draw: {
    poolDistribution: {  // PRD §07
      fiveMatch:   0.40, // Jackpot — rolls over if unclaimed
      fourMatch:   0.35,
      threeMatch:  0.25,
    },
    cadence: 'monthly',
    jackpotRollsOver: true,
  },
} as const
