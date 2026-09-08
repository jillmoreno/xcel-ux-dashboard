// Curated Unsplash photo IDs grouped by topic. Used to give each course
// card a topic-relevant hero image instead of cycling through the 10
// local /courses/*.webp stock pool (which produced obvious repetition
// across the dashboard's recommended shelves).
//
// All IDs were verified live (200 + image/jpeg) on 2026-05-21.
// License: Unsplash License — free for commercial + non-commercial use,
// no attribution required. https://unsplash.com/license
//
// If a photo ever 404s in the wild, `SimpleCard` falls back to its
// tinted-block + faded background-icon treatment — nothing breaks.

const TOPIC_POOL = {
  // Real estate — residential / interiors
  'realestate-residential': [
    '1564013799919-ab600027ffc6',
    '1570129477492-45c003edd2be',
    '1568605114967-8130f3a36994',
  ],
  // Real estate — contracts / signing / closing paperwork
  'realestate-contract': [
    '1554224155-6726b3ff858f',
    '1554224154-26032ffc0d07',
    '1521791136064-7986c2920216',
  ],
  // Real estate — appraisal / inspection / measurement
  'realestate-appraisal': [
    '1503387762-592deb58ef4e',
    '1581094794329-c8112a89af12',
    '1558618666-fcd25c85cd64',
  ],
  // Foreclosure / distressed / for-sale signs
  foreclosure: [
    '1560518883-ce09059eeffa',
    '1582407947304-fd86f028f716',
    '1558036117-15d82a90b9b1',
  ],
  // Fair housing / diverse community
  'fair-housing': [
    '1529390079861-591de354faf5',
    '1582213782179-e0d53f98f2ca',
    '1542596594-649edbc13630',
  ],
  // Real estate agents / open house / millennial professionals
  'realestate-agents': [
    '1556761175-5973dc0f32e7',
    '1573497019940-1c28c88b4f3e',
    '1551836022-deb4988cc6c0',
  ],
  // Ethics / law / gavel
  'ethics-law': [
    '1589994965851-a8f479c573a9',
    '1505664194779-8beaceb93744',
    '1589829545856-d10d557cf95f',
  ],
  // Generic office / paperwork / business
  'office-work': [
    '1542744173-8e7e53415bb0',
    '1557804506-669a67965ba0',
    '1454165804606-c3d57bc86b40',
  ],
  // Nursing
  nursing: [
    '1576091160399-112ba8d25d1d',
    '1584516150909-c43483ee7932',
    '1612349317150-e413f6a5b16d',
  ],
  // Pharmacy / medication
  pharmacy: [
    '1584308666744-24d5c474f2ae',
    '1471864190281-a93a3070b6de',
    '1587854692152-cbe660dbde88',
  ],
  // Medical safety / hospital
  'medical-safety': [
    '1538108149393-fbbd81895907',
    '1551601651-2a8555f1a136',
    '1505751172876-fa1923c5c528',
  ],
  // Mental health / wellness
  'mental-health': [
    '1506126613408-eca07ce68773',
    '1545205597-3d9d02c29597',
    '1518609878373-06d740f60d8b',
  ],
  // Stocks / trading / securities
  'finance-stocks': [
    '1611974789855-9c2a0a7236a3',
    '1590283603385-17ffb3a7f29f',
    '1554260570-e9689a3418b8',
  ],
  // Investing / charts / market data
  'investing-charts': [
    '1551288049-bebda4e38f71',
    '1543286386-713bdd548da4',
    '1535320903710-d993d3d77d29',
  ],
  // Insurance / financial advisor
  'insurance-advisor': [
    '1450101499163-c8848c66ca85',
    '1573496359142-b8d87734a5a2',
    '1521737604893-d14cc237f11d',
  ],
  // Podcast / microphone / audio
  podcast: [
    '1478737270239-2f02b77fc618',
    '1590602847861-f357a9332bbc',
    '1505236858219-8359eb29e329',
  ],
  // Books / study / education
  'books-study': [
    '1481627834876-b7833e8f5570',
    '1456513080510-7bf3a84b82f8',
    '1532153975070-2e9ab71f1b14',
  ],
  // Construction / building / architecture
  construction: [
    '1541888946425-d81bb19240f5',
    '1488972685288-c3fd157d7c7a',
    '1494522358652-f30e61a60313',
  ],
  // Rural property / countryside
  rural: [
    '1500382017468-9049fed747ef',
    '1500076656116-558758c991c1',
    '1464822759023-fed622ff2c3b',
  ],
  // City / urban housing
  'city-urban': [
    '1480714378408-67cf0d13bc1b',
    '1449034446853-66c86144b0ad',
    '1492144534655-ae79c964c9d7',
  ],
} as const

type TopicKey = keyof typeof TOPIC_POOL

/**
 * Maps the per-fixture `imageQuery` strings (already authored on each
 * `IndividualCourse`) to a topic-pool key. New imageQuery values added in
 * fixtures should also be added here; unmapped queries fall back to the
 * local `/courses/N.webp` pool so the card never renders empty.
 *
 * Note: a few queries appear in more than one brand with different intent
 * (e.g. CRE "safety" = open-house safety vs. Elite "medical-safety" =
 * patient safety). Where the queries differ string-by-string, both entries
 * can live here side by side.
 */
