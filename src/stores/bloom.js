import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '@/services/api'
import sortBy from 'lodash/sortBy'

// ==========================================
// 1. PURE MATH & UTILITIES (From bloomlib.js)
// ==========================================

// Generates the stats needed for sorting (most reviews, newest, oldest)
function calculateInteractionStats(categories) {
  const taxoStats = {}; 
  if (!categories) return taxoStats;

  categories.forEach((category) => {
    category.topics.forEach((topic) => {
      topic.issues.forEach((issue) => {
        const interactionCount = issue.interactions?.length || 0;
        
        let latestMs = 0;
        let oldestMs = Date.now();
        let upvoteCount = 0;

        if (issue.interactions) {
          issue.interactions.forEach(interaction => {
            const timestamp = new Date(interaction.updatedAtSource || interaction.createdAt).getTime();
            if (timestamp > latestMs) latestMs = timestamp;
            if (timestamp < oldestMs) oldestMs = timestamp;
            
            if (interaction.reactions) {
              const upvote = interaction.reactions.find(r => r.type === 'upvote');
              if (upvote) upvoteCount += upvote.count;
            }
          });
        }

        const now = Date.now();
        taxoStats[issue.taxo] = {
          interactionCount,
          upvoteCount,
          latestInteractionMsAgo: latestMs ? now - latestMs : 999999999999,
          oldestInteractionMsAgo: oldestMs !== now ? now - oldestMs : 0
        };
      });
    });
  });
  return taxoStats;
}

