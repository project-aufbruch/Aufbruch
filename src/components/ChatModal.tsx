import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  Users,
  Lock,
  Send,
  Plus,
  Phone,
  Check,
  Copy,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { UserIdentity, ChatMessage, ChatGroup, GroupMember } from '../types';
import { chatService } from '../services/chatService';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: UserIdentity | null;
  initialTargetPubkey?: string;
  initialGroupId?: string;
  onOpenCall?: (targetPubkey: string) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  identity,
  initialTargetPubkey,
  initialGroupId,
  onOpenCall
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'groups' | 'guide'>('direct');
  const [selectedContactPubkey, setSelectedContactPubkey] = useState<string>(initialTargetPubkey || '');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId || '');
  const [inputText, setInputText] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // New Chat / Add Member Modals
  const [isNewDirectModalOpen, setIsNewDirectModalOpen] = useState(false);
  const [newDirectRecipient, setNewDirectRecipient] = useState('');
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(true);
  const [newGroupMembersText, setNewGroupMembersText] = useState('');
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberPubkey, setNewMemberPubkey] = useState('');
  const [newMemberPetname, setNewMemberPetname] = useState('');

  const [tick, setTick] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatService.setIdentity(identity);
    const unsub = chatService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => unsub();
  }, [identity]);

  useEffect(() => {
    if (initialTargetPubkey) {
      setSelectedContactPubkey(initialTargetPubkey);
      setActiveTab('direct');
    }
    if (initialGroupId) {
      setSelectedGroupId(initialGroupId);
      setActiveTab('groups');
    }
  }, [initialTargetPubkey, initialGroupId]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedContactPubkey, selectedGroupId, tick, activeTab]);

  if (!isOpen) return null;

  const myPubkey = identity?.publicKeyHex || 'guest_user';

  const conversations = chatService.getDirectConversations(myPubkey);
  const groups = chatService.getGroups();

  const activeContactPubkey = selectedContactPubkey || (conversations.length > 0 ? conversations[0].contactPubkey : '3bf0372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427a');
  const activeGroupId = selectedGroupId || (groups.length > 0 ? groups[0].id : '');

  const directMessages = chatService.getDirectMessages(myPubkey, activeContactPubkey);
  const groupMessages = activeGroupId ? chatService.getGroupMessages(activeGroupId) : [];
  const currentGroup = activeGroupId ? chatService.getGroupById(activeGroupId) : undefined;

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');

    if (activeTab === 'direct') {
      await chatService.sendDirectMessage(activeContactPubkey, text);
    } else if (activeTab === 'groups' && activeGroupId) {
      await chatService.sendGroupMessage(activeGroupId, text);
    }
  };

  const handleCreateNewDirect = () => {
    if (!newDirectRecipient.trim()) return;
    setSelectedContactPubkey(newDirectRecipient.trim());
    setIsNewDirectModalOpen(false);
    setNewDirectRecipient('');
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    const memberPubkeys = newGroupMembersText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((k, idx) => ({ pubkey: k, petname: `Member_${idx + 1}` }));

    const created = await chatService.createGroup(newGroupName.trim(), newGroupDesc.trim(), newGroupIsPrivate, memberPubkeys);
    setSelectedGroupId(created.id);
    setIsCreateGroupModalOpen(false);
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupMembersText('');
  };

  const handleAddMember = async () => {
    if (!newMemberPubkey.trim() || !activeGroupId) return;
    await chatService.addMemberToGroup(activeGroupId, newMemberPubkey.trim(), newMemberPetname.trim() || `User_${newMemberPubkey.substring(0, 6)}`);
    setIsAddMemberModalOpen(false);
    setNewMemberPubkey('');
    setNewMemberPetname('');
  };

  const handleCopyMyKey = () => {
    if (identity) {
      navigator.clipboard.writeText(identity.publicKeyHex);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white text-slate-900 w-full max-w-4xl h-[90vh] max-h-[750px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold">Secure Messages & Group Chat</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> End-to-End Encrypted
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Decentralized P2P & Multi-Device Synchronized</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMyKey}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition-colors"
              title="Copy your Public Key to share with friends"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedKey ? 'Key Copied!' : 'Copy My Key'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('direct')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'direct'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>1-on-1 Direct Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'groups'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Group Chats ({groups.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>How 2 People Connect Guide</span>
            </button>
          </div>
        </div>

        {/* Main Body Area */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'guide' ? (
            /* GUIDE VIEW */
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50">
              <div className="max-w-2xl mx-auto space-y-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>How 2 People Connect (User X & User Y)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    AUFBRUCH connects users using cryptographic keypairs without email, passwords, or phone numbers. Here is how any 2 people start chatting or calling:
                  </p>

                  <div className="grid sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        1
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">Share App / Link</h4>
                      <p className="text-[11px] text-slate-600">
                        Send the app link or QR code to your friend or open it on your second device.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        2
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">Swap Keys or Click Author</h4>
                      <p className="text-[11px] text-slate-600">
                        Click <strong>"Chat"</strong> or <strong>"••• &gt; Private Chat Author"</strong> on any broadcast, or paste their Public Key directly.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        3
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">Chat & Call Instantly</h4>
                      <p className="text-[11px] text-slate-600">
                        Messages & Voice/Video calls sync in real-time across devices with zero central logging.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Group Chat Guide */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                    <Users className="w-4 h-4" />
                    <span>How Group Chats Work (Adding User A & User B)</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
                    <li>
                      <strong>Create a Group:</strong> Click <strong>"Group Chats"</strong> tab above, then click <strong>"+ Group"</strong>.
                    </li>
                    <li>
                      <strong>Add Friends:</strong> Paste the Public Keys of User A and User B into the members list or click <strong>"+ Add Member"</strong> inside any active group room.
                    </li>
                    <li>
                      <strong>Real-Time Sync:</strong> Any message sent in the group is synced live across all participants' devices via local and backend relay channels.
                    </li>
                  </ul>
                </div>

                {/* My Public Key Card */}
                <div className="bg-indigo-950 text-white p-4 rounded-2xl border border-indigo-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300">Your Personal Public Identity Key:</span>
                    <button
                      onClick={handleCopyMyKey}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-2 bg-indigo-900/60 rounded-xl font-mono text-[11px] text-indigo-200 break-all select-all">
                    {identity?.publicKeyHex || 'Loading identity...'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* CONVERSATION & CHAT VIEW */
            <div className="flex-1 flex overflow-hidden">
              {/* Left Sidebar: Contact/Group List */}
              <div className="w-1/3 min-w-[200px] max-w-[280px] bg-slate-50 border-r border-slate-200 flex flex-col">
                <div className="p-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {activeTab === 'direct' ? 'Contacts & DMs' : 'Group Channels'}
                  </span>
                  {activeTab === 'direct' ? (
                    <button
                      onClick={() => setIsNewDirectModalOpen(true)}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                      title="Start New Direct Chat"
                    >
                      <Plus className="w-3.5 h-3.5" /> New
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsCreateGroupModalOpen(true)}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                      title="Create New Group"
                    >
                      <Plus className="w-3.5 h-3.5" /> Group
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                  {activeTab === 'direct' ? (
                    conversations.length > 0 ? (
                      conversations.map((conv) => {
                        const isSelected = activeContactPubkey === conv.contactPubkey;
                        return (
                          <button
                            key={conv.contactPubkey}
                            onClick={() => setSelectedContactPubkey(conv.contactPubkey)}
                            className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'hover:bg-slate-200/70 text-slate-800'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              {conv.contactPetname ? conv.contactPetname[0].toUpperCase() : 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold truncate">{conv.contactPetname}</span>
                              </div>
                              <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                                {conv.lastMessage.content}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-xs space-y-2">
                        <MessageSquare className="w-6 h-6 mx-auto text-slate-300" />
                        <p>No active chats yet.</p>
                        <button
                          onClick={() => setIsNewDirectModalOpen(true)}
                          className="text-indigo-600 font-bold text-xs underline"
                        >
                          Start a new message
                        </button>
                      </div>
                    )
                  ) : (
                    groups.map((grp) => {
                      const isSelected = activeGroupId === grp.id;
                      return (
                        <button
                          key={grp.id}
                          onClick={() => setSelectedGroupId(grp.id)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'hover:bg-slate-200/70 text-slate-800'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold truncate">{grp.name}</span>
                            </div>
                            <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                              {grp.lastMessage || `${grp.members.length} members`}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Main Chat Window */}
              <div className="flex-1 flex flex-col bg-white">
                {/* Active Chat Header */}
                <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      {activeTab === 'direct' ? (
                        'U'
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                          {activeTab === 'direct'
                            ? `User (${activeContactPubkey.substring(0, 8)}...)`
                            : currentGroup?.name || 'Group Chat'}
                        </h3>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Encrypted
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {activeTab === 'direct'
                          ? `Pubkey: ${activeContactPubkey.substring(0, 16)}...`
                          : `${currentGroup?.members.length || 0} members &bull; ${currentGroup?.description || ''}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {activeTab === 'direct' && onOpenCall && (
                      <button
                        onClick={() => onOpenCall(activeContactPubkey)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                        title="Start Encrypted Voice/Video Call with this User"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </button>
                    )}

                    {activeTab === 'groups' && (
                      <button
                        onClick={() => setIsAddMemberModalOpen(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-xl transition-all"
                        title="Add User A or User B to this group"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Add Member</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                  {activeTab === 'direct' ? (
                    directMessages.length > 0 ? (
                      directMessages.map((msg) => {
                        const isMine = msg.senderPubkey === myPubkey;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400">
                              <span className="font-semibold">{isMine ? 'You' : msg.senderPetname}</span>
                              <span>&bull;</span>
                              <span>{new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div
                              className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                                isMine
                                  ? 'bg-indigo-600 text-white rounded-br-xs'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                        <Lock className="w-8 h-8 text-slate-300" />
                        <p className="font-medium">Direct Encrypted Channel Ready</p>
                        <p className="text-[11px] text-slate-500 max-w-xs text-center">
                          Send a message below to start your conversation. Messages are encrypted and sync across all your devices.
                        </p>
                      </div>
                    )
                  ) : (
                    groupMessages.length > 0 ? (
                      groupMessages.map((msg) => {
                        const isMine = msg.senderPubkey === myPubkey;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400">
                              <span className="font-semibold text-slate-700">{isMine ? 'You' : msg.senderPetname}</span>
                              <span>&bull;</span>
                              <span>{new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div
                              className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                                isMine
                                  ? 'bg-indigo-600 text-white rounded-br-xs'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <p className="font-medium">Group Chat Initialized</p>
                        <p className="text-[11px] text-slate-500 max-w-xs text-center">
                          Be the first to send a message to everyone in this channel!
                        </p>
                      </div>
                    )
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Footer */}
                <div className="p-3 bg-white border-t border-slate-200">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={
                        activeTab === 'direct'
                          ? 'Write an encrypted message...'
                          : `Message #${currentGroup?.name || 'group'}...`
                      }
                      className="flex-1 px-3.5 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-2 rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal: New Direct Chat */}
        {isNewDirectModalOpen && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Start 1-on-1 Direct Chat</h4>
                <button onClick={() => setIsNewDirectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600">
                Enter your contact's Public Key (Hex or npub) to open a direct encrypted conversation:
              </p>
              <input
                type="text"
                value={newDirectRecipient}
                onChange={(e) => setNewDirectRecipient(e.target.value)}
                placeholder="e.g. 3bf0372b5d2e2c... or npub1..."
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsNewDirectModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNewDirect}
                  disabled={!newDirectRecipient.trim()}
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40"
                >
                  Open Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Group */}
        {isCreateGroupModalOpen && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Create New Group Channel</h4>
                <button onClick={() => setIsCreateGroupModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Group Name</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Family & Friends Circle"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Description</label>
                  <input
                    type="text"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="e.g. Encrypted private updates and calls"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Initial Members (Public Keys, comma or line separated)</label>
                  <textarea
                    rows={2}
                    value={newGroupMembersText}
                    onChange={(e) => setNewGroupMembersText(e.target.value)}
                    placeholder="Paste User A key, User B key..."
                    className="w-full mt-1 px-3 py-2 font-mono text-[11px] bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsCreateGroupModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Member to Group */}
        {isAddMemberModalOpen && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Add Member to Group</h4>
                <button onClick={() => setIsAddMemberModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Member Public Key (Hex / npub)</label>
                  <input
                    type="text"
                    value={newMemberPubkey}
                    onChange={(e) => setNewMemberPubkey(e.target.value)}
                    placeholder="e.g. 71a0372b5d2e2c..."
                    className="w-full mt-1 px-3 py-2 font-mono text-[11px] bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Member Display Name / Petname (optional)</label>
                  <input
                    type="text"
                    value={newMemberPetname}
                    onChange={(e) => setNewMemberPetname(e.target.value)}
                    placeholder="e.g. Alice / Brother"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberPubkey.trim()}
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40"
                >
                  Add to Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