const QUERY_TO_TOPIC: Record<string, TopicKey> = {
  // CRE — real estate CE
  agency: 'realestate-contract',
  appraisal: 'realestate-appraisal',
  broker: 'realestate-agents',
  checklist: 'office-work',
  contract: 'realestate-contract',
  distressed: 'foreclosure',
  ethics: 'ethics-law',
  fairhousing: 'fair-housing',
  foreclosure: 'foreclosure',
  georgia: 'realestate-residential',
  house: 'realestate-residential',
  housing: 'realestate-residential',
  listing: 'realestate-agents',
  millennials: 'realestate-agents',
  safety: 'realestate-agents', // CRE: open-house safety

  // McKissock — appraisal CE
  'appraisal-report': 'realestate-appraisal',
  comps: 'investing-charts',
  'fair-housing': 'fair-housing',
  fha: 'office-work',
  'income-approach': 'investing-charts',
  'manufactured-home': 'construction',
  'podcast-appraisal': 'podcast',
  'rural-property': 'rural',
  supervisor: 'office-work',
  uad: 'office-work',
  uspap: 'realestate-appraisal',

  // Elite — nursing CE
  awareness: 'mental-health',
  compliance: 'medical-safety',
  'critical-care': 'medical-safety',
  handoff: 'nursing',
  'mental-health': 'mental-health',
  pain: 'medical-safety',
  'pain-management': 'medical-safety',
  palliative: 'mental-health',
  pediatrics: 'nursing',
  pharmacology: 'pharmacy',
  'medical-safety': 'medical-safety',
  sepsis: 'nursing',

  // STC — securities exam prep
  adviser: 'insurance-advisor',
  'ethics-sec': 'ethics-law',
  insurance: 'insurance-advisor',
  'investment-banking': 'city-urban',
  options: 'finance-stocks',
  'podcast-prep': 'podcast',
  principal: 'finance-stocks',
  'series-7': 'finance-stocks',
  'sie-exam': 'books-study',
  'state-law': 'ethics-law',
  'uniform-law': 'ethics-law',
  vocab: 'books-study',
}

const UNSPLASH_BASE = 'https://images.unsplash.com/photo-'
// 600×600 covers the 172px desktop / 140px mobile recommended-card cells
// at 2× density without delivering oversized assets. `fit=crop&q=80`
// keeps the file size reasonable on slower connections.
const UNSPLASH_PARAMS = 'w=600&h=600&fit=crop&q=80'

const FLAT_POOL: readonly string[] = (Object.keys(TOPIC_POOL) as TopicKey[]).flatMap(
  (k) => TOPIC_POOL[k],
)

function urlFor(photoId: string): string {
  return `${UNSPLASH_BASE}${photoId}?${UNSPLASH_PARAMS}`
}

/* -------------------------------------------------------------------------
 * Per-call image picker.
 *
 * `createImagePicker()` returns a fresh closure each time it's called.
 * The closure owns its own `used` set + topic / flat cursors, so:
 *
 *   - Each catalog file calls it once at module load and uses the
 *     returned picker for every `IndividualCourse` + `Series` entry in
 *     that file. No two cards in the same brand share an image.
 *   - `myCoursesFor(brand)` calls it once per invocation — the records
 *     are mapped in fixed order so the output is deterministic across
 *     renders.
 *
 * Crucially the state is **not** stored at module scope, which means
 * Vite HMR (or any other path that re-evaluates a catalog file) gets a
 * brand-new picker with an empty `used` set. The previous
 * `BRAND_STATE`-Map design quietly broke under HMR: the old run's used
 * IDs persisted, the new run found every slot consumed, and every card
 * fell through to the `FLAT_POOL[0]` wrap-around — i.e. the entire panel
 * rendered with one image.
 *
 * Each picker call:
 *   1. Tries the next unused slot in the course's topic pool.
 *   2. Falls back to the next unused slot in `FLAT_POOL` (so even if a
 *      topic is exhausted, the brand still gets a unique image —
 *      topically related where possible, distinct always).
 * ----------------------------------------------------------------------- */

export type ImagePicker = (query: string | undefined) => string

export function createImagePicker(): ImagePicker {
  const used = new Set<string>()
  const topicCursor = new Map<TopicKey, number>()
  let flatCursor = 0

  return function pick(query: string | undefined): string {
    // 1. Try the course's topic pool first.
    if (query) {
      const topic = QUERY_TO_TOPIC[query]
      if (topic) {
        const pool = TOPIC_POOL[topic]
        if (pool) {
          const startIdx = topicCursor.get(topic) ?? 0
          for (let i = 0; i < pool.length; i++) {
            const slot = (startIdx + i) % pool.length
            const id = pool[slot]
            if (!used.has(id)) {
              used.add(id)
              topicCursor.set(topic, slot + 1)
              return urlFor(id)
            }
          }
        }
      }
    }

    // 2. Topic exhausted (or no topic) — pull the next unused photo from
    //    the flat pool across every topic. Walks the cursor forward each
    //    call so distinct courses always get distinct images.
    while (flatCursor < FLAT_POOL.length) {
      const id = FLAT_POOL[flatCursor++]
      if (!used.has(id)) {
        used.add(id)
        return urlFor(id)
      }
    }

    // 3. Truly exhausted (consumer has more cards than the entire pool —
    //    shouldn't happen with 60 photos). Wrap to the start so something
    //    still renders.
    return urlFor(FLAT_POOL[0])
  }
}

export type { TopicKey }
