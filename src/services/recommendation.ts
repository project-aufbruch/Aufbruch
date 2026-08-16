import { NostrEvent } from '../types';

// Key interest topics to track for personalized recommendations
export const POPULAR_CHANNELS = [
  { id: 'all', label: '🔥 All Channels', icon: 'Globe' },
  { id: 'tech', label: '💻 Tech & AI', icon: 'Cpu' },
  { id: 'crypto', label: '⚡ Crypto & Web3', icon: 'Zap' },
  { id: 'news', label: '📰 News & Uncensored', icon: 'ShieldAlert' },
  { id: 'art', label: '🎨 Art & Media', icon: 'Sparkles' },
  { id: 'mesh', label: '📡 Local Mesh P2P', icon: 'Radio' },
];

export const POPULAR_HASHTAGS = [
  '#UncensoredVoice',
  '#PrivacyMatters',
  '#TechNews',
  '#Bitcoin',
  '#Web3',
  '#DigitalFreedom',
  '#MeshNetwork',
  '#OpenSource',
];

const INTEREST_STORAGE_KEY = 'aufbruch_user_interest_v1';

export class RecommendationEngine {
  private interests: Record<string, number> = {};

  constructor() {
    this.loadInterests();
  }

  private loadInterests() {
    try {
      const raw = localStorage.getItem(INTEREST_STORAGE_KEY);
      if (raw) {
        this.interests = JSON.parse(raw);
      } else {
        // Default initial interest baseline
        this.interests = {
          tech: 3,
          crypto: 2,
          news: 4,
          privacy: 5,
          mesh: 3,
        };
      }
    } catch {
      this.interests = {};
    }
  }

  private saveInterests() {
    try {
      localStorage.setItem(INTEREST_STORAGE_KEY, JSON.stringify(this.interests));
    } catch {
      // Ignored
    }
  }

  /**
   * Track user actions (search, click, zap, post) to refine recommendation weights
   */
  public trackInteraction(topicOrKeyword: string, weight: number = 1) {
    if (!topicOrKeyword) return;
    const clean = topicOrKeyword.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!clean) return;

    this.interests[clean] = (this.interests[clean] || 0) + weight;
    this.saveInterests();
  }

  /**
   * Filter out corrupt, malformed, test, or spam events
   */
  public isCleanPost(event: NostrEvent): boolean {
    if (!event || !event.content) return false;
    const text = event.content.trim();
    if (text.length === 0) return false;

    const lower = text.toLowerCase();

    // Filter out explicit test posts & spam phrases
    const spamPatterns = [
      'this is a test post',
      'micro freelance toolkit',
      'trycloudflare.com',
      'moneymaker-solana',
      'test post that will be published',
      'test post',
      'asdfasdf',
      'qwertyuiop',
    ];

    if (spamPatterns.some((pattern) => lower.includes(pattern))) {
      return false;
    }

    // Check if event content is raw JSON metadata string (e.g. {"name":"...", "about":"..."})
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const parsed = JSON.parse(text);
        // If it's a metadata object rather than human readable text, filter it out
        if (parsed.name || parsed.about || parsed.picture || parsed.nip05) {
          return false;
        }
      } catch {
        // Not valid JSON, continue
      }
    }

    // Check if event is expired self-destruct post
    if (event.expiresAt && event.expiresAt < Math.floor(Date.now() / 1000)) {
      return false;
    }

    return true;
  }

  /**
   * Scores an event for the "For You" personalized recommendation algorithm
   */
  public calculateRelevanceScore(event: NostrEvent, searchQuery: string = ''): number {
    let score = 0;
    const contentLower = event.content.toLowerCase();
    const queryLower = searchQuery.toLowerCase().trim();

    // 1. Direct Search Match Boost
    if (queryLower) {
      if (contentLower.includes(queryLower)) score += 50;
      if (event.authorPetname?.toLowerCase().includes(queryLower)) score += 30;
      if (event.channel?.toLowerCase().includes(queryLower)) score += 40;
    }

    // 2. Personal Interest Matching
    Object.entries(this.interests).forEach(([topic, weight]) => {
      if (contentLower.includes(topic) || event.channel?.toLowerCase().includes(topic)) {
        score += weight * 3;
      }
    });

    // 3. Social Engagement Signals (Zaps & Likes)
    const zapScore = (event.zapCount || 0) * 2 + Math.floor((event.zatsTotal || 0) / 1000);
    score += Math.min(zapScore, 25);

    // 4. Media Richness Boost (Photos, Audio, Polls)
    if (event.mediaType === 'image') score += 10;
    if (event.mediaType === 'audio') score += 12;
    if (event.postType === 'poll') score += 15;

    // 5. Recency Decay (newer posts score higher)
    const ageInHours = (Date.now() / 1000 - event.created_at) / 3600;
    const recencyBonus = Math.max(0, 30 - ageInHours * 2);
    score += recencyBonus;

    return score;
  }

  /**
   * Returns posts sorted by recommendation algorithm or requested feed mode
   */
  public getRecommendedFeed(
    events: NostrEvent[],
    feedMode: 'for_you' | 'latest' | 'following' | 'audio' | 'my_posts',
    selectedChannel: string = 'all',
    searchQuery: string = '',
    myPubkey?: string
  ): NostrEvent[] {
    // 1. Filter out malformed / unnecessary posts
    let cleaned = events.filter((e) => this.isCleanPost(e));

    // 2. Filter by channel if selected
    if (selectedChannel && selectedChannel !== 'all') {
      cleaned = cleaned.filter((e) => {
        const chan = (e.channel || 'general').toLowerCase();
        return chan === selectedChannel.toLowerCase() || e.content.toLowerCase().includes(`#${selectedChannel.toLowerCase()}`);
      });
    }

    // 3. Filter by search query if active
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      cleaned = cleaned.filter(
        (e) =>
          e.content.toLowerCase().includes(q) ||
          e.authorPetname?.toLowerCase().includes(q) ||
          e.channel?.toLowerCase().includes(q) ||
          (e.tags || []).some((t) => t[1]?.toLowerCase().includes(q))
      );
    }

    // 4. Mode-specific logic
    if (feedMode === 'my_posts' && myPubkey) {
      return cleaned.filter((e) => e.pubkey === myPubkey).sort((a, b) => b.created_at - a.created_at);
    }

    if (feedMode === 'audio') {
      return cleaned.filter((e) => e.mediaType === 'audio').sort((a, b) => b.created_at - a.created_at);
    }

    if (feedMode === 'latest') {
      return cleaned.sort((a, b) => b.created_at - a.created_at);
    }

    // Default 'for_you' mode: Smart Algorithmic Ranking
    return cleaned.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, searchQuery);
      const scoreB = this.calculateRelevanceScore(b, searchQuery);
      return scoreB - scoreA;
    });
  }

  public getRankedFeed(events: NostrEvent[], searchQuery: string = ''): NostrEvent[] {
    return this.getRecommendedFeed(events, 'for_you', 'all', searchQuery);
  }

  public getTopInterests(): string[] {
    return Object.entries(this.interests)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);
  }
}

export const recommendationEngine = new RecommendationEngine();
