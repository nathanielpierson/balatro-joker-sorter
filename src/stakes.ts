// Stake order: lowest to highest (no sticker is below White)
export const STAKE_ORDER = [
  'White',
  'Red',
  'Green',
  'Black',
  'Blue',
  'Purple',
  'Orange',
  'Gold',
] as const

export type StakeKey = (typeof STAKE_ORDER)[number]

export const STAKE_OPTIONS: { value: '' | StakeKey; label: string }[] = [
  { value: '', label: 'No sticker' },
  ...[...STAKE_ORDER].reverse().map((s) => ({ value: s as StakeKey, label: s })),
]

// Rank for sorting: higher = higher on list. No sticker = 0, Gold = 8.
export function stakeRank(stake: '' | StakeKey): number {
  if (!stake) return 0
  const i = STAKE_ORDER.indexOf(stake)
  return i === -1 ? 0 : i + 1
}
