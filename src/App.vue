<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { STAKE_OPTIONS, stakeRank, type StakeKey } from './stakes'

const STORAGE_KEY = 'balatro-joker-stakes'

// Load joker images (folder is "All Balatro Jokers")
const jokerGlob = import.meta.glob<{ default: string }>(
  './assets/All Balatro Jokers/*.webp',
  { eager: true, query: '?url', import: 'default' }
)
const jokerEntries = Object.entries(jokerGlob).map(([path, mod]) => {
  const name = path.replace(/^.*\/(.+)$/, '$1')
  const url = typeof mod === 'string' ? mod : (mod as { default: string }).default
  return { id: name, url }
})

// Load stake images and map by name
const stakeGlob = import.meta.glob<{ default: string }>(
  './assets/All Stakes/*.webp',
  { eager: true, query: '?url', import: 'default' }
)
const stakeUrls: Record<string, string> = {}
for (const [path, mod] of Object.entries(stakeGlob)) {
  const url = typeof mod === 'string' ? mod : (mod as { default: string }).default
  const match = path.match(/\/(\w+)_stake\.webp$/)
  const key = match?.[1]
  if (key) stakeUrls[key] = url
}

// Map old percent-encoded filenames to decoded (so renames don't lose saved selections)
const LEGACY_ID_MAP: Record<string, string> = {
  'Oops%21_All_6s.webp': "Oops!_All_6s.webp",
  "Driver%27s_License.webp": "Driver's_License.webp",
  'S%3Fance.webp': 'S_ance.webp',
}

// Persisted selection: joker id -> stake key ('' for no sticker)
const selections = ref<Record<string, '' | StakeKey>>(
  (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return {}
      const parsed: Record<string, '' | StakeKey> = JSON.parse(raw)
      const out: Record<string, '' | StakeKey> = {}
      for (const [id, stake] of Object.entries(parsed)) {
        const canonicalId = LEGACY_ID_MAP[id] ?? id
        out[canonicalId] = stake
      }
      return out
    } catch (_) {}
    return {}
  })()
)

watch(
  selections,
  (v) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    } catch (_) {}
  },
  { deep: true }
)

function onStakeChange(jokerId: string, e: Event) {
  const value = (e.target as HTMLSelectElement).value
  const stake: '' | StakeKey = value === '' ? '' : (value as StakeKey)
  selections.value = { ...selections.value, [jokerId]: stake }
}

const sortedJokers = computed(() => {
  return [...jokerEntries].sort((a, b) => {
    const rA = stakeRank(selections.value[a.id] ?? '')
    const rB = stakeRank(selections.value[b.id] ?? '')
    return rB - rA
  })
})

const searchQuery = ref('')

const filteredJokers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return sortedJokers.value
  return sortedJokers.value.filter((j) => {
    const name = j.id.replace(/\.webp$/, '').replace(/_/g, ' ')
    return name.toLowerCase().includes(q) || j.id.toLowerCase().includes(q)
  })
})

function getStakeUrl(stake: '' | StakeKey | undefined): string {
  return stake ? (stakeUrls[stake] ?? '') : ''
}
</script>

<template>
  <div class="app">
    <h1>Balatro Joker Stakes</h1>
    <p class="subtitle">Pick the stake you've achieved for each joker. List is sorted highest stake first.</p>
    <div class="search-wrap">
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search jokers..."
        class="search-input"
        aria-label="Search jokers"
      />
    </div>
    <div class="grid">
      <div
        v-for="joker in filteredJokers"
        :key="joker.id"
        class="card"
      >
        <img :src="joker.url" :alt="joker.id" class="joker-img" />
        <select
          :value="selections[joker.id] ?? ''"
          @change="onStakeChange(joker.id, $event)"
          class="stake-select"
        >
          <option
            v-for="opt in STAKE_OPTIONS"
            :key="opt.value || 'none'"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
        <img
          v-if="selections[joker.id]"
          :src="getStakeUrl(selections[joker.id])"
          :alt="selections[joker.id]"
          class="stake-img"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
}

.subtitle {
  margin: 0 0 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
}

.search-wrap {
  width: 100%;
  margin-bottom: 1.25rem;
}

.search-input {
  width: 100%;
  max-width: 320px;
  padding: 0.6rem 1rem;
  padding-left: 2.25rem;
  font-size: 1rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.search-input:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

.search-input:focus {
  outline: none;
  border-color: rgba(100, 108, 255, 0.6);
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.2);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
  justify-items: center;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.joker-img {
  width: 100%;
  max-width: 120px;
  height: auto;
  border-radius: 8px;
  display: block;
}

.stake-select {
  width: 100%;
  max-width: 120px;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: inherit;
  cursor: pointer;
}

.stake-img {
  height: 28px;
  width: auto;
  object-fit: contain;
  display: block;
}
</style>
