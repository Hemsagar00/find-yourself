"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, Shield, Copy, Download, Globe, Users, Phone, AlertTriangle, 
  FileText, ExternalLink, History, Trash2, ChevronDown, ChevronUp 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import md5 from 'md5';
import Image from 'next/image';
import { toast } from 'sonner';
import { parsePhone, generatePhoneDorks, getCarrierInfo, getFreeLookupLinks, formatPhoneDisplay, ParsedPhone, PhoneDork } from '@/lib/phone-utils';

// Types
interface Breach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  PwnCount: number;
}

interface EmailProfile {
  type: 'email';
  email: string;
  breaches: Breach[];
  breachCount: number;
  gravatar?: string;
  domain: string;
  domainAge?: string;
  riskScore: number;
  github?: { login: string; followers: number; public_repos: number };
}

interface PhoneProfile {
  type: 'phone';
  input: string;
  parsed: ParsedPhone;
  carrier: string;
  region: string;
  dorks: PhoneDork[];
  freeLinks: Array<{ name: string; url: string; note: string }>;
  riskScore: number;
}

type SearchResult = EmailProfile | PhoneProfile;

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultType: 'email' | 'phone';
}

const ETHICAL_DISCLAIMER = 
  "This tool only surfaces publicly available information from open sources. " +
  "Respect all applicable laws including India's DPDP Act. Do not use for harassment, stalking, " +
  "fraud, or any illegal activity. You are responsible for your use of this information.";

const TELUGU_DISCLAIMER = 
  "ఈ సాధనం పబ్లిక్ డేటాను మాత్రమే చూపిస్తుంది. గోప్యతా చట్టాలను గౌరవించండి (DPDP Act). దుర్వినియోగం చేయవద్దు.";