// ==========================================
// 2. THE PINIA STORE
// ==========================================
export const useBloomStore = defineStore('bloom', () => {
  
  // --- STATE ---
  const currentBloom = ref(null)
  const offeringContext = ref(null)
  const themes = ref([])
  const countryReviewStats = ref(null)
  const sourcesWithVersion = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // --- GETTERS ---
  
  // 1. Flattened Issues Array with injected Category/Topic data
  const allIssues = computed(() => {
    if (!currentBloom.value || !currentBloom.value.categories) return []
    let issues = []
    currentBloom.value.categories.forEach(category => {
      category.topics.forEach(topic => {
        topic.issues.forEach(issue => {
          issues.push({ ...issue, topicTitle: topic.title, categoryTitle: category.title })
        })
      })
    })
    return issues
  })

  // 2. Joy Score Engine (Now powered 100% by backend payload!)
  const joyStats = computed(() => {
    if (!currentBloom.value || !currentBloom.value.joyStats) return null;
    return currentBloom.value.joyStats;
  })

  // 3. Taxonomy Stats (for sorting)
  const taxoStats = computed(() => {
    return calculateInteractionStats(currentBloom.value?.categories);
  })

  // 4. The Master Filter & Sort Getter (Consumes URL Queries!)
  const getFilteredAndSortedIssues = computed(() => {
    return (query) => {
      let result = [...allIssues.value];
      const stats = taxoStats.value;

      // Filter: Search Query (Local regex search stays intact!)
      if (query.search) {
        const lowerSearch = query.search.toLowerCase();
        result = result.filter(issue => {
          const inTitle = issue.title?.toLowerCase().includes(lowerSearch);
          const inSummary = issue.description?.summary?.toLowerCase().includes(lowerSearch);
          const inEntries = issue.description?.entries?.some(e => e.toLowerCase().includes(lowerSearch));
          const inTaxo = issue.topicTitle?.toLowerCase().includes(lowerSearch) || issue.categoryTitle?.toLowerCase().includes(lowerSearch);
          return inTitle || inSummary || inEntries || inTaxo;
        });
      }

      // Filter: Taxonomy
      if (query.taxo) {
        const searchTaxo = query.taxo.replaceAll('-', ':');
        result = result.filter(issue => issue.taxo.startsWith(searchTaxo));
      }

      // Filter: Theme
      if (query.theme && query.theme !== 'all') {
        result = result.filter(issue => issue.themes?.some(t => t.themeId === query.theme));
      }

      // Sort
      const sortType = query.sort || 'most-reviews';
      
      // Map stats into the issues temporarily for sorting
      let sortableIssues = result.map(issue => ({
        ...issue,
        ...stats[issue.taxo]
      }));

      if (sortType === 'most-reviews') sortableIssues = sortBy(sortableIssues, 'interactionCount').reverse();
      if (sortType === 'least-reviews') sortableIssues = sortBy(sortableIssues, 'interactionCount');
      if (sortType === 'most-upvoted') sortableIssues = sortBy(sortableIssues, 'upvoteCount').reverse();
      if (sortType === 'least-upvoted') sortableIssues = sortBy(sortableIssues, 'upvoteCount');
      if (sortType === 'newest-reviews') sortableIssues = sortBy(sortableIssues, 'latestInteractionMsAgo');
      if (sortType === 'oldest-reviews') sortableIssues = sortBy(sortableIssues, 'oldestInteractionMsAgo').reverse();

      return sortableIssues;
    }
  })

  // --- ACTIONS ---
  async function loadDashboardData(payload) {
    isLoading.value = true
    error.value = null
    try {
      const corePayload = {
        orgId: payload.orgId,
        bloomKey: payload.bloomKey,
        bloomType: payload.bloomType,
        offeringXid: payload.offeringXid,
        offeringType: payload.offeringType || 'app'
      }

      // For the dashboard, we fetch the core data simultaneously
      const [bloomRes, contextRes, themesRes, countryRes, sourceRes] = await Promise.all([
        api.getBloom(corePayload), // Dashboard needs all issues to calculate aggregate RICE
        api.getAppOffering(corePayload),
        api.getAllThemes(corePayload),
        api.getBloomCountryReviewStats(corePayload),
        api.getBloomSourcesWithVersion(corePayload)
      ])
      
      currentBloom.value = bloomRes
      offeringContext.value = contextRes
      themes.value = themesRes
      countryReviewStats.value = countryRes
      sourcesWithVersion.value = sourceRes
    } catch (err) {
      console.error(err)
      error.value = "Failed to load Dashboard data."
    } finally {
      isLoading.value = false
    }
  }

  async function loadReportData(payload) {
    isLoading.value = true
    error.value = null
    try {
      // 1. Extract filters safely, separate from base parameters
      const { filters = {}, ...basePayload } = payload

      // 2. Create the core params payload for auxiliary API calls.
      // We explicitly DO NOT pass filters here so dropdown data remains fully populated.
      const corePayload = {
        orgId: basePayload.orgId,
        bloomKey: basePayload.bloomKey,
        bloomType: basePayload.bloomType,
        offeringXid: basePayload.offeringXid,
        offeringType: 'app'
      }

      // 3. Construct the specific payload for the main Bloom report, injecting active filters
      const bloomApiPayload = {
        ...corePayload,
        // Only append filters if they are actively selected and not 'all'
        country: filters.country && filters.country !== 'all' ? filters.country : undefined,
        srcId: filters.srcId && filters.srcId !== 'all' ? filters.srcId : undefined,
        theme: filters.theme && filters.theme !== 'all' ? filters.theme : undefined,
        
        // FIX: Map the frontend 'class' filter to the backend 'issueClass' parameter
        issueClass: filters.class && filters.class !== 'all' ? filters.class : undefined
      }

      // 4. Execute all 5 calls simultaneously 
      const [bloomRes, contextRes, themesRes, countryRes, sourceRes] = await Promise.all([
        api.getBloom(bloomApiPayload),               // Fetches the filtered issues
        api.getAppOffering(corePayload),             // Uses core payload
        api.getAllThemes(corePayload),               // Uses core payload
        api.getBloomCountryReviewStats(corePayload), // Uses core payload
        api.getBloomSourcesWithVersion(corePayload)  // Uses core payload
      ])
      
      currentBloom.value = bloomRes
      offeringContext.value = contextRes
      themes.value = themesRes
      countryReviewStats.value = countryRes      // <-- Saved to state
      sourcesWithVersion.value = sourceRes       // <-- Saved to state
    } catch (err) {
      console.error(err)
      error.value = "Failed to load Bloom data."
    } finally {
      isLoading.value = false
    }
  }

  // Available Blooms
  const availableBloomsDirectory = ref({})

  // Add this action
  async function loadAvailableBlooms() {
    try {
      const res = await api.getAvailableBlooms()
      availableBloomsDirectory.value = res?.data?.value || res?.value || res || {}
    } catch (e) {
      console.error("Failed to load bloom directory", e)
    }
  }  

  return { 
    currentBloom, offeringContext, themes, countryReviewStats, 
    sourcesWithVersion, isLoading, error, allIssues, joyStats, 
    taxoStats, getFilteredAndSortedIssues,loadReportData, 
    loadDashboardData, availableBloomsDirectory,loadAvailableBlooms
  }
})