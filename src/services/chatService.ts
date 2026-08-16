import { ChatMessage, ChatGroup, GroupMember, UserIdentity } from '../types';

const INITIAL_GROUPS: ChatGroup[] = [
  {
    id: 'grp_family_friends',
    name: 'Family & Inner Circle 🛡️',
    description: 'Private encrypted communication room for close family and trusted contacts.',
    creatorPubkey: '9a90372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427f',
    creatorPetname: 'NetworkArchitect',
    createdAt: Math.floor(Date.now() / 1000) - 86400,
    isPrivate: true,
    avatarIcon: 'Shield',
    members: [
      { pubkey: '9a90372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427f', petname: 'NetworkArchitect', role: 'admin', joinedAt: Math.floor(Date.now() / 1000) - 86400 },
      { pubkey: '3bf0372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427a', petname: 'FreePress_Asia', role: 'member', joinedAt: Math.floor(Date.now() / 1000) - 72000 },
      { pubkey: 'fa50372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427b', petname: 'CitizenJournalist_PK', role: 'member', joinedAt: Math.floor(Date.now() / 1000) - 36000 }
    ],
    lastMessage: 'All signals operational over encrypted mesh!',
    lastMessageTime: Math.floor(Date.now() / 1000) - 1200
  },
  {
    id: 'grp_global_lounge',
    name: 'Global Mesh Lounge 🌐',
    description: 'Open public chat room for decentralized builders, activists, and privacy enthusiasts.',
    creatorPubkey: '71a0372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427d',
    creatorPetname: 'Web3_Pioneer',
    createdAt: Math.floor(Date.now() / 1000) - 172800,
    isPrivate: false,
    avatarIcon: 'Globe',
    members: [
      { pubkey: '71a0372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427d', petname: 'Web3_Pioneer', role: 'admin', joinedAt: Math.floor(Date.now() / 1000) - 172800 },
      { pubkey: '8c50372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427c', petname: 'CyberSec_Daily', role: 'member', joinedAt: Math.floor(Date.now() / 1000) - 100000 }
    ],
    lastMessage: 'Welcome to the uncensorable communication hub!',
    lastMessageTime: Math.floor(Date.now() / 1000) - 3600
  }
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_001',
    senderPubkey: '3bf0372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427a',
    senderPetname: 'FreePress_Asia',
    groupId: 'grp_family_friends',
    content: 'Welcome everyone! We now have private encrypted channels and one-click voice/video calls.',
    timestamp: Math.floor(Date.now() / 1000) - 7200,
    isEncrypted: true
  },
  {
    id: 'msg_002',
    senderPubkey: 'fa50372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427b',
    senderPetname: 'CitizenJournalist_PK',
    groupId: 'grp_family_friends',
    content: 'Awesome! All packets are routing through Nostr relays and direct peer-to-peer sync.',
    timestamp: Math.floor(Date.now() / 1000) - 3600,
    isEncrypted: true
  },
  {
    id: 'msg_003',
    senderPubkey: '3bf0372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427a',
    senderPetname: 'FreePress_Asia',
    recipientPubkey: 'MY_ACTIVE_PUBKEY',
    content: 'Hi! Let me know if you received this direct message on your device.',
    timestamp: Math.floor(Date.now() / 1000) - 1800,
    isEncrypted: true
  }
];

class ChatService {
  private messages: ChatMessage[] = [];
  private groups: ChatGroup[] = [];
  private listeners: Set<() => void> = new Set();
  private identity: UserIdentity | null = null;
  private syncTimer: any = null;

  constructor() {
    this.loadFromStorage();
    this.startBackendSync();
  }

  public setIdentity(identity: UserIdentity | null) {
    this.identity = identity;
    this.notify();
  }

