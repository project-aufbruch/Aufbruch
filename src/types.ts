export interface UserIdentity {
  seedPhrase: string; // 12-word mnemonic
  privateKeyHex: string;
  publicKeyHex: string;
  npub: string;
  nsec: string;
  petname: string;
  avatarCid?: string;
  createdTimestamp: number;
  isHardwareLocked: boolean;
}

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number; // 1: text, 4: encrypted DM, 9735: zap
  tags: string[][];
  content: string;
  sig: string;
  // Computed / UI metadata:
  powDifficulty?: number;
  ipfsCid?: string;
  mediaType?: 'image' | 'audio' | 'video' | 'none';
  voiceShifted?: boolean;
  facesBlurred?: number;
  exifStripped?: boolean;
  zatsTotal?: number;
  zapCount?: number;
  authorPetname?: string;
  authorNpub?: string;
  isVerifiedSig?: boolean;

  // New Post Controls & Options:
  channel?: string; // 'general' | 'tech' | 'crypto' | 'news' | 'art' | 'mesh'
  postType?: 'text' | 'image' | 'audio' | 'link' | 'poll';
  pollOptions?: string[];
  pollVotes?: number[];
  pollCategory?: 'government_policy' | 'system_motion' | 'community_proposal' | 'general';
  pollTopicKey?: string;
  privacyMode?: 'public' | 'self_destruct' | 'encrypted' | 'anonymous';
  expiresAt?: number;
  targetNetwork?: 'global_nostr' | 'ipfs_swarm' | 'local_mesh';
}

export interface RelayNode {
  url: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'blocked';
  pingMs: number;
  eventsReceived: number;
  isBackup: boolean;
  location: string;
}

export interface IpfsPeer {
  id: string;
  address: string;
  pingMs: number;
  status: 'active' | 'synced' | 'connecting';
  chunkCount: number;
  downloadSpeedKbps: number;
}

export interface MediaScrubOptions {
  stripExif: boolean;
  blurFaces: boolean;
  blurTattoos: boolean;
  faceBlurIntensity: number; // 5 to 30
  pitchShiftSemitones: number; // -12 to 12
  anonymizeVoice: boolean;
}

export interface PoWProgress {
  targetBits: number;
  currentNonce: number;
  hashesPerSec: number;
  isMining: boolean;
  completedHash?: string;
  timeElapsedMs?: number;
}

export interface DuressConfig {
  isDuressActive: boolean;
  normalPin: string; // Default: "1234"
  duressPin: string; // Default: "9999"
  decoyType: 'cats' | 'news' | 'weather';
  autoWipeOnAttempts: number;
  failedAttempts: number;
}

export interface ZapTransaction {
  id: string;
  eventId: string;
  senderPubkey: string;
  recipientPubkey: string;
  amountSats: number;
  protocolFeeSats: number; // 5-10% fee
  feeAddress: string;
  timestamp: number;
  bolt11Invoice: string;
  status: 'settled' | 'pending';
}

export interface ChatMessage {
  id: string;
  senderPubkey: string;
  senderPetname: string;
  recipientPubkey?: string; // for 1-on-1 DM
  groupId?: string; // for Group Chat
  content: string;
  timestamp: number;
  isEncrypted: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'none';
  sig?: string;
  burnDuration?: number; // seconds
  expiresAt?: number; // timestamp in seconds
}

export interface GroupMember {
  pubkey: string;
  petname: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: number;
}

export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  creatorPubkey: string;
  creatorPetname: string;
  members: GroupMember[];
  isPrivate: boolean;
  avatarIcon?: string;
  createdAt: number;
  lastMessage?: string;
  lastMessageTime?: number;
  disappearingTimer?: number; // default burn duration in seconds for group messages
}

export interface TorHop {
  role: 'Guard' | 'Middle' | 'Exit';
  name: string;
  ip: string;
  country: string;
  flag: string;
  latencyMs: number;
  fingerprint: string;
}

export interface TorConfig {
  enabled: boolean;
  bridgeMode: 'obfs4' | 'meek-azure' | 'snowflake' | 'direct';
  socksPort: number;
  circuit: TorHop[];
  dnsLeakProtection: boolean;
  isolationByOrigin: boolean;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  content: string;
  authorPubkey: string;
  createdAt: number;
  severity: 'info' | 'alert' | 'critical' | 'release';
  isActive: boolean;
}

// 1. Ultrasonic Audio Steganography & Mesh Types
export type UltrasonicEmergencyType = 'SOS' | 'MEDICAL' | 'EVAC_CORRIDOR' | 'WATER_POINT' | 'HAZARD' | 'TEXT_MSG';

export interface UltrasonicPacket {
  id: string;
  type: UltrasonicEmergencyType;
  senderPetname: string;
  senderPubkeyPrefix: string;
  message: string;
  latitude?: number;
  longitude?: number;
  timestamp: number;
  checksum: number;
}

// 2. Cold Storage & Hardware Wallet Types
export interface ColdStoragePaperKey {
  mnemonic: string[];
  pubkey: string;
  npub: string;
  encryptedPrivkey: string;
  checksum: string;
  createdAt: number;
  backupHint?: string;
}

// 3. Offline Emergency Map & Safe Zone Types
export type SafeZoneCategory = 'shelter' | 'medical' | 'water' | 'hazard' | 'evacuation' | 'comms';

