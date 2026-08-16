import { NostrEvent } from '../types';

export interface SimilarPollResult {
  hasDuplicate: boolean;
  matchScore: number; // 0 to 1
  existingPoll: NostrEvent | null;
  matchedTopicKey: string;
  reason: string;
}

// Stopwords to ignore in similarity matching
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about',
  'into', 'over', 'after', 'we', 'you', 'they', 'he', 'she', 'it', 'this', 'that',
  'people', 'want', 'don\'t', 'dont', 'should', 'would', 'could', 'vote', 'poll',
  'support', 'reject', 'against', 'oppose', 'for', 'yes', 'no'
]);

/**
 * Normalizes text into cleaned topic keywords
 */
export function extractTopicKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s#]/gi, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Checks if a proposed poll topic is too similar to an existing active poll in the network.
 * Prevents voting fragmentation and topic duplication chaos.
 */
export function checkDuplicatePollTopic(
  proposedText: string,
  existingFeed: NostrEvent[]
): SimilarPollResult {
  const newKeywords = extractTopicKeywords(proposedText);

  if (newKeywords.length === 0) {
    return {
      hasDuplicate: false,
      matchScore: 0,
      existingPoll: null,
      matchedTopicKey: '',
      reason: 'No unique keywords detected',
    };
  }

  const activePolls = existingFeed.filter(
    (e) => e.postType === 'poll' || (e.pollOptions && e.pollOptions.length > 0)
  );

  let bestMatchScore = 0;
  let bestMatchPoll: NostrEvent | null = null;
  let bestMatchedKeywords: string[] = [];

  for (const poll of activePolls) {
    const existingKeywords = extractTopicKeywords(poll.content);
    if (existingKeywords.length === 0) continue;

    // Calculate Jaccard / Overlap similarity
    const intersection = newKeywords.filter((k) => existingKeywords.includes(k));
    const union = Array.from(new Set([...newKeywords, ...existingKeywords]));

    const overlapScore = intersection.length / union.length;
    // Also weighted overlap score based on input length
    const inputRatio = intersection.length / newKeywords.length;

    const combinedScore = (overlapScore + inputRatio) / 2;

    if (combinedScore > bestMatchScore) {
      bestMatchScore = combinedScore;
      bestMatchPoll = poll;
      bestMatchedKeywords = intersection;
    }
  }

  // Threshold: if > 35% overlap or 2+ key topic words match precisely
  const isDuplicate = bestMatchScore >= 0.35 || bestMatchedKeywords.length >= 2;

  if (isDuplicate && bestMatchPoll) {
    const totalVotes = bestMatchPoll.pollVotes
      ? bestMatchPoll.pollVotes.reduce((acc, v) => acc + v, 0)
      : 0;

    return {
      hasDuplicate: true,
      matchScore: bestMatchScore,
      existingPoll: bestMatchPoll,
      matchedTopicKey: bestMatchedKeywords.join(', '),
      reason: `A similar active poll already exists ("${bestMatchPoll.content.substring(0, 60)}...") with ${totalVotes} votes. Join the existing vote to avoid vote fragmentation!`,
    };
  }

  return {
    hasDuplicate: false,
    matchScore: bestMatchScore,
    existingPoll: null,
    matchedTopicKey: '',
    reason: 'Unique topic',
  };
}

export const CIVIC_POLL_TEMPLATES = [
  {
    id: 'gov_bill',
    label: '🏛️ Government Bill / Policy Referendum',
    description: 'Vote to Support or Reject a government bill, tax, or law',
    defaultTitle: 'Referendum: Reject proposed digital surveillance & censorship bill',
    options: ['Reject / Oppose Bill 🛑', 'Support / Approve Bill 🟢', 'Abstain / Needs Amendments ⚖️'],
    category: 'government_policy',
  },
  {
    id: 'gov_system',
    label: '🛑 Government / System Reform Motion',
    description: 'Civic motion regarding government authority or system reform',
    defaultTitle: 'Civic Vote: No confidence in centralized state media oversight',
    options: ['Support System Reform ✊', 'Reject Motion / Keep System 🏛️', 'Undecided ❓'],
    category: 'system_motion',
  },
  {
    id: 'public_initiative',
    label: '💡 Community Freedom Initiative',
    description: 'Propose community projects, mesh network expansions, or local laws',
    defaultTitle: 'Proposal: Deploy local off-grid WebRTC mesh nodes in urban center',
    options: ['Approve Initiative ⚡', 'Reject Initiative ❌', 'Request Technical Review 🔍'],
    category: 'community_proposal',
  },
];
