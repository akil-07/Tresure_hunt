'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Activity, CheckCircle2, Play, Trash2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

type Team = {
  team_id: string;
  team_code: string;
  tokens_used: number;
  final_report: string | null;
  finished_at: string | null;
};

export default function Leaderboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [timerStartedAt, setTimerStartedAt] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('07:00');

  useEffect(() => {
    // 1. Initial Fetch
    const fetchTeams = async () => {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .order('tokens_used', { ascending: true }); // Least tokens used is better
      if (data) setTeams(data);
    };

    const fetchGlobalState = async () => {
      const { data } = await supabase
        .from('global_state')
        .select('timer_started_at')
        .eq('id', 1)
        .single();
      if (data && data.timer_started_at) {
        setTimerStartedAt(data.timer_started_at);
      }
    };

    fetchTeams();
    fetchGlobalState();

    // 2. Real-time Subscriptions
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
        },
        (payload) => {
          setTeams((current) => {
            let updated = [...current];
            const newTeam = payload.new as Team;

            // Update or add the team
            const index = updated.findIndex(t => t.team_id === newTeam.team_id);
            if (index > -1) {
              updated[index] = newTeam;
            } else {
              updated.push(newTeam);
            }
            
            // Re-sort: those who finished first, then by least tokens used
            updated.sort((a, b) => {
              if (a.finished_at && !b.finished_at) return -1;
              if (!a.finished_at && b.finished_at) return 1;
              return a.tokens_used - b.tokens_used;
            });
            
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'teams' },
        (payload) => {
          setTeams((current) => current.filter(t => t.team_id !== payload.old.team_id));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_state' },
        (payload) => {
          if (payload.new && (payload.new as any).timer_started_at) {
            setTimerStartedAt((payload.new as any).timer_started_at);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Timer countdown logic
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
        clearInterval(interval);
      } else {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setTimeRemaining(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStartedAt]);

  const handleStartTimer = async () => {
    await supabase.from('global_state').update({ timer_started_at: new Date().toISOString() }).eq('id', 1);
  };

  const handleDeleteTeam = async (team_code: string) => {
    if (confirm(`Are you sure you want to delete team ${team_code}?`)) {
      await supabase.rpc('delete_team', { team_code_input: team_code });
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex items-center justify-between mb-12 border-b border-cyan-900/30 pb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-cyan-950 p-3 rounded-xl border border-cyan-800">
              <Trophy className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-widest text-white">COMMAND CENTER</h1>
              <p className="text-slate-400 mt-1 uppercase tracking-widest text-sm">Live Squad Status</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-cyan-400 bg-cyan-950/30 px-4 py-2 rounded-lg border border-cyan-900">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="font-mono text-sm tracking-widest">LIVE SYNC ACTIVE</span>
          </div>
        </header>

        {/* Global Controls */}
        <div className="mb-8 glass-panel p-6 rounded-xl flex items-center justify-between border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-fuchsia-400" /> Global Timer Status
            </h2>
            <p className="text-slate-400 text-sm mt-1">Controls the 7-minute event timer for all active teams.</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-3xl font-mono font-bold text-white text-glow tracking-widest">
              {timeRemaining}
            </div>
            <button
              onClick={handleStartTimer}
              disabled={timerStartedAt !== null}
              className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-6 rounded-lg flex items-center transition-all neon-glow-fuchsia uppercase tracking-widest text-sm"
            >
              <Play className="w-4 h-4 mr-2" />
              {timerStartedAt ? 'Uplink Started' : 'Start Uplink'}
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {teams.length === 0 ? (
            <div className="text-center text-slate-500 font-mono py-12 border border-slate-800 border-dashed rounded-xl">
              WAITING FOR TEAMS TO INITIALIZE UPLINK...
            </div>
          ) : (
            teams.map((team, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={team.team_id}
                className={`glass-panel p-6 rounded-xl flex items-center justify-between border ${
                  team.finished_at 
                    ? 'border-green-500/50 bg-green-950/10' 
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center space-x-6">
                  <div className="text-2xl font-bold text-slate-600 font-mono w-8">
                    #{index + 1}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-widest">{team.team_code}</h2>
                    {team.finished_at ? (
                      <span className="text-xs text-green-400 uppercase tracking-wider flex items-center mt-1">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Report Transmitted
                      </span>
                    ) : (
                      <span className="text-xs text-cyan-400 uppercase tracking-wider mt-1 block">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-12">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tokens Remaining</p>
                    <p className={`text-2xl font-mono text-glow ${
                      (15 - team.tokens_used) < 5 ? 'text-red-400' : 'text-cyan-400'
                    }`}>
                      {15 - team.tokens_used} <span className="text-sm text-slate-500">/ 15</span>
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteTeam(team.team_code)}
                    className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-900/50"
                    title="Delete Team"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