export interface EmergencyPin {
  id: string;
  title: string;
  description: string;
  category: SafeZoneCategory;
  latitude: number;
  longitude: number;
  verifiedByCount: number;
  isVerified: boolean;
  authorPetname: string;
  authorPubkey: string;
  timestamp: number;
  capacityStatus?: 'open' | 'limited' | 'full' | 'compromised';
  contactFrequency?: string; // e.g. "433.500 MHz / Ch 8"
}

// 4. Multi-Recipient Sealed Blast (NIP-17 / NIP-59)
export interface SealedBlastRecipient {
  pubkey: string;
  petname: string;
  deliveryStatus: 'pending' | 'delivered' | 'failed';
}

export interface SealedBlastMessage {
  id: string;
  senderPubkey: string;
  senderPetname: string;
  recipients: SealedBlastRecipient[];
  rumorContent: string;
  timestamp: number;
  giftWrapKind: 1059;
  sealKind: 13;
  rumorKind: 14;
  isBurnOnRead: boolean;
}

// 5. Anti-Spam, Anti-Abuse & Moderation Shield
export interface BlockedEntity {
  id: string;
  pubkey: string;
  petname?: string;
  reason: 'spam' | 'harassment' | 'scam' | 'impersonation' | 'bot' | 'custom';
  blockedAt: number;
  blockedBy: string; // 'local_user' | 'community_quorum' | 'relay_filter'
}

export interface AbuseReport {
  id: string;
  targetPubkey: string;
  reporterPubkey: string;
  reason: string;
  evidenceEventId?: string;
  timestamp: number;
}

export interface ModerationConfig {
  powDifficulty: number; // 0 = off, 8 = light, 16 = strict, 20 = high-threat
  strictWebOfTrust: boolean; // only accept DMs/broadcasts from followed/vouched keys
  autoQuarantineThreshold: number; // community reports needed to auto-block (e.g. 3)
  bannedKeywords: string[];
  blockUnvouchedDMs: boolean;
  rateLimitMs: number;
}

// 6. Whistleblower & Secret Government Document Dead-Drop Types
export type WhistleblowerCategory =
  | 'defense'
  | 'surveillance'
  | 'corruption'
  | 'public_health'
  | 'environmental'
  | 'financial'
  | 'general';

export type AgencyProofBadge =
  | 'Verified Official / Civic Agency Employee'
  | 'Defense & Intelligence Community'
  | 'Financial & Treasury Watchdog'
  | 'Municipal / State Auditor'
  | 'Environmental & Health Inspector'
  | 'Anonymous Public Servant';

export interface WhistleblowerDocument {
  id: string;
  title: string;
  summary: string;
  category: WhistleblowerCategory;
  agencyProofBadge: AgencyProofBadge;
  zkpProofHash: string;
  sha256Hash: string;
  fileSizeFormatted: string;
  sanitizedDate: string;
  redactedExcerpts: string[];
  rawContentText: string;
  sourceUrlOrCid: string;
  timestamp: number;
  powScore: number;
  peerAttestations: number;
  commentsCount: number;
  burnOnInspect?: boolean;
  isEncrypted?: boolean;
  classificationLevel?: 'UNCLASSIFIED // FOUO' | 'CONFIDENTIAL' | 'SECRET // DECLASSIFIED' | 'PUBLIC LEAK';
}

export interface WhistleblowerCommentary {
  id: string;
  docId: string;
  authorPetname: string;
  authorPubkey: string;
  authorBadge?: string;
  content: string;
  citations?: string[];
  timestamp: number;
  zapSats: number;
  isVerifiedJournalist: boolean;
}

// 7. Fortress Anti-Spam Pipeline Types
export interface SpamQuarantineItem {
  id: string;
  pubkey: string;
  authorPetname: string;
  contentSnippet: string;
  rejectionReason: 'failed_pow' | 'bayesian_spam' | 'sybil_duplicate' | 'banned_keyword' | 'unvouched_bot';
  detectedEntropy: number;
  powDifficultyFound: number;
  powDifficultyRequired: number;
  interceptedAt: number;
  relayOrigin: string;
}

export interface SpamMetrics {
  totalScanned: number;
  totalQuarantined: number;
  powRejections: number;
  bayesianRejections: number;
  sybilClustersBusted: number;
  spamFreePercentage: number;
}

// 8. Storage & Cache Pruning Types
export interface IpfsStoredChunk {
  id: string; // `${cid}_${index}`
  cid: string;
  chunkIndex: number;
  totalChunks: number;
  byteSize: number;
  fileName: string;
  mediaType: 'image' | 'audio' | 'video' | 'document' | 'other';
  dataBlob?: string;
  createdAt: number;
  lastAccessedAt: number;
  pinned: boolean;
}

export interface StorageCategoryStats {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  bytesUsed: number;
  bytesFormatted: string;
  storageType: 'indexedDB' | 'localStorage' | 'cacheStorage' | 'inMemory';
  isSafeToPrune: boolean;
  warningNote?: string;
  items?: { id: string; name: string; sizeFormatted: string; date: string; details?: string }[];
}

export interface StorageBreakdown {
  totalBytesUsed: number;
  totalBytesFormatted: string;
  quotaBytes: number;
  quotaBytesFormatted: string;
  percentUsed: number;
  categories: StorageCategoryStats[];
  lastPrunedTimestamp?: number;
}

export interface PruneResult {
  reclaimedBytes: number;
  reclaimedBytesFormatted: string;
  itemsPrunedCount: number;
  categoriesPruned: string[];
  durationMs: number;
  timestamp: number;
}

