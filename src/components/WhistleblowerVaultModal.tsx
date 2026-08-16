import React, { useState, useEffect } from 'react';
import {
  FileText,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Trash2,
  Flame,
  Search,
  Check,
  Award,
  BookOpen,
  MessageSquare,
  Zap,
  Cpu,
  X,
  ExternalLink,
  Sliders,
  Filter,
} from 'lucide-react';
import {
  UserIdentity,
  WhistleblowerDocument,
  WhistleblowerCommentary,
  WhistleblowerCategory,
  AgencyProofBadge,
} from '../types';
import { whistleblowerVaultService } from '../services/whistleblowerVault';
import { documentSanitizer, SanitizationResult } from '../services/documentSanitizer';

interface WhistleblowerVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: UserIdentity | null;
}

export const WhistleblowerVaultModal: React.FC<WhistleblowerVaultModalProps> = ({
  isOpen,
  onClose,
  identity,
}) => {
  const [activeTab, setActiveTab] = useState<'archive' | 'drop' | 'sandbox' | 'press'>('archive');
  const [documents, setDocuments] = useState<WhistleblowerDocument[]>([]);
  const [commentaries, setCommentaries] = useState<WhistleblowerCommentary[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<WhistleblowerDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Secret Drop Form State
  const [dropTitle, setDropTitle] = useState('');
  const [dropSummary, setDropSummary] = useState('');
  const [dropCategory, setDropCategory] = useState<WhistleblowerCategory>('surveillance');
  const [dropAgencyBadge, setDropAgencyBadge] = useState<AgencyProofBadge>(
    'Verified Official / Civic Agency Employee'
  );
  const [dropClassification, setDropClassification] = useState<
    'UNCLASSIFIED // FOUO' | 'CONFIDENTIAL' | 'SECRET // DECLASSIFIED' | 'PUBLIC LEAK'
  >('SECRET // DECLASSIFIED');
  const [dropContentText, setDropContentText] = useState('');
  const [redactionKeywordInput, setRedactionKeywordInput] = useState('');
  const [redactionKeywords, setRedactionKeywords] = useState<string[]>([
    'Classified Program Name',
    'Agent ID',
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sanitizing, setSanitizing] = useState(false);
  const [sanitizationResult, setSanitizationResult] = useState<SanitizationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dropSuccess, setDropSuccess] = useState(false);

  // Commentary Form State
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentBadge, setNewCommentBadge] = useState('Investigative Press Corps');

  // Safe Sandbox State
  const [showRedactionsInReader, setShowRedactionsInReader] = useState(true);
  const [panicWiped, setPanicWiped] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const unsub = whistleblowerVaultService.subscribe((docs, comments) => {
        setDocuments(docs);
        setCommentaries(comments);
        if (!selectedDoc && docs.length > 0) {
          setSelectedDoc(docs[0]);
        }
      });
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddRedactionKeyword = () => {
    if (redactionKeywordInput.trim() && !redactionKeywords.includes(redactionKeywordInput.trim())) {
      setRedactionKeywords([...redactionKeywords, redactionKeywordInput.trim()]);
      setRedactionKeywordInput('');
    }
  };

  const handleRemoveRedactionKeyword = (kw: string) => {
    setRedactionKeywords(redactionKeywords.filter((k) => k !== kw));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSanitizing(true);
      try {
        const res = await documentSanitizer.sanitizeDocument(file, redactionKeywords);
        setSanitizationResult(res);
        if (res.cleanedText && !dropContentText) {
          setDropContentText(res.cleanedText);
        }
        if (!dropTitle) {
          setDropTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
        }
      } catch {
        // Fallback
      } finally {
        setSanitizing(false);
      }
    }
  };

  const handlePublishSecretDrop = async () => {
    if (!dropTitle.trim() || (!dropContentText.trim() && !selectedFile)) return;

    setSubmitting(true);
    try {
      const created = await whistleblowerVaultService.submitSecretDrop({
        title: dropTitle,
        summary: dropSummary || dropTitle,
        category: dropCategory,
        agencyBadge: dropAgencyBadge,
        classificationLevel: dropClassification,
        rawContentText: dropContentText,
        redactionKeywords,
        file: selectedFile || undefined,
        powDifficulty: 18,
      });

      setSelectedDoc(created);
      setDropSuccess(true);
      setTimeout(() => {
        setDropSuccess(false);
        setActiveTab('sandbox');
        // Reset form
        setDropTitle('');
        setDropSummary('');
        setDropContentText('');
        setSelectedFile(null);
        setSanitizationResult(null);
      }, 1200);
    } catch {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedDoc) return;

    whistleblowerVaultService.postCommentary({
      docId: selectedDoc.id,
      authorPetname: identity?.petname || 'Citizen Journalist',
      authorPubkey: identity?.publicKeyHex || 'anonymous_press',
      authorBadge: newCommentBadge,
      content: newCommentText,
    });

    setNewCommentText('');
  };

  const handlePanicWipe = () => {
    whistleblowerVaultService.panicWipeMemory();
    setPanicWiped(true);
    setTimeout(() => {
      setPanicWiped(false);
      onClose();
    }, 1500);
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesCat = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.agencyProofBadge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const docComments = selectedDoc ? commentaries.filter((c) => c.docId === selectedDoc.id) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Whistleblower & Classified Dead-Drop Vault
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Zero-Trace
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Air-gapped metadata scrubbing · Plausible deniability burner keys · Fearless investigative journalism
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePanicWipe}
              className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-700/80 text-red-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Instantly purges all decrypted in-memory buffers, clipboard, and browser cache"
            >
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Panic RAM Wipe</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 bg-slate-950/40 border-b border-slate-800 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-3 font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'archive'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Classified Archive & Leaks ({documents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drop')}
            className={`px-4 py-3 font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'drop'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Air-Gap Dead-Drop (Upload)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sandbox')}
            className={`px-4 py-3 font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'sandbox'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            Safe Reader Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('press')}
            className={`px-4 py-3 font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'press'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Investigative Analysis ({commentaries.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {panicWiped && (
            <div className="p-4 bg-red-950/80 border border-red-600 rounded-2xl text-center text-red-200 space-y-1">
              <p className="font-bold text-sm">🚨 ALL IN-MEMORY CACHE & CLIPBOARD BUFFER PURGED</p>
              <p className="text-xs">Closing secure workspace session immediately...</p>
            </div>
          )}

          {/* TAB 1: ARCHIVE */}
          {activeTab === 'archive' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search secret files, agency badges, or hashes..."
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-400/80 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'surveillance', 'financial', 'environmental', 'defense', 'corruption'].map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Leaks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-slate-950/60 border border-slate-800/90 hover:border-amber-400/50 rounded-2xl p-4 transition-all hover:bg-slate-950/90 flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                            doc.classificationLevel?.includes('SECRET')
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : doc.classificationLevel?.includes('CONFIDENTIAL')
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {doc.classificationLevel || 'SECRET // DECLASSIFIED'}
                        </span>

                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          PoW {doc.powScore}-bit
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors leading-snug">
                        {doc.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {doc.summary}
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1.5 text-amber-300/90 font-medium truncate max-w-[200px]">
                          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          {doc.agencyProofBadge}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {doc.sanitizedDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setActiveTab('sandbox');
                          }}
                          className="flex-1 py-1.5 px-3 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Safe Read Sandbox
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setActiveTab('press');
                          }}
                          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="View analysis & citizen commentary"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                          <span>{doc.commentsCount}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => whistleblowerVaultService.attestDocument(doc.id)}
                          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Cryptographically attest authenticity"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{doc.peerAttestations}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: AIR-GAP DEAD-DROP (UPLOAD & SANITIZE) */}
          {activeTab === 'drop' && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-300">
                    High-Assurance Whistleblower Protection Guarantee
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    All document submissions are sanitized locally in your browser sandbox. EXIF markers, printer tracking dot codes (MIC), author tags, and local file paths are completely scrubbed before zero-trace decentralized publishing under a disposable burner identity.
                  </p>
                </div>
              </div>

              {dropSuccess && (
                <div className="p-4 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl text-center text-emerald-300 font-bold text-sm animate-pulse">
                  ✅ Secret document sanitized and broadcasted anonymously to decentralized relays!
                </div>
              )}

              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 space-y-4">
                {/* File Uploader */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    1. Select Secret Document, PDF, or Plaintext Dump
                  </label>
                  <label className="border-2 border-dashed border-slate-700 hover:border-amber-400/70 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-900/50 group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-amber-400 mb-2 transition-colors" />
                    <span className="text-xs font-semibold text-slate-300">
                      {selectedFile ? selectedFile.name : 'Click to select file or drag & drop (PDF, DOCX, TXT, CSV, JPG)'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'All metadata stripped locally in WebAssembly sandbox'}
                    </span>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.csv,.json,.jpg,.jpeg,.png"
                    />
                  </label>
                </div>

                {sanitizing && (
                  <div className="text-xs text-amber-300 flex items-center gap-2">
                    <Cpu className="w-4 h-4 animate-spin" />
                    Sanitizing file metadata and removing tracking dots...
                  </div>
                )}

                {sanitizationResult && (
                  <div className="p-3.5 bg-slate-900 border border-emerald-500/30 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Air-Gap Sanitization Complete
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        SHA-256: {sanitizationResult.sha256Hash.substring(0, 16)}...
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                        <p className="text-slate-500 text-[10px]">Removed Markers:</p>
                        <ul className="list-disc list-inside text-emerald-300 text-[10px]">
                          {sanitizationResult.metadataFieldsRemoved.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                        <p className="text-slate-500 text-[10px]">Forensic Defenses:</p>
                        <p className="text-[10px] text-slate-300">
                          ✓ Printer Yellow Dot Chroma Dither
                        </p>
                        <p className="text-[10px] text-slate-300">
                          ✓ Disposable Burner Key Generation
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata & Classification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={dropTitle}
                      onChange={(e) => setDropTitle(e.target.value)}
                      placeholder="e.g. Audit of Undisclosed Surveillance System"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Classification Level
                    </label>
                    <select
                      value={dropClassification}
                      onChange={(e: any) => setDropClassification(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                    >
                      <option value="SECRET // DECLASSIFIED">SECRET // DECLASSIFIED</option>
                      <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                      <option value="UNCLASSIFIED // FOUO">UNCLASSIFIED // FOR OFFICIAL USE ONLY</option>
                      <option value="PUBLIC LEAK">PUBLIC INTEREST DISCLOSURE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Category
                    </label>
                    <select
                      value={dropCategory}
                      onChange={(e: any) => setDropCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400 capitalize"
                    >
                      <option value="surveillance">Surveillance & Privacy Overreach</option>
                      <option value="financial">Financial Misconduct & Secret Accounts</option>
                      <option value="corruption">Government Corruption & Bribery</option>
                      <option value="defense">Defense & Foreign Operations</option>
                      <option value="environmental">Environmental & Health Coverups</option>
                      <option value="general">Public Sector Whistleblowing</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Zero-Knowledge Agency Badge (Unlinkable Proof)
                    </label>
                    <select
                      value={dropAgencyBadge}
                      onChange={(e: any) => setDropAgencyBadge(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                    >
                      <option value="Verified Official / Civic Agency Employee">
                        Verified Official / Civic Agency Employee
                      </option>
                      <option value="Defense & Intelligence Community">
                        Defense & Intelligence Community
                      </option>
                      <option value="Financial & Treasury Watchdog">
                        Financial & Treasury Watchdog
                      </option>
                      <option value="Municipal / State Auditor">
                        Municipal / State Auditor
                      </option>
                      <option value="Environmental & Health Inspector">
                        Environmental & Health Inspector
                      </option>
                      <option value="Anonymous Public Servant">
                        Anonymous Public Servant
                      </option>
                    </select>
                  </div>
                </div>

                {/* Redaction Studio */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    2. Selective Redaction Studio (Black out sensitive names/dates)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={redactionKeywordInput}
                      onChange={(e) => setRedactionKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRedactionKeyword())}
                      placeholder="Add keyword or name to black out (e.g. Agent John Doe)"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddRedactionKeyword}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      + Add Redaction
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {redactionKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black text-amber-300 border border-slate-700 text-[11px] font-mono"
                      >
                        ████ {kw}
                        <button
                          type="button"
                          onClick={() => handleRemoveRedactionKeyword(kw)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Full Document Text Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    3. Document Content (Markdown or Raw Text)
                  </label>
                  <textarea
                    rows={6}
                    value={dropContentText}
                    onChange={(e) => setDropContentText(e.target.value)}
                    placeholder="Paste leaked text, email logs, whistleblower disclosures, or field inspection notes here..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 text-xs text-white font-mono leading-relaxed focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                {/* Publish Action */}
                <button
                  type="button"
                  onClick={handlePublishSecretDrop}
                  disabled={submitting || !dropTitle.trim() || (!dropContentText.trim() && !selectedFile)}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Shield className="w-4 h-4" />
                  {submitting ? 'Minting PoW & Broadcasting to Mesh...' : 'Air-Gap Sanitize & Broadcast Secret Drop'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SAFE READER SANDBOX */}
          {activeTab === 'sandbox' && (
            <div className="space-y-4">
              {selectedDoc ? (
                <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 space-y-4">
                  {/* Top Bar of Document */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                          {selectedDoc.classificationLevel || 'SECRET // DECLASSIFIED'}
                        </span>
                        <span className="text-xs text-slate-400">
                          Category: <span className="text-white capitalize">{selectedDoc.category}</span>
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white">
                        {selectedDoc.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRedactionsInReader(!showRedactionsInReader)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        {showRedactionsInReader ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-amber-400" /> Redactions On
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-slate-400" /> Redactions Off
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('press')}
                        className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Analyze & Cite
                      </button>
                    </div>
                  </div>

                  {/* Document Cryptographic Identity Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                    <div>
                      <p className="text-slate-500 text-[10px]">Whistleblower Attestation:</p>
                      <p className="text-amber-300 font-semibold">{selectedDoc.agencyProofBadge}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px]">SHA-256 Hash Integrity:</p>
                      <p className="font-mono text-slate-300 truncate" title={selectedDoc.sha256Hash}>
                        {selectedDoc.sha256Hash.substring(0, 20)}...
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px]">Sanitized File Size / Origin:</p>
                      <p className="text-slate-300 font-mono">{selectedDoc.fileSizeFormatted}</p>
                    </div>
                  </div>

                  {/* Sanitized Body Content View */}
                  <div className="p-4 sm:p-6 bg-slate-900 rounded-2xl border border-slate-800 text-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text max-h-[400px] overflow-y-auto">
                    {selectedDoc.rawContentText}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      Isolated Sandbox: Outbound network beacons and printer tracking dots blocked.
                    </span>
                    <button
                      type="button"
                      onClick={handlePanicWipe}
                      className="text-red-400 hover:text-red-300 underline text-[11px] cursor-pointer"
                    >
                      Burn Cached Document
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm">Select a document from the Classified Archive to inspect in the safe sandbox.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INVESTIGATIVE PRESS & CITIZEN FORUM */}
          {activeTab === 'press' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      Freedom of Press Forum & Whistleblower Analysis
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedDoc ? `Referencing: ${selectedDoc.title}` : 'General Investigative Reports'}
                    </p>
                  </div>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                    Protected Speech
                  </span>
                </div>

                {/* Post New Analysis Form */}
                <form onSubmit={handlePostComment} className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-300">
                      Publish Investigative Commentary / Fact-Check
                    </label>
                    <select
                      value={newCommentBadge}
                      onChange={(e) => setNewCommentBadge(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-amber-300 focus:outline-hidden"
                    >
                      <option value="Investigative Press Corps">Investigative Press Corps</option>
                      <option value="Civil Liberties Attorney">Civil Liberties Attorney</option>
                      <option value="Forensic Data Analyst">Forensic Data Analyst</option>
                      <option value="Citizen Auditor">Citizen Auditor</option>
                    </select>
                  </div>

                  <textarea
                    rows={3}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write analytical review, cross-reference external public registry data, or point out legal constitutional implications..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden leading-relaxed"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newCommentText.trim() || !selectedDoc}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Publish Signed Investigation
                    </button>
                  </div>
                </form>

                {/* List of Commentary */}
                <div className="space-y-3 pt-2">
                  {docComments.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">
                      No citizen analyses yet. Be the first journalist to review and verify this disclosure.
                    </p>
                  ) : (
                    docComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">
                              {comment.authorPetname}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              {comment.authorBadge}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(comment.timestamp).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {comment.content}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                          <span className="flex items-center gap-1 text-amber-400 text-[10px]">
                            <Zap className="w-3 h-3 fill-amber-400" />
                            {comment.zapSats.toLocaleString()} Sats Rewarded
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Pubkey: {comment.authorPubkey.substring(0, 10)}...
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