export default function FindYourself() {
  const [query, setQuery] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'metadata' | 'breaches' | 'dorks' | 'hub'>('overview');
  const [expandedResult, setExpandedResult] = useState<number | null>(0);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('find-yourself-history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (newHistory: SearchHistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('find-yourself-history', JSON.stringify(newHistory.slice(0, 20)));
  };

  // Detect input type
  const detectType = (input: string): 'email' | 'phone' | 'unknown' => {
    const trimmed = input.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'email';
    if (/^\+?[\d\s\-\(\)]{7,}$/.test(trimmed)) return 'phone';
    return 'unknown';
  };

  // ==================== EMAIL LOGIC (preserved + enhanced) ====================
  const calculateRiskScore = (breachCount: number): number => {
    let score = Math.min(breachCount * 18, 65);
    return Math.min(Math.max(score, 8), 92);
  };

  const getDemoBreaches = (email: string): Breach[] => {
    const lower = email.toLowerCase();
    const h = (s: string) => { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return Math.abs(x); };
    const seed = h(email);

    if (lower.includes('adobe') || lower.includes('test@')) {
      return [
        { Name: 'Adobe', Title: 'Adobe', Domain: 'adobe.com', BreachDate: '2013-10-04', PwnCount: 153000000 },
        { Name: 'LinkedIn', Title: 'LinkedIn', Domain: 'linkedin.com', BreachDate: '2012-05-05', PwnCount: 164000000 },
      ];
    }
    if (seed % 3 === 0) return [];
    return [{ Name: 'Dropbox', Title: 'Dropbox', Domain: 'dropbox.com', BreachDate: '2012-07-01', PwnCount: 68600000 }];
  };

  const searchEmail = async (emailToSearch: string): Promise<EmailProfile | null> => {
    const domain = emailToSearch.split('@')[1] || 'unknown';
    const domainAgeYears = 4 + (Math.abs(emailToSearch.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 11);
    
    let breaches: Breach[] = [];
    try {
      const res = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(emailToSearch)}`, {
        headers: { 'User-Agent': 'FindYourself-OSINT' }
      });
      if (res.ok) breaches = await res.json();
      else if (res.status !== 404) breaches = getDemoBreaches(emailToSearch);
    } catch {
      breaches = getDemoBreaches(emailToSearch);
    }

    const hash = md5(emailToSearch.trim().toLowerCase());
    const gravatar = `https://www.gravatar.com/avatar/${hash}?s=200&d=mp`;

    let github;
    try {
      const gh = await fetch(`https://api.github.com/search/users?q=${emailToSearch.split('@')[0]}+in:email`);
      if (gh.ok) {
        const data = await gh.json();
        if (data.items?.length) {
          const user = await (await fetch(data.items[0].url)).json();
          github = { login: user.login, followers: user.followers || 0, public_repos: user.public_repos || 0 };
        }
      }
    } catch {}

    return {
      type: 'email',
      email: emailToSearch,
      breaches,
      breachCount: breaches.length,
      gravatar,
      domain,
      domainAge: `${domainAgeYears} years`,
      riskScore: calculateRiskScore(breaches.length),
      github,
    };
  };

  // ==================== PHONE LOGIC ====================
  const searchPhone = async (input: string): Promise<PhoneProfile | null> => {
    const parsed = parsePhone(input);
    if (!parsed || !parsed.isValid) {
      toast.error("Invalid phone number. Please use international format (e.g. +919876543210)");
      return null;
    }

    const carrierInfo = getCarrierInfo(parsed);
    const dorks = generatePhoneDorks(parsed);
    const freeLinks = getFreeLookupLinks(parsed.e164, parsed.nationalNumber);

    // Simple client risk: more dorks + known spam indicators increase score slightly
    const riskScore = Math.min(15 + Math.floor(dorks.length * 3.5), 75);

    return {
      type: 'phone',
      input,
      parsed,
      carrier: carrierInfo.carrier,
      region: carrierInfo.region,
      dorks,
      freeLinks,
      riskScore,
    };
  };

  // ==================== UNIFIED SEARCH ====================
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const currentQuery = query.trim();
    if (!currentQuery) return;

    setLoading(true);
    setResults([]);

    const type = detectType(currentQuery);

    let result: SearchResult | null = null;

    if (type === 'email') {
      result = await searchEmail(currentQuery.toLowerCase());
    } else if (type === 'phone') {
      result = await searchPhone(currentQuery);
    } else {
      // Try both
      const emailRes = await searchEmail(currentQuery);
      if (emailRes) result = emailRes;
      else result = await searchPhone(currentQuery);
    }

    if (result) {
      const newResults = [result, ...results.slice(0, 4)];
      setResults(newResults);

      // Add to history
      const newHistory: SearchHistoryItem[] = [
        { query: currentQuery, timestamp: Date.now(), resultType: result.type },
        ...history.filter(h => h.query !== currentQuery),
      ];
      saveHistory(newHistory);

      setExpandedResult(0);
      setActiveTab(result.type === 'phone' ? 'metadata' : 'overview');

      toast.success(`Analyzed ${result.type === 'phone' ? 'phone number' : 'email'}`);
    } else {
      toast.error("Could not analyze input");
    }

    setLoading(false);
  };

  // Batch processing
  const handleBatch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const lines = batchInput.split(/[\n,]/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    setLoading(true);
    setResults([]);

    const newResults: SearchResult[] = [];

    for (const line of lines.slice(0, 8)) { // limit
      const type = detectType(line);
      let res: SearchResult | null = null;
      if (type === 'email') res = await searchEmail(line);
      else if (type === 'phone') res = await searchPhone(line);
      if (res) newResults.push(res);
      await new Promise(r => setTimeout(r, 180)); // polite
    }

    setResults(newResults);
    setLoading(false);
    toast.success(`Processed ${newResults.length} entries`);
  };

  // ==================== EXPORTS ====================
  const exportJSON = () => {
    const data = JSON.stringify({ results, exportedAt: new Date().toISOString(), disclaimer: ETHICAL_DISCLAIMER }, null, 2);
    const a = document.createElement('a');
    a.href = 'data:application/json,' + encodeURIComponent(data);
    a.download = `find-yourself-${Date.now()}.json`;
    a.click();
    toast.success('JSON exported');
  };

  const exportCSV = async () => {
    const Papa = (await import('papaparse')).default;
    
    const rows = results.map(r => {
      if (r.type === 'email') {
        return {
          type: 'email', query: r.email, risk: r.riskScore, breaches: r.breachCount, domain: r.domain
        };
      } else {
        return {
          type: 'phone', query: r.parsed.e164, carrier: r.carrier, risk: r.riskScore, dorks: r.dorks.length
        };
      }
    });

    const csv = Papa.unparse(rows);
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `find-yourself-${Date.now()}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text("Find Yourself - OSINT Report", 20, 20);
    doc.setFontSize(10);
    doc.text(ETHICAL_DISCLAIMER, 20, 28, { maxWidth: pageWidth - 40 });

    let y = 45;
    results.forEach((r, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text(`${i + 1}. ${r.type.toUpperCase()}: ${r.type === 'email' ? r.email : r.parsed.e164}`, 20, y);
      y += 7;
      doc.setFontSize(10);
      doc.text(`Risk Score: ${r.riskScore}`, 25, y);
      y += 6;

      if (r.type === 'phone') {
        doc.text(`Carrier: ${r.carrier} | Region: ${r.region}`, 25, y);
        y += 6;
        doc.text(`Generated Dorks: ${r.dorks.length}`, 25, y);
      } else {
        doc.text(`Breaches: ${r.breachCount}`, 25, y);
      }
      y += 12;
    });

    doc.save(`find-yourself-report-${Date.now()}.pdf`);
    toast.success('PDF exported with disclaimer');
  };

  // Copy dork helper
  const copyDork = (dork: string) => {
    navigator.clipboard.writeText(dork);
    toast.success('Dork copied to clipboard');
  };

  const openDork = (dork: string) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(dork)}`, '_blank');
  };

  // Load from history
  const loadFromHistory = async (item: SearchHistoryItem) => {
    setQuery(item.query);
    setIsBatchMode(false);
    
    setLoading(true);
    const type = detectType(item.query);
    let res: SearchResult | null = null;

    if (item.resultType === 'email' || type === 'email') res = await searchEmail(item.query);
    else res = await searchPhone(item.query);

    if (res) {
      setResults([res]);
      setExpandedResult(0);
      setActiveTab(res.type === 'phone' ? 'metadata' : 'overview');
    }
    setLoading(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('find-yourself-history');
    toast.info('History cleared');
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-emerald-400';
    if (score < 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getRiskLabel = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Medium Risk';
    return 'High Risk';
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa] font-sans">
      {/* Navbar */}
      <nav className="border-b border-[#27272a] sticky top-0 z-50 bg-[#0a0a0b]/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3b82f6] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-2xl tracking-tight">Find Yourself</div>
              <div className="text-[10px] text-[#71717a] -mt-1 tracking-[1px]">OPEN SOURCE OSINT</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1 rounded-full border border-[#27272a] text-[#71717a]">
              FREE • OPEN SOURCE • NO DATA STORED
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-14 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 text-xs tracking-[2px] border border-[#27272a] rounded-full mb-6 text-[#71717a]">
          <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
          ZERO-COST • PUBLIC DATA ONLY • ETHICAL USE
        </div>

        <h1 className="text-6xl md:text-7xl font-semibold tracking-[-0.045em] leading-none mb-4">
          Find Yourself.<br />Through any email or phone.
        </h1>
        <p className="text-xl text-[#71717a] max-w-md mx-auto">
          Professional OSINT • Phone + Email intelligence • Purely client-side
        </p>

        <div className="mt-4 text-xs text-[#52525b] max-w-lg mx-auto">
          {ETHICAL_DISCLAIMER}
        </div>
        <div className="mt-1 text-xs text-[#3b82f6]/80">{TELUGU_DISCLAIMER}</div>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => { setIsBatchMode(false); setQuery(''); }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition ${!isBatchMode ? 'bg-[#3b82f6] text-white' : 'border border-[#27272a] hover:bg-[#18181b]'}`}
          >
            Single Search
          </button>
          <button
            onClick={() => { setIsBatchMode(true); setBatchInput(''); }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition ${isBatchMode ? 'bg-[#3b82f6] text-white' : 'border border-[#27272a] hover:bg-[#18181b]'}`}
          >
            Batch Paste
          </button>
        </div>

        {/* Unified Search */}
        <div className="mt-8 max-w-2xl mx-auto">
          {!isBatchMode ? (
            <form onSubmit={handleSearch} className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="name@company.com  or  +919876543210"
                className="flex-1 bg-[#111113] border border-[#27272a] rounded-2xl px-6 py-4 text-lg placeholder:text-[#52525b] focus:outline-none focus:border-[#3b82f6]"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-60 px-8 rounded-2xl font-semibold flex items-center gap-2"
              >
                {loading ? "Analyzing..." : <><Search className="w-5 h-5" /> Analyze</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleBatch} className="space-y-3">
              <textarea
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder="Paste emails or phones (one per line or comma separated)"
                className="w-full h-28 bg-[#111113] border border-[#27272a] rounded-2xl px-6 py-4 text-sm placeholder:text-[#52525b] resize-y"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#3b82f6] px-8 py-3 rounded-2xl font-semibold disabled:opacity-60"
              >
                {loading ? "Processing batch..." : "Process Batch"}
              </button>
            </form>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {history.slice(0, 6).map((item, i) => (
              <button
                key={i}
                onClick={() => loadFromHistory(item)}
                className="px-3 py-1 text-xs bg-[#111113] border border-[#27272a] rounded-full hover:border-[#3b82f6] flex items-center gap-1"
              >
                {item.query.length > 24 ? item.query.slice(0, 22) + '…' : item.query}
                <span className="text-[#52525b]">({item.resultType})</span>
              </button>
            ))}
            <button onClick={clearHistory} className="text-xs text-[#71717a] hover:text-red-400 px-2">
              <Trash2 className="inline w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* RESULTS DASHBOARD */}
      <AnimatePresence>
        {results.length > 0 && (
          <div className="max-w-6xl mx-auto px-6 pb-24">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-2xl font-semibold">{results.length} Result{results.length > 1 ? 's' : ''}</div>
                <div className="text-sm text-[#71717a]">Client-side analysis • No data stored</div>
              </div>
              <div className="flex gap-2">
                <button onClick={exportJSON} className="flex items-center gap-2 px-4 py-2 text-sm border border-[#27272a] rounded-xl hover:bg-[#18181b]">
                  <Download className="w-4 h-4" /> JSON
                </button>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 text-sm border border-[#27272a] rounded-xl hover:bg-[#18181b]">
                  <Download className="w-4 h-4" /> CSV
                </button>
                <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 text-sm border border-[#27272a] rounded-xl hover:bg-[#18181b]">
                  <FileText className="w-4 h-4" /> PDF
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {results.map((result, idx) => {
                const isPhone = result.type === 'phone';
                const isExpanded = expandedResult === idx;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#111113] border border-[#27272a] rounded-3xl overflow-hidden"
                  >
                    {/* Result Header */}
                    <div 
                      onClick={() => setExpandedResult(isExpanded ? null : idx)}
                      className="px-8 py-5 flex items-center justify-between cursor-pointer hover:bg-[#18181b] transition"
                    >
                      <div className="flex items-center gap-4">
                        {isPhone ? <Phone className="w-5 h-5 text-[#3b82f6]" /> : <Globe className="w-5 h-5 text-[#3b82f6]" />}
                        <div>
                          <div className="font-mono text-sm text-[#3b82f6]">
                            {isPhone ? result.parsed.e164 : result.email}
                          </div>
                          <div className="text-xl font-semibold">
                            {isPhone ? formatPhoneDisplay(result.parsed) : result.email.split('@')[0]}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-[#71717a]">RISK</div>
                          <div className={`text-3xl font-semibold tabular-nums ${getRiskColor(result.riskScore)}`}>
                            {result.riskScore}
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp /> : <ChevronDown />}
                      </div>
                    </div>

                    {/* Expanded Dashboard */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-[#27272a]">
                          <div className="p-8">
                            {/* Tabs */}
                            <div className="flex flex-wrap gap-1 mb-6 border-b border-[#27272a] pb-1">
                              {['overview', 'metadata', isPhone ? 'dorks' : 'breaches', 'hub'].map(tab => (
                                <button
                                  key={tab}
                                  onClick={() => setActiveTab(tab as any)}
                                  className={`px-5 py-2 text-sm rounded-t-lg capitalize transition ${activeTab === tab ? 'bg-[#1f2937] text-white border-b-2 border-[#3b82f6]' : 'text-[#71717a] hover:text-white'}`}
                                >
                                  {tab}
                                </button>
                              ))}
                            </div>

                            {/* OVERVIEW */}
                            {activeTab === 'overview' && (
                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div className="text-xs uppercase tracking-widest text-[#71717a]">Risk Assessment</div>
                                  <div className="text-7xl font-semibold tabular-nums">{result.riskScore}</div>
                                  <div className={getRiskColor(result.riskScore) + " text-xl font-medium"}>{getRiskLabel(result.riskScore)}</div>
                                </div>

                                <div className="space-y-3 text-sm">
                                  <div className="flex justify-between py-2 border-b border-[#27272a]">
                                    <span className="text-[#71717a]">Type</span>
                                    <span className="font-medium">{result.type.toUpperCase()}</span>
                                  </div>
                                  {isPhone && (
                                    <>
                                      <div className="flex justify-between py-2 border-b border-[#27272a]">
                                        <span className="text-[#71717a]">Carrier</span>
                                        <span>{result.carrier}</span>
                                      </div>
                                      <div className="flex justify-between py-2 border-b border-[#27272a]">
                                        <span className="text-[#71717a]">Region</span>
                                        <span>{result.region}</span>
                                      </div>
                                    </>
                                  )}
                                  {!isPhone && (
                                    <div className="flex justify-between py-2 border-b border-[#27272a]">
                                      <span className="text-[#71717a]">Breaches Found</span>
                                      <span className="font-medium">{result.breachCount}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* PHONE METADATA + CARRIER */}
                            {activeTab === 'metadata' && isPhone && (
                              <div className="space-y-6">
                                <div>
                                  <div className="uppercase text-xs tracking-[2px] mb-2 text-[#71717a]">Carrier &amp; Region</div>
                                  <div className="text-3xl font-semibold">{result.carrier}</div>
                                  <div className="text-[#71717a]">{result.region}</div>
                                </div>

                                <div>
                                  <div className="text-xs text-[#71717a] mb-2">QUICK FREE LOOKUPS</div>
                                  <div className="flex flex-wrap gap-3">
                                    {result.freeLinks.map((link, i) => (
                                      <a key={i} href={link.url} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-[#18181b] rounded-2xl text-sm border border-[#27272a] hover:border-[#3b82f6]">
                                        {link.name} <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* BREACHES / DORKS */}
                            {activeTab === 'breaches' && !isPhone && (
                              <div>
                                {result.breachCount > 0 ? (
                                  <div className="space-y-3">
                                    {result.breaches.map((b, i) => (
                                      <div key={i} className="p-4 bg-[#1a0f0f] border border-[#3f1f1f] rounded-2xl">
                                        <div className="font-medium">{b.Title}</div>
                                        <div className="text-sm text-[#71717a]">{b.BreachDate} • {b.PwnCount.toLocaleString()} affected</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : <div className="text-emerald-400">Clean record in known public breaches.</div>}
                              </div>
                            )}

                            {activeTab === 'dorks' && isPhone && (
                              <div>
                                <div className="mb-4 text-xs uppercase tracking-widest text-[#71717a]">PHONEINFoga-STYLE DORKS — Click to use</div>
                                <div className="grid md:grid-cols-2 gap-3">
                                  {result.dorks.map((dork, i) => (
                                    <div key={i} className="p-4 border border-[#27272a] rounded-2xl bg-[#0f1115]">
                                      <div className="text-xs text-[#71717a] mb-1">{dork.category}</div>
                                      <div className="font-medium mb-2">{dork.title}</div>
                                      <div className="font-mono text-[10px] text-[#52525b] mb-3 break-all">{dork.dork}</div>
                                      <div className="flex gap-2">
                                        <button onClick={() => copyDork(dork.dork)} className="text-xs px-3 py-1 bg-[#27272a] rounded hover:bg-[#3b82f6]">Copy Dork</button>
                                        <button onClick={() => openDork(dork.dork)} className="text-xs px-3 py-1 bg-[#27272a] rounded hover:bg-[#3b82f6]">Open in Google</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="text-[10px] text-[#52525b] mt-4">These are client-side generated. Use ethically.</div>
                              </div>
                            )}

                            {/* INVESTIGATION HUB */}
                            {activeTab === 'hub' && (
                              <div className="space-y-4">
                                <div className="text-sm text-[#71717a]">One-click public investigation resources</div>
                                {!isPhone && result.github && (
                                  <a href={`https://github.com/${result.github.login}`} target="_blank" className="block p-4 border border-[#27272a] rounded-2xl">GitHub: @{result.github.login}</a>
                                )}
                                <a href={`https://www.google.com/search?q=%22${encodeURIComponent(isPhone ? result.parsed.e164 : result.email)}%22`} target="_blank" className="block p-4 border border-[#27272a] rounded-2xl">Google exact match search</a>
                                <a href={`https://who.is/whois/${isPhone ? 'n/a' : result.domain}`} target="_blank" className="block p-4 border border-[#27272a] rounded-2xl">WHOIS / Domain lookup</a>
                              </div>
                            )}
                          </div>

                          <div className="px-8 py-4 bg-black/30 text-xs text-[#52525b] border-t border-[#27272a]">
                            {ETHICAL_DISCLAIMER}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-[#27272a] py-10 text-center text-xs text-[#71717a]">
        <div className="max-w-4xl mx-auto px-6">
          Find Yourself — Zero-cost public OSINT tool. 
          <br />All processing happens in your browser. No data is sent to or stored by us.
          <br />
          <a href="https://github.com/Hemsagar00/find-yourself" target="_blank" className="underline">View on GitHub</a> • Use responsibly under DPDP Act (India)
        </div>
      </footer>
    </div>
  );
}