  private loadFromStorage() {
    try {
      const storedMsgs = localStorage.getItem('aufbruch_chat_messages');
      if (storedMsgs) {
        this.messages = JSON.parse(storedMsgs);
      } else {
        this.messages = [...INITIAL_MESSAGES];
      }

      const storedGroups = localStorage.getItem('aufbruch_chat_groups');
      if (storedGroups) {
        this.groups = JSON.parse(storedGroups);
      } else {
        this.groups = [...INITIAL_GROUPS];
      }
    } catch {
      this.messages = [...INITIAL_MESSAGES];
      this.groups = [...INITIAL_GROUPS];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('aufbruch_chat_messages', JSON.stringify(this.messages.slice(-300)));
      localStorage.setItem('aufbruch_chat_groups', JSON.stringify(this.groups));
    } catch (e) {
      console.warn('Failed to save chats to storage:', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  // Multi-device backend synchronization
  private async startBackendSync() {
    this.pullFromBackend();
    this.syncTimer = setInterval(() => {
      this.pullFromBackend();
    }, 2500);
  }

  public async pullFromBackend() {
    try {
      const res = await fetch('/api/sync/chats');
      if (res.ok) {
        const data = await res.json();
        let changed = false;

        if (Array.isArray(data.messages)) {
          for (const msg of data.messages) {
            if (!this.messages.some(m => m.id === msg.id)) {
              this.messages.push(msg);
              changed = true;
            }
          }
        }

        if (Array.isArray(data.groups)) {
          for (const grp of data.groups) {
            const existingIdx = this.groups.findIndex(g => g.id === grp.id);
            if (existingIdx === -1) {
              this.groups.push(grp);
              changed = true;
            } else if (JSON.stringify(this.groups[existingIdx]) !== JSON.stringify(grp)) {
              this.groups[existingIdx] = grp;
              changed = true;
            }
          }
        }

        if (changed) {
          this.saveToStorage();
        }
      }
    } catch {
      // Backend not accessible; localStorage offline fallback is active
    }
  }

  private async pushToBackend(type: 'message' | 'group', payload: any) {
    try {
      await fetch('/api/sync/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload })
      });
    } catch {
      // Offline fallback
    }
  }

  // Get all direct message conversations grouped by contact
  public getDirectConversations(myPubkey: string) {
    const contactMap = new Map<string, { contactPubkey: string; contactPetname: string; lastMessage: ChatMessage; unreadCount: number }>();

    this.messages.forEach(msg => {
      if (msg.groupId) return; // ignore group messages

      const isMeSender = msg.senderPubkey === myPubkey;
      const isMeRecipient = msg.recipientPubkey === myPubkey || msg.recipientPubkey === 'MY_ACTIVE_PUBKEY';

      if (!isMeSender && !isMeRecipient) return;

      const otherPubkey = isMeSender ? (msg.recipientPubkey || 'unknown') : msg.senderPubkey;
      const otherPetname = isMeSender ? `User_${otherPubkey.substring(0, 6)}` : msg.senderPetname;

      if (!contactMap.has(otherPubkey) || msg.timestamp > contactMap.get(otherPubkey)!.lastMessage.timestamp) {
        contactMap.set(otherPubkey, {
          contactPubkey: otherPubkey,
          contactPetname: otherPetname,
          lastMessage: msg,
          unreadCount: 0
        });
      }
    });

    return Array.from(contactMap.values()).sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
  }

  // Get messages for a 1-on-1 DM thread
  public getDirectMessages(myPubkey: string, contactPubkey: string): ChatMessage[] {
    return this.messages.filter(m => {
      if (m.groupId) return false;
      const isAtoB = m.senderPubkey === myPubkey && (m.recipientPubkey === contactPubkey || (contactPubkey === '3bf0372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427a' && m.recipientPubkey === 'MY_ACTIVE_PUBKEY'));
      const isBtoA = (m.senderPubkey === contactPubkey || (contactPubkey === '3bf0372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427a' && m.recipientPubkey === 'MY_ACTIVE_PUBKEY')) && (m.recipientPubkey === myPubkey || m.recipientPubkey === 'MY_ACTIVE_PUBKEY');
      return isAtoB || isBtoA;
    }).sort((a, b) => a.timestamp - b.timestamp);
  }

  // Send a 1-on-1 Direct Message
  public async sendDirectMessage(recipientPubkey: string, content: string, mediaUrl?: string): Promise<ChatMessage> {
    if (!this.identity) throw new Error('Identity not loaded');

    const msg: ChatMessage = {
      id: `dm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderPubkey: this.identity.publicKeyHex,
      senderPetname: this.identity.petname || `User_${this.identity.publicKeyHex.substring(0, 6)}`,
      recipientPubkey,
      content,
      mediaUrl,
      timestamp: Math.floor(Date.now() / 1000),
      isEncrypted: true
    };

    this.messages.push(msg);
    this.saveToStorage();
    await this.pushToBackend('message', msg);
    return msg;
  }

  // Get all available groups
  public getGroups(): ChatGroup[] {
    return this.groups;
  }

  public getGroupById(groupId: string): ChatGroup | undefined {
    return this.groups.find(g => g.id === groupId);
  }

  public getGroupMessages(groupId: string): ChatMessage[] {
    return this.messages.filter(m => m.groupId === groupId).sort((a, b) => a.timestamp - b.timestamp);
  }

  // Send a group message
  public async sendGroupMessage(groupId: string, content: string, mediaUrl?: string): Promise<ChatMessage> {
    if (!this.identity) throw new Error('Identity not loaded');

    const msg: ChatMessage = {
      id: `grp_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderPubkey: this.identity.publicKeyHex,
      senderPetname: this.identity.petname || `User_${this.identity.publicKeyHex.substring(0, 6)}`,
      groupId,
      content,
      mediaUrl,
      timestamp: Math.floor(Date.now() / 1000),
      isEncrypted: true
    };

    this.messages.push(msg);

    // Update group last message
    const grp = this.groups.find(g => g.id === groupId);
    if (grp) {
      grp.lastMessage = content;
      grp.lastMessageTime = msg.timestamp;
    }

    this.saveToStorage();
    await this.pushToBackend('message', msg);
    if (grp) {
      await this.pushToBackend('group', grp);
    }
    return msg;
  }

  // Create a new group with members
  public async createGroup(name: string, description: string, isPrivate: boolean, initialMembers: { pubkey: string; petname: string }[]): Promise<ChatGroup> {
    if (!this.identity) throw new Error('Identity not loaded');

    const myMember: GroupMember = {
      pubkey: this.identity.publicKeyHex,
      petname: this.identity.petname,
      role: 'admin',
      joinedAt: Math.floor(Date.now() / 1000)
    };

    const formattedMembers: GroupMember[] = [
      myMember,
      ...initialMembers.filter(m => m.pubkey !== this.identity?.publicKeyHex).map(m => ({
        pubkey: m.pubkey,
        petname: m.petname || `User_${m.pubkey.substring(0, 6)}`,
        role: 'member' as const,
        joinedAt: Math.floor(Date.now() / 1000)
      }))
    ];

    const newGroup: ChatGroup = {
      id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      description,
      creatorPubkey: this.identity.publicKeyHex,
      creatorPetname: this.identity.petname,
      members: formattedMembers,
      isPrivate,
      avatarIcon: isPrivate ? 'Shield' : 'Globe',
      createdAt: Math.floor(Date.now() / 1000),
      lastMessage: 'Group room initialized.',
      lastMessageTime: Math.floor(Date.now() / 1000)
    };

    this.groups.unshift(newGroup);
    this.saveToStorage();
    await this.pushToBackend('group', newGroup);
    return newGroup;
  }

  // Add a member (User A or User B) to an existing group
  public async addMemberToGroup(groupId: string, pubkey: string, petname: string): Promise<boolean> {
    const grp = this.groups.find(g => g.id === groupId);
    if (!grp) return false;

    if (!grp.members.some(m => m.pubkey === pubkey)) {
      grp.members.push({
        pubkey,
        petname: petname || `User_${pubkey.substring(0, 6)}`,
        role: 'member',
        joinedAt: Math.floor(Date.now() / 1000)
      });
      this.saveToStorage();
      await this.pushToBackend('group', grp);
      return true;
    }
    return false;
  }

  // Reset/Clear chats
  public clearAllChats() {
    this.messages = [...INITIAL_MESSAGES];
    this.groups = [...INITIAL_GROUPS];
    this.saveToStorage();
  }
}

export const chatService = new ChatService();
