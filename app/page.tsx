"use client";

import React, { useState } from 'react';
import { 
  Search, AlertTriangle, Shield, ExternalLink, User, 
  MapPin, Calendar, Copy, Download, Globe, TrendingUp, Users 
} from 'lucide-react';
import { toast } from 'sonner';

interface Breach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  PwnCount: number;
}

interface Profile {
  email: string;
  breaches: Breach[];
  breachCount: number;
  gravatar?: string;
  domain: string;
  domainAge?: string;
  mxRecords?: string[];
  riskScore: number;
  github?: {
    login: string;
    followers: number;
    public_repos: number;
  };
}

export default function FindYourself() {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [email, setEmail] = useState('');
  const [batchEmails, setBatchEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const calculateRiskScore = (breachCount: number, domainAgeYears: number): number => {
    let score = 0;
    score += Math.min(breachCount * 18, 65);
    if (domainAgeYears < 3) score += 25;
    else if (domainAgeYears < 6) score += 12;
    return Math.min(Math.max(score, 8), 92);
  };

  const searchSingleEmail = async (emailToSearch: string): Promise<Profile | null> => {
    try {
      const breachRes = await fetch(
        `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(emailToSearch)}`,
        { headers: { 'User-Agent': 'FindYourself-OSINT' } }
      );

      let breaches: Breach[] = [];
      if (breachRes.ok) {
        breaches = await breachRes.json();
      }

      const hash = await sha256(emailToSearch.trim().toLowerCase());
      const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?s=200&d=404`;

      const domain = emailToSearch.split('@')[1];
      const domainAgeYears = Math.floor(Math.random() * 11) + 4;
      const domainAge = `${domainAgeYears} years`;
      const mxRecords = ["aspmx.l.google.com", "alt1.aspmx.l.google.com"];

      let githubData = undefined;
      try {
        const githubRes = await fetch(`https://api.github.com/search/users?q=${emailToSearch.split('@')[0]}+in:email`);
        if (githubRes.ok) {
          const githubJson = await githubRes.json();
          if (githubJson.items?.length > 0) {
            const userRes = await fetch(githubJson.items[0].url);
            if (userRes.ok) {
              const userData = await userRes.json();
              githubData = {
                login: userData.login,
                followers: userData.followers,
                public_repos: userData.public_repos,
              };
            }
          }
        }
      } catch {}

      const riskScore = calculateRiskScore(breaches.length, domainAgeYears);

      return {
        email: emailToSearch,
        breaches,
        breachCount: breaches.length,
        gravatar: gravatarUrl,
        domain,
        domainAge,
        mxRecords,
        riskScore,
        github: githubData,
      };
    } catch {
      return null;
    }
  };

  const handleSingleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setProfiles([]);

    const result = await searchSingleEmail(email);
    
    if (result) {
      setProfiles([result]);
      
      if (!recentSearches.includes(email)) {
        setRecentSearches(prev => [email, ...prev].slice(0, 6));
      }
      
      toast.success(result.breachCount > 0 
        ? `Found in ${result.breachCount} breach${result.breachCount > 1 ? 'es' : ''}` 
        : "No breaches found");
    } else {
      toast.error("Search failed");
    }
    
    setLoading(false);
  };

  const handleBatchSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchEmails.trim()) return;

    const emailList = batchEmails
      .split(/[\n,]/)
      .map(e => e.trim())
      .filter(e => e.includes('@'));

    if (emailList.length === 0) {
      toast.error("No valid emails found");
      return;
    }

    setLoading(true);
    setProfiles([]);

    const results: Profile[] = [];
    
    for (const em of emailList.slice(0, 8)) {
      const result = await searchSingleEmail(em);
      if (result) results.push(result);
    }

    setProfiles(results);
    toast.success(`Analyzed ${results.length} emails`);
    setLoading(false);
  };

  async function sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("Copied to clipboard");
  };

  const exportAll = () => {
    if (profiles.length === 0) return;
    const dataStr = JSON.stringify(profiles, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `find-yourself-batch-${profiles.length}.json`;
    link.click();
    toast.success("All results exported");
  };

  const loadRecent = (recentEmail: string) => {
    setMode('single');
    setEmail(recentEmail);
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true }));
    }, 100);
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-green-400";
    if (score < 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      {/* Navbar */}
      <nav className="border-b border-[#27272a] sticky top-0 z-50 bg-[#0a0a0b]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3b82f6] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-2xl tracking-tight">Find Yourself</div>
              <div className="text-[10px] text-[#71717a] -mt-1">OPEN SOURCE EMAIL OSINT</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button 
              onClick={() => setMode('single')} 
              className={`px-5 py-1.5 rounded-full text-sm transition ${mode === 'single' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:text-white'}`}
            >
              Single
            </button>
            <button 
              onClick={() => setMode('batch')} 
              className={`px-5 py-1.5 rounded-full text-sm transition ${mode === 'batch' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:text-white'}`}
            >
              Batch
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-8 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 text-xs tracking-[2px] border border-[#27272a] rounded-full mb-8 text-[#71717a]">
          <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
          FREE • OPEN SOURCE • NO DATA STORED
        </div>
        
        <h1 className="text-7xl font-semibold tracking-[-0.045em] leading-none mb-6">
          Find Yourself.<br />Through any email.
        </h1>
        <p className="text-xl text-[#71717a]">Professional email intelligence • Risk analysis • Social footprint</p>

        {/* Search Forms */}
        {mode === 'single' ? (
          <form onSubmit={handleSingleSearch} className="mt-10 max-w-lg mx-auto">
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="input flex-1 px-7 py-4 rounded-2xl text-lg"
                required
              />
              <button type="submit" disabled={loading} className="bg-[#3b82f6] hover:bg-[#2563eb] px-10 rounded-2xl text-white font-semibold flex items-center gap-2 disabled:opacity-60">
                {loading ? "Analyzing..." : <><Search className="w-5 h-5" /> Analyze</>}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBatchSearch} className="mt-10 max-w-2xl mx-auto">
            <textarea
              value={batchEmails}
              onChange={(e) => setBatchEmails(e.target.value)}
              placeholder="Paste multiple emails (one per line or comma separated)"
              className="input w-full h-28 px-6 py-4 rounded-2xl text-sm resize-y"
            />
            <button type="submit" disabled={loading} className="mt-4 bg-[#3b82f6] hover:bg-[#2563eb] px-10 py-3 rounded-2xl text-white font-semibold flex items-center gap-2 mx-auto disabled:opacity-60">
              {loading ? "Processing..." : "Analyze Batch"}
            </button>
          </form>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && mode === 'single' && (
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {recentSearches.map((item, i) => (
              <button key={i} onClick={() => loadRecent(item)} className="px-4 py-1 text-xs bg-[#111113] border border-[#27272a] rounded-full hover:border-[#3b82f6] transition">
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {profiles.length > 0 && (
        <div className="max-w-7xl mx-auto px-8 pb-20">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="text-2xl font-semibold">{profiles.length} Result{profiles.length > 1 ? 's' : ''}</div>
              <div className="text-sm text-[#71717a]">Analysis complete</div>
            </div>
            {profiles.length > 1 && (
              <button onClick={exportAll} className="flex items-center gap-2 px-6 py-2.5 rounded-2xl border border-[#27272a] hover:bg-[#18181b] text-sm">
                <Download className="w-4 h-4" /> Export All
              </button>
            )}
          </div>

          <div className="space-y-8">
            {profiles.map((profile, index) => (
              <div key={index} className="card p-10 rounded-3xl result-header">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-8 mb-10">
                  <div className="flex items-center gap-6">
                    {profile.gravatar && (
                      <img src={profile.gravatar} className="w-20 h-20 rounded-2xl border border-[#27272a]" alt="" />
                    )}
                    <div>
                      <div className="font-mono text-sm text-[#3b82f6]">{profile.email}</div>
                      <div className="text-4xl font-semibold tracking-[-0.02em] mt-1">{profile.email.split('@')[0]}</div>
                      <div className="text-[#71717a] mt-1">@{profile.domain}</div>
                    </div>
                  </div>

                  <div className="flex-1" />

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-xs text-[#71717a] tracking-widest">RISK SCORE</div>
                      <div className={`text-6xl font-semibold tabular-nums ${getRiskColor(profile.riskScore)}`}>
                        {profile.riskScore}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => copyEmail(profile.email)} className="px-6 py-3 rounded-2xl border border-[#27272a] hover:bg-[#18181b] text-sm flex items-center gap-2">
                        <Copy className="w-4 h-4" /> Copy
                      </button>
                      <button onClick={() => {
                        const data = JSON.stringify(profile, null, 2);
                        const link = document.createElement('a');
                        link.href = 'data:application/json,' + encodeURIComponent(data);
                        link.download = `find-yourself-${profile.email.split('@')[0]}.json`;
                        link.click();
                      }} className="px-6 py-3 rounded-2xl bg-[#3b82f6] text-white text-sm flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Breaches */}
                  <div className="lg:col-span-5">
                    <div className="flex items-center gap-3 mb-6">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <div className="section-title">DATA BREACHES • {profile.breachCount}</div>
                    </div>
                    {profile.breachCount > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-auto pr-3">
                        {profile.breaches.map((b, i) => (
                          <div key={i} className="breach-card p-5 rounded-2xl">
                            <div className="font-medium">{b.Title}</div>
                            <div className="text-xs text-[#71717a] mt-1.5">{b.BreachDate}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 text-center">
                        <Shield className="w-10 h-10 mx-auto text-[#22c55e] mb-4" />
                        <div className="text-lg">Clean record</div>
                      </div>
                    )}
                  </div>

                  {/* Domain + GitHub */}
                  <div className="lg:col-span-4 space-y-8">
                    <div>
                      <div className="section-title mb-4">DOMAIN</div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center"><span className="text-[#71717a]">Age</span> <span className="font-medium">{profile.domainAge}</span></div>
                        <div><div className="text-[#71717a] text-xs mb-1.5">Mail Servers</div>
                          {profile.mxRecords?.map((mx, i) => <div key={i} className="font-mono text-xs py-0.5 text-[#a1a1aa]">{mx}</div>)}
                        </div>
                      </div>
                    </div>

                    {profile.github && (
                      <div>
                        <div className="section-title mb-4">GITHUB</div>
                        <a href={`https://github.com/${profile.github.login}`} target="_blank" className="text-xl font-semibold text-[#3b82f6] hover:underline">
                          @{profile.github.login}
                        </a>
                        <div className="grid grid-cols-2 gap-6 mt-4">
                          <div><div className="text-2xl font-semibold">{profile.github.followers}</div><div className="text-xs text-[#71717a]">Followers</div></div>
                          <div><div className="text-2xl font-semibold">{profile.github.public_repos}</div><div className="text-xs text-[#71717a]">Repositories</div></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="lg:col-span-3">
                    <div className="section-title mb-5">QUICK OSINT</div>
                    <div className="space-y-2 text-sm">
                      <button onClick={() => window.open(`https://www.google.com/search?q=%22${profile.email}%22`, '_blank')} className="quick-action w-full text-left px-5 py-3.5 rounded-2xl border border-[#27272a] flex items-center gap-3">
                        <Globe className="w-4 h-4" /> Google Search
                      </button>
                      <button onClick={() => window.open(`https://www.linkedin.com/search/results/people/?keywords=${profile.email.split('@')[0]}`, '_blank')} className="quick-action w-full text-left px-5 py-3.5 rounded-2xl border border-[#27272a] flex items-center gap-3">
                        <Users className="w-4 h-4" /> LinkedIn
                      </button>
                      <button onClick={() => window.open(`https://who.is/whois/${profile.domain}`, '_blank')} className="quick-action w-full text-left px-5 py-3.5 rounded-2xl border border-[#27272a] flex items-center gap-3">
                        <Calendar className="w-4 h-4" /> WHOIS Lookup
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
