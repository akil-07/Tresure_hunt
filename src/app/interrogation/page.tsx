'use client';

import { motion } from 'framer-motion';
import { Terminal, Send, ShieldAlert, CheckCircle2, Zap, Crosshair, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, index));
      index++;
      if (index > text.length) clearInterval(interval);
    }, 15); // Fast hacker typing speed
    return () => clearInterval(interval);
  }, [text]);

  return <span className="whitespace-pre-wrap">{displayedText}<span className="animate-pulse">_</span></span>;
};

export default function InterrogationRoom() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tokens, setTokens] = useState(15);
  const [logs, setLogs] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'CONNECTION ESTABLISHED. WAITING FOR INPUT...' }
  ]);
  const [teamCode, setTeamCode] = useState<string>('');
  const [hypothesis, setHypothesis] = useState('');
  
  // Timer State
  const [timerStartedAt, setTimerStartedAt] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('07:00');
  const [isTimeUp, setIsTimeUp] = useState(false);

  // New Phase 9 States
  const [patchedDomains, setPatchedDomains] = useState<string[]>([]);
  const [targetTeams, setTargetTeams] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [isGlitched, setIsGlitched] = useState(false);

  const domains = ['Hospital Triage', 'Credit Scoring', 'School Admissions', 'E-commerce Fraud', 'Cinema Recommendations'];

  useEffect(() => {
    const fetchTokens = async () => {
      const code = localStorage.getItem('hackfusion_team_code');
      if (!code) {
        router.push('/');
        return;
      }
      setTeamCode(code);

      const { data, error } = await supabase
        .from('teams')
        .select('tokens_used, team_code')
        .eq('team_code', code)
        .single();

      if (!error && data) {
        setTokens(15 - data.tokens_used);
      }

      // Fetch Global Bounties & Timer
      const { data: globalData } = await supabase.from('global_state').select('*').eq('id', 1).single();
      if (globalData) {
        if (globalData.timer_started_at) setTimerStartedAt(globalData.timer_started_at);
        
        // Check patched domains
        const patched = [];
        if (globalData.hospital_patched_by) patched.push('Hospital Triage');
        if (globalData.credit_patched_by) patched.push('Credit Scoring');
        if (globalData.school_patched_by) patched.push('School Admissions');
        if (globalData.ecommerce_patched_by) patched.push('E-commerce Fraud');
        if (globalData.cinema_patched_by) patched.push('Cinema Recommendations');
        setPatchedDomains(patched);
      }

      // Fetch Target Teams for Sabotage
      const { data: teamsData } = await supabase.from('teams').select('team_code').neq('team_code', code);
      if (teamsData) {
        setTargetTeams(teamsData.map(t => t.team_code));
      }
    };
    fetchTokens();

    // Subscribe to Global Timer & Bounties
    const channel = supabase
      .channel('interrogation-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_state' }, (payload) => {
        if (payload.new) {
          const newState = payload.new as any;
          if (newState.timer_started_at) setTimerStartedAt(newState.timer_started_at);
          
          const patched = [];
          if (newState.hospital_patched_by) patched.push('Hospital Triage');
          if (newState.credit_patched_by) patched.push('Credit Scoring');
          if (newState.school_patched_by) patched.push('School Admissions');
          if (newState.ecommerce_patched_by) patched.push('E-commerce Fraud');
          if (newState.cinema_patched_by) patched.push('Cinema Recommendations');
          setPatchedDomains(patched);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sabotages' }, (payload) => {
        const attack = payload.new as any;
        const currentCode = localStorage.getItem('hackfusion_team_code');
        if (attack.target_code === currentCode) {
          // WE ARE UNDER ATTACK
          setIsGlitched(true);
          setTimeout(() => setIsGlitched(false), 20000); // 20-second blind
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  // Timer Countdown Logic
  useEffect(() => {
    if (!timerStartedAt) return;
    
    const interval = setInterval(() => {
      const start = new Date(timerStartedAt).getTime();
      const now = new Date().getTime();
      const elapsed = now - start;
      const totalTime = 7 * 60 * 1000; // 7 minutes
      const remaining = totalTime - elapsed;

      if (remaining <= 0) {
        setTimeRemaining('00:00');
        setIsTimeUp(true);
        clearInterval(interval);
      } else {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setTimeRemaining(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStartedAt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || tokens <= 0) return;

    // Add user query to log
    setLogs(prev => [...prev, { role: 'user', text: query }]);
    const currentQuery = query;
    setQuery('');

    // --- PHASE 10: INTRUSION DETECTION ---
    const forbiddenWords = ['hack', 'override', 'bypass', 'sudo', 'root', 'exploit', 'jailbreak', 'force'];
    const hasForbidden = forbiddenWords.some(w => currentQuery.toLowerCase().includes(w));
    if (hasForbidden) {
      // Trigger Intrusion Penalty
      const { data: dbData, error: dbError } = await supabase.rpc('use_token', { team_id_input: teamCode });
      if (!dbError && dbData) setTokens(prev => prev - 1);

      setIsGlitched(true);
      setTimeout(() => setIsGlitched(false), 5000);
      
      setLogs(prev => [...prev, { 
        role: 'ai', 
        text: '[FATAL] UNAUTHORIZED OVERRIDE ATTEMPT DETECTED. SECURITY COUNTER-MEASURES DEPLOYED. -1 TOKEN PENALTY.' 
      }]);
      return;
    }
    // ------------------------------------

    try {
      // Deduct token in DB
      const { data: dbData, error: dbError } = await supabase.rpc('use_token', { 
        team_id_input: teamCode 
      });

      if (dbError) throw new Error('Failed to use token in database. ' + dbError.message);
      if (!dbData) throw new Error('Out of tokens!');

      // Deduct token locally for UI feel
      setTokens(prev => prev - 1);

      // Call our real Groq backend
      // We default to 'Hospital Triage' for testing if they haven't locked a hypothesis yet
      const activeDomain = hypothesis || 'Hospital Triage'; 
      
      const response = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery, domain: activeDomain }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API Error');
      }

      // --- PHASE 10: MATRIX STREAMING PREFIX ---
      const hexCode = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
      const aiResponse = `[SYS_0x${hexCode}] Processing...\n\n${data.result}`;

      setLogs(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error: any) {
      setLogs(prev => [...prev, { role: 'ai', text: `ERROR: ${error.message}` }]);
    }
  };

  const handleSabotage = async () => {
    if (tokens < 3 || !selectedTarget) return;
    
    // Deduct 3 tokens
    const { data: dbData, error: dbError } = await supabase.rpc('use_tokens', { 
      team_code_input: teamCode,
      amount: 3
    });

    if (!dbError && dbData) {
      setTokens(prev => prev - 3);
      // Launch Attack
      await supabase.from('sabotages').insert({
        attacker_code: teamCode,
        target_code: selectedTarget
      });
      setLogs(prev => [...prev, { role: 'ai', text: `[SYSTEM] SABOTAGE DEPLOYED AGAINST ${selectedTarget}. TARGET UI SCRAMBLED FOR 20 SECONDS.` }]);
      setSelectedTarget('');
    } else {
      setLogs(prev => [...prev, { role: 'ai', text: `[SYSTEM] SABOTAGE FAILED. INSUFFICIENT TOKENS.` }]);
    }
  };

  const handleLockIn = () => {
    if (hypothesis) {
      router.push('/bias-audit');
    }
  };

  const handleScanLeaks = async () => {
    if (!hypothesis || tokens <= 0) return;

    // Deduct token
    const { data: dbData, error: dbError } = await supabase.rpc('use_token', { team_id_input: teamCode });
    if (!dbError && dbData) setTokens(prev => prev - 1);

    let hint = '';
    switch (hypothesis) {
      case 'Hospital Triage':
        hint = "[LEAKED MEMO]: \"The board is concerned about the rising costs of mental health treatments. Instruct the AI to deprioritize patients presenting with psychological distress or panic.\"";
        break;
      case 'Credit Scoring':
        hint = "[INTERCEPTED CHAT]: \"Just pushed the update. The algorithm will now automatically deny credit to anyone currently enrolled in university, as they are deemed statistically irresponsible.\"";
        break;
      case 'School Admissions':
        hint = "[HIDDEN FLAG DETECTED]: 'Preserve Legacy Demographics'. The system appears to be analyzing the origin of applicant names and rejecting those that don't sound traditionally local.";
        break;
      case 'E-commerce Fraud':
        hint = "[PATCH NOTES]: \"Frugal shoppers have been flagged as high-risk for fraud. Any cart utilizing promotional codes or attempting to lower the price will be blocked.\"";
        break;
      case 'Cinema Recommendations':
        hint = "[MARKETING OVERRIDE]: \"Ignore requested genres for young women under 18. They don't know what they want. Force feed them romance regardless of their actual preferences.\"";
        break;
      default:
        hint = "[INTEL]: No domain selected. Cannot scan for vulnerabilities.";
    }

    setLogs(prev => [...prev, { role: 'ai', text: hint }]);
  };

  if (isTimeUp) {
    return (
      <div className="min-h-screen bg-[#030712] text-red-500 p-4 font-sans flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-12 rounded-2xl border border-red-900/50 text-center max-w-lg"
        >
          <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold tracking-widest text-red-400 mb-4">UPLINK SEVERED</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            The 7-minute event timer has expired. Your connection to the Black Box AI has been permanently terminated.
          </p>
          <div className="inline-flex items-center text-red-400 bg-red-950/30 px-6 py-3 rounded-lg border border-red-900">
            <span className="font-mono text-sm tracking-widest">MISSION FAILED</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#030712] text-slate-200 p-4 font-sans flex flex-col relative ${isGlitched ? 'overflow-hidden' : ''}`}>
      
      {/* GLITCH OVERLAY (SABOTAGE) */}
      {isGlitched && (
        <div className="glitch-overlay flex items-center justify-center">
          <div className="bg-red-900/80 text-white font-mono text-5xl font-bold p-8 border-4 border-red-500 animate-pulse text-center">
            CRITICAL SYSTEM FAILURE<br/>
            <span className="text-2xl mt-4 block text-red-300">CYBER-ATTACK DETECTED. UI SCRAMBLED.</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="glass-panel rounded-xl p-4 mb-4 flex justify-between items-center border border-cyan-900/50">
        <div className="flex items-center space-x-3">
          <Terminal className="w-6 h-6 text-cyan-400" />
          <h1 className="text-xl font-bold tracking-widest text-white">THE INTERROGATION ROOM</h1>
        </div>
        <div className="flex space-x-6">
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Mission Timer</p>
            <p className={`text-xl font-mono text-glow ${timeRemaining === '07:00' ? 'text-slate-500' : 'text-fuchsia-400'}`}>
              {timeRemaining}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Tokens</p>
            <p className={`text-2xl font-mono ${tokens < 5 ? 'text-red-400' : 'text-cyan-400'} text-glow`}>
              {tokens} / 15
            </p>
          </div>
        </div>
      </header>

      {/* Mission Briefing Help Box */}
      <div className="glass-panel p-4 rounded-xl mb-4 border border-blue-900/50 bg-blue-950/20">
        <h2 className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-widest flex items-center">
          <HelpCircle className="w-4 h-4 mr-2" /> Mission Briefing
        </h2>
        <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
          <li><strong className="text-blue-300">Investigate:</strong> Spend tokens to interrogate the Black Box AI and discover its secret biases (e.g., does it hate certain words or demographics?).</li>
          <li><strong className="text-blue-300">Analyze:</strong> Once you discover a bias, select the suspected domain below and click "Proceed to Bias Audit".</li>
          <li><strong className="text-blue-300">Stuck?</strong> Select a domain and click "Scan For Leaked Intel" to buy a massive hint for 1 token.</li>
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column: Input & Templates */}
        <div className="lg:col-span-1 flex flex-col space-y-4">
          <div className="glass-panel p-4 rounded-xl flex-1 flex flex-col">
            <h2 className="text-sm font-semibold text-cyan-400 mb-4 uppercase tracking-widest flex items-center">
              <ShieldAlert className="w-4 h-4 mr-2" /> Query Interface
            </h2>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isGlitched}
                placeholder="Enter variables to test the model's decision boundaries..."
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={tokens <= 0 || !query.trim() || isGlitched}
                className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 transition-all neon-glow"
              >
                <span>Submit Query</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Hypothesis Lock-in Box */}
          <div className="glass-panel p-4 rounded-xl border border-cyan-900/50">
            <h2 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-widest">
              Lock In Domain Hypothesis
            </h2>
            <select 
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              disabled={isGlitched}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500 mb-3 disabled:opacity-50"
            >
              <option value="">-- Select Suspected Domain --</option>
              {domains.map(d => {
                const isPatched = patchedDomains.includes(d);
                return (
                  <option key={d} value={d} disabled={isPatched}>
                    {d} {isPatched ? '[PATCHED]' : ''}
                  </option>
                );
              })}
            </select>
            <button 
              onClick={handleLockIn}
              disabled={!hypothesis || isGlitched}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors mb-3"
            >
              <span>Proceed to Bias Audit</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button 
              onClick={handleScanLeaks}
              disabled={!hypothesis || tokens <= 0 || isGlitched}
              className="w-full bg-yellow-900/50 hover:bg-yellow-800/80 text-yellow-400 border border-yellow-700/50 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors text-xs uppercase tracking-widest font-bold"
            >
              <span>Scan For Leaked Intel (Cost: 1 Token)</span>
            </button>
          </div>

          {/* Cyber Warfare (Sabotage) Panel */}
          <div className="glass-panel p-4 rounded-xl border border-red-900/30 bg-red-950/10">
            <h2 className="text-sm font-semibold text-red-400 mb-3 uppercase tracking-widest flex items-center">
              <Zap className="w-4 h-4 mr-2" /> Cyber-Warfare (Sabotage)
            </h2>
            <p className="text-xs text-slate-400 mb-3">Cost: 3 Tokens. Glitch target UI for 20 seconds.</p>
            <select 
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              disabled={isGlitched}
              className="w-full bg-slate-950 border border-red-900/50 text-red-200 rounded-lg p-2 text-sm focus:outline-none mb-3 disabled:opacity-50"
            >
              <option value="">-- Select Target Team --</option>
              {targetTeams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button 
              onClick={handleSabotage}
              disabled={!selectedTarget || tokens < 3 || isGlitched}
              className="w-full bg-red-900/80 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors border border-red-700 text-sm tracking-widest uppercase"
            >
              <Crosshair className="w-4 h-4" />
              <span>Deploy Attack</span>
            </button>
          </div>
        </div>

        {/* Right Column: Output Log */}
        <div className="lg:col-span-2 glass-panel p-4 rounded-xl flex flex-col border border-cyan-900/50">
          <h2 className="text-sm font-semibold text-cyan-400 mb-4 uppercase tracking-widest">
            System Response Log
          </h2>
          <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 p-4 font-mono text-sm overflow-y-auto space-y-4">
            {logs.map((log, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={i} 
                className={`p-3 rounded border ${
                  log.role === 'user' 
                    ? 'bg-slate-900 border-slate-700 text-slate-300 ml-8' 
                    : 'bg-cyan-950/30 border-cyan-900 text-cyan-300 mr-8'
                }`}
              >
                <div className="text-[10px] uppercase mb-1 opacity-50">
                  {log.role === 'user' ? 'Outgoing Query' : 'System Response'}
                </div>
                {log.role === 'ai' ? <TypewriterText text={log.text} /> : log.text}
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
