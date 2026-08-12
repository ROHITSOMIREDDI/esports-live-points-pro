import React, { useState, useEffect, FormEvent } from 'react';
import {
  Plus,
  Trophy,
  Users,
  Gamepad2,
  Bell,
  LogOut,
  ShieldAlert,
  Trash2,
  ArrowRight,
  Zap,
  Target,
  BarChart3,
  Lock,
  Settings,
  Edit2,
  Check,
  X,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  writeBatch,
  getDocs,
  where,
  serverTimestamp,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { cn } from './lib/utils';
import { Tournament, Team, MatchResult, Player, GameType, SCORING } from './types';

// --- Components ---

function AuthButton({ user }: { user: User | null }) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/popup-blocked') {
        alert("Sign-in popup was blocked. Please allow popups for this site or open the app in a new tab.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Just ignore cancelled requests
      } else {
        alert("Authentication failed: " + (error.message || "Unknown error"));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  function logout() { signOut(auth); }

  if (user) {
    return (
      <button
        onClick={logout}
        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
      >
        <LogOut className="w-3 h-3" />
        {user.displayName?.split(' ')[0]}
      </button>
    );
  }

  return (
    <button
      onClick={login}
      disabled={isLoggingIn}
      className={cn(
        "bg-yellow-400 text-slate-950 px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-yellow-400/20",
        isLoggingIn ? "opacity-50 cursor-wait" : "hover:bg-yellow-300"
      )}
    >
      {isLoggingIn ? "Connecting..." : "Login"}
    </button>
  );
}

function CreateTournamentModal({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (name: string, gameType: GameType, code: string) => void }) {
  const [name, setName] = useState("");
  const [gameType, setGameType] = useState<GameType>(GameType.FREE_FIRE);
  const [code, setCode] = useState(Math.random().toString(36).substring(2, 8).toUpperCase());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400" />
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <Plus className="w-5 h-5 rotate-45" />
        </button>

        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Create New Event</h3>

        <form onSubmit={e => {
          e.preventDefault();
          onSubmit(name, gameType, code);
        }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Event Name</label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="E.G. CHAMPIONS_CUP"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none text-sm font-bold uppercase transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Type of Game</label>
              <select
                value={gameType}
                onChange={e => setGameType(e.target.value as GameType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none text-xs font-black uppercase tracking-widest appearance-none"
              >
                <option value={GameType.FREE_FIRE}>FREE FIRE</option>
                <option value={GameType.PUBG}>PUBG</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Access_Code</label>
              <input
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                maxLength={10}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none text-sm font-black text-yellow-400 uppercase tracking-widest"
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-yellow-400 text-slate-950 py-4 rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-yellow-300 transition-all shadow-xl shadow-yellow-400/10 active:scale-95 mt-4">
            Create
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function AboutModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400" />
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-yellow-400 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/10 rotate-3">
             <Target className="w-10 h-10" />
          </div>
          
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">About the Developer</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Developers Corner</p>
          </div>

          <div className="w-full space-y-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Name</span>
              <p className="font-bold text-slate-200">Rohit Somireddi</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Email</span>
              <a href="mailto:rohitsomireddi11105@gmail.com" className="font-bold text-yellow-400 hover:text-yellow-300 transition-colors block">rohitsomireddi11105@gmail.com</a>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Instagram</span>
              <a href="https://www.instagram.com/r_roh.it1.28/" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-200 hover:text-white transition-colors block">@r_roh.it1.28</a>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
            "Building high-performance tools for the next generation of esports athletes and organizers."
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [fetchedTournament, setFetchedTournament] = useState<Tournament | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const createTournament = async (name: string, gameType: GameType, code: string) => {
    if (!user) {
      alert("Please login first to create a tournament.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'tournaments'), {
        name,
        gameType,
        code,
        announcement: '',
        createdAt: serverTimestamp(),
        status: 'ongoing',
        creatorId: user.uid
      });
      setActiveTournamentId(docRef.id);
      setIsCreateModalOpen(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'tournaments');
    }
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setTournaments([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'tournaments'), where('creatorId', '==', user.uid));
    const unsubTournaments = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
      // Sort locally by createdAt desc to avoid requiring composite indexes
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setTournaments(docs);
      setLoading(false);
    });

    return () => unsubTournaments();
  }, [user]);

  // Lazy Sweeping Deletion
  useEffect(() => {
    if (!user || tournaments.length === 0) return;

    const sweepExpiredTournaments = async () => {
      const now = Date.now();
      const expired = tournaments.filter(t => t.status === 'completed' && t.deletionEligibleAt && t.deletionEligibleAt < now);
      
      for (const t of expired) {
        try {
          console.log(`Sweeping expired tournament: ${t.id}`);
          
          // 1. Delete Teams and their nested Players
          const teamsSnap = await getDocs(collection(db, 'tournaments', t.id, 'teams'));
          for (const teamDoc of teamsSnap.docs) {
            const playersSnap = await getDocs(collection(db, 'tournaments', t.id, 'teams', teamDoc.id, 'players'));
            for (const pDoc of playersSnap.docs) {
              await deleteDoc(pDoc.ref);
            }
            await deleteDoc(teamDoc.ref);
          }

          // 2. Delete Match Results
          const resultsSnap = await getDocs(collection(db, 'tournaments', t.id, 'results'));
          for (const rDoc of resultsSnap.docs) {
            await deleteDoc(rDoc.ref);
          }

          // 3. Delete Player Results
          const prSnap = await getDocs(collection(db, 'tournaments', t.id, 'playerResults'));
          for (const prDoc of prSnap.docs) {
            await deleteDoc(prDoc.ref);
          }

          // 4. Delete Tournament Document
          await deleteDoc(doc(db, 'tournaments', t.id));
          
          if (activeTournamentId === t.id) {
            setActiveTournamentId(null);
            setFetchedTournament(null);
          }
        } catch (e) {
          console.error("Error sweeping tournament:", e);
        }
      }
    };

    sweepExpiredTournaments();
  }, [tournaments, user, activeTournamentId]);

  const joinByCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;

    try {
      const q = query(collection(db, 'tournaments'), where('code', '==', joinCode.toUpperCase()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const tData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Tournament;
        setFetchedTournament(tData);
        setActiveTournamentId(tData.id);
        setJoinCode("");
      } else {
        alert("Tournament Code not found or invalid.");
      }
    } catch (e) {
      console.error("Join by code error:", e);
      alert("Error finding tournament. Please check connection.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-[10px] uppercase font-black tracking-[0.3em] animate-pulse">Initializing_Control_Center</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800/50 p-4 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setActiveTournamentId(null); setFetchedTournament(null); }}>
              <div className="p-2 bg-yellow-400 text-slate-950 rounded-xl rotate-3 group-hover:rotate-0 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h1 id="app-title" className="text-lg font-black tracking-tighter uppercase italic leading-none">Live Points <span className="text-yellow-400">Pro</span></h1>
                <div className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  Live Broadcast Mode
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-[10px] font-black text-slate-500 hover:text-yellow-400 transition-colors uppercase tracking-widest border border-transparent hover:border-yellow-400/20 rounded-lg"
            >
              About
            </button>
            <AuthButton user={user} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {!activeTournamentId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-full mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Active <span className="text-yellow-400">Arenas</span></h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Select or join a tournament</p>
              </div>

              <form onSubmit={joinByCode} className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  placeholder="ENTER ACCESS CODE"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest focus:border-yellow-400 focus:outline-none w-48 transition-all"
                />
                <button type="submit" className="bg-yellow-400 text-slate-950 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:rotate-2 transition-transform">
                  Join
                </button>
              </form>
            </div>

            <motion.button
              whileHover={{ y: -4, borderColor: 'rgba(250, 204, 21, 0.5)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="h-56 bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-slate-900/50 transition-all group"
            >
              <div className="p-3 bg-yellow-400/10 text-yellow-400 rounded-full group-hover:bg-yellow-400 group-hover:text-slate-950 transition-all duration-300">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-black uppercase italic tracking-widest text-xs opacity-60">Create New Event</span>
            </motion.button>

            {tournaments.map(t => (
              <motion.div
                key={t.id}
                layoutId={t.id}
                onClick={() => setActiveTournamentId(t.id)}
                className="h-56 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-yellow-400/30 cursor-pointer transition-all relative overflow-hidden group backdrop-blur-sm"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Gamepad2 className="w-24 h-24 rotate-12" />
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border",
                      t.gameType === GameType.FREE_FIRE ? "border-orange-500/50 text-orange-400 bg-orange-400/5" : "border-yellow-500/50 text-yellow-400 bg-yellow-400/5"
                    )}>
                      {t.gameType.replace('_', ' ')}
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">
                      {t.createdAt?.toDate?.()?.toLocaleDateString() || 'LIVE'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black uppercase italic leading-tight group-hover:text-yellow-400 transition-colors">{t.name}</h3>
                </div>

                <div className="relative z-10 flex items-center justify-between border-t border-slate-800/50 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ongoing</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-yellow-400 transform group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          (() => {
            const currentTournament = tournaments.find(t => t.id === activeTournamentId) || fetchedTournament;
            if (!currentTournament) return null;
            return (
              <TournamentDashboard
                tournament={currentTournament}
                user={user}
                onBack={() => { setActiveTournamentId(null); setFetchedTournament(null); }}
              />
            );
          })()
        )}
      </main>

      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createTournament}
      />
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}

function TournamentDashboard({ tournament, user, onBack }: { tournament: Tournament, user: User | null, onBack: () => void }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [liveTournament, setLiveTournament] = useState<Tournament>(tournament);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'players' | 'matches' | 'admin'>('leaderboard');
  const [playerTeamFilter, setPlayerTeamFilter] = useState<string>("all");
  const [playerSortBy, setPlayerSortBy] = useState<'totalKills' | 'avgKills'>('totalKills');
  const isAdmin = user && user.uid === liveTournament.creatorId;

  useEffect(() => {
    setLiveTournament(tournament);
  }, [tournament]);

  useEffect(() => {
    const tournamentRef = doc(db, 'tournaments', tournament.id);
    const unsubTournament = onSnapshot(tournamentRef, (snapshot) => {
      if (snapshot.exists()) {
        setLiveTournament({ id: snapshot.id, ...snapshot.data() } as Tournament);
      }
    });

    return () => unsubTournament();
  }, [tournament.id]);

  useEffect(() => {
    const qTeams = query(collection(db, 'tournaments', tournament.id, 'teams'));
    const unsubTeams = onSnapshot(qTeams, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      // Sort in memory to avoid requiring a Firebase composite index
      teamsData.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return b.totalKills - a.totalKills;
      });
      setTeams(teamsData);
    });

    // Fetch all players for all teams in this tournament
    // This is a bit complex with subcollections if we want ALL players for a leaderboard
    // For now, let's assume we want a unified player leaderboard
    // Since firestore doesn't support easy collection group filtering by parent tournamentId in a simple way without indexing,
    // and we have a flat-ish structure we can manage.
    // Let's stick to the structure: tournaments/{tid}/teams/{teamId}/players/{pid}
    // We'll need to fetch players for each team.

    return () => unsubTeams();
  }, [tournament.id]);

  // Unified player state management
  useEffect(() => {
    // Clear players state when teams change to ensure no ghost data from deleted teams
    setPlayers([]);

    if (teams.length === 0) return;

    const unsubs: (() => void)[] = [];

    teams.forEach(team => {
      const q = query(collection(db, 'tournaments', tournament.id, 'teams', team.id, 'players'), orderBy('totalKills', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const teamPlayers = snapshot.docs.map(doc => ({ id: doc.id, teamId: team.id, ...doc.data() } as Player));
        setPlayers(prev => {
          // Filter out any previous entries for THIS team before adding new ones
          const otherPlayers = prev.filter(p => p.teamId !== team.id);
          return [...otherPlayers, ...teamPlayers].sort((a, b) => b.totalKills - a.totalKills);
        });
      }, (err) => {
        console.error("Player sync error:", err);
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(u => u());
  }, [teams, tournament.id]);

  const generateReport = () => {
    let report = `====================================================\n`;
    report += `          OFFICIAL TOURNAMENT REPORT\n`;
    report += `          ${liveTournament.name.toUpperCase()}\n`;
    report += `====================================================\n\n`;

    const topPointsTeam = teams.length > 0 ? teams[0] : null;
    const topFraggingTeam = teams.length > 0 ? [...teams].sort((a, b) => b.totalKills - a.totalKills)[0] : null;

    if (topPointsTeam) {
      report += `🏆 TEAM OF THE DAY (Highest Overall Score)\n`;
      report += `   ${topPointsTeam.name} [${topPointsTeam.tag}]\n`;
      report += `   Total Points: ${topPointsTeam.totalPoints}\n\n`;
    }

    if (topFraggingTeam) {
      report += `💥 TOP FRAGGING TEAM (Most Kills)\n`;
      report += `   ${topFraggingTeam.name} [${topFraggingTeam.tag}]\n`;
      report += `   Total Kills: ${topFraggingTeam.totalKills}\n\n`;
    }

    const topPlayers = [...players].sort((a, b) => b.totalKills - a.totalKills).slice(0, 3);
    if (topPlayers.length > 0) {
      report += `🏅 TOP 3 MVPS (Most Individual Kills)\n`;
      topPlayers.forEach((p, idx) => {
        const pTeam = teams.find(t => t.id === p.teamId);
        report += `   ${idx + 1}. ${p.name} (${pTeam?.tag || 'Unknown'}) - ${p.totalKills} Kills\n`;
      });
      report += `\n`;
    }

    report += `====================================================\n`;
    report += `               LIVE LEADERBOARD\n`;
    report += `====================================================\n`;
    report += `Rank | Team Name                | Match | Pts | Kills | Total\n`;
    report += `----------------------------------------------------\n`;
    
    teams.forEach((t, idx) => {
      const rank = (idx + 1).toString().padEnd(4, ' ');
      const name = t.name.padEnd(24, ' ');
      const match = t.matchesPlayed.toString().padEnd(5, ' ');
      const placePts = (t.totalPoints - t.totalKills).toString().padEnd(3, ' ');
      const killPts = t.totalKills.toString().padEnd(5, ' ');
      const total = t.totalPoints.toString();
      report += `${rank} | ${name} | ${match} | ${placePts} | ${killPts} | ${total}\n`;
    });

    report += `====================================================\n`;
    report += `Generated automatically by Live Points Pro\n`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${liveTournament.name.replace(/\s+/g, '_')}_Final_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Navigation (Bento Header) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button
            onClick={onBack}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-yellow-400 mb-3 block transition-colors"
          >
            ← EXIT_TO_MAIN_TERMINAL
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
              {liveTournament.name.split(' ')[0]} <span className="text-yellow-400">{liveTournament.name.split(' ').slice(1).join(' ')}</span>
            </h2>
            <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono italic">CODE: {liveTournament.code}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-xl",
              liveTournament.gameType === GameType.FREE_FIRE ? "bg-orange-500/10 text-orange-400 border-orange-500/30" : "bg-yellow-400/10 text-yellow-400 border-yellow-400/30"
            )}>
              {liveTournament.gameType.replace('_', ' ')} OFFICIAL
            </span>
            <div className="flex items-center gap-2">
              {liveTournament.status === 'completed' ? (
                <>
                  <div className="h-1.5 w-1.5 bg-slate-500 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">EVENT_ARCHIVED</span>
                </>
              ) : (
                <>
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">LIVE_DATA_FEED</span>
                </>
              )}
            </div>
            <button onClick={generateReport} className="ml-4 bg-yellow-400 text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20">
              Download Leaderboard Report
            </button>
          </div>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl overflow-x-auto">
          {(['leaderboard', 'players', 'matches', ...(isAdmin ? ['admin'] : [])] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all italic whitespace-nowrap",
                activeTab === tab ? "bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-400/20" : "text-slate-500 hover:text-slate-100"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-12 gap-4"
          >
            {/* Main Standings Card */}
            <div className="col-span-full bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
              <div className="bg-slate-800/40 px-6 py-4 flex justify-between items-center border-b border-slate-800">
                <h3 className="font-black uppercase italic text-sm tracking-widest text-slate-300">Live Team Standings</h3>
                <span className="text-[10px] bg-slate-800 px-2.5 py-1 rounded-lg text-slate-400 font-bold uppercase tracking-widest border border-slate-700">Real-time Feed</span>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-800/50 bg-slate-950/30">
                      <th className="px-6 py-4 italic">Rank</th>
                      <th className="px-6 py-4">Team Name</th>
                      <th className="px-6 py-4 text-center">Matches</th>
                      <th className="px-6 py-4 text-center">{liveTournament.gameType === GameType.FREE_FIRE ? 'Booyah' : 'WWCD'}</th>
                      <th className="px-6 py-4 text-center">Place Pts</th>
                      <th className="px-6 py-4 text-center">Kill Pts</th>
                      <th className="px-6 py-4 text-center text-yellow-400">Total Pts</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {teams.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center opacity-30 font-black italic uppercase tracking-widest text-xs">Waiting_For_Team_Data_Injection</td>
                      </tr>
                    ) : (
                      teams.map((team, index) => (
                        <motion.tr
                          key={team.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={cn(
                            "border-b border-slate-800/50 group transition-all",
                            index === 0 ? "bg-yellow-400/5 hover:bg-yellow-400/10" : "hover:bg-slate-800/30"
                          )}
                        >
                          <td className="px-6 py-5">
                            <span className={cn(
                              "font-black italic text-xl",
                              index === 0 ? "text-yellow-400" : "text-slate-600"
                            )}>{index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border shadow-lg transform -rotate-1 group-hover:rotate-0 transition-transform",
                                index === 0 ? "bg-yellow-400 border-yellow-300 text-slate-950" : "bg-slate-800 border-slate-700 text-slate-300"
                              )}>
                                {team.tag || team.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-black uppercase italic tracking-tight text-base">{team.name}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{team.tag}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center font-mono font-bold text-slate-400">{team.matchesPlayed}</td>
                          <td className="px-6 py-5 text-center font-mono font-bold text-yellow-400">{team.wins || 0}</td>
                          <td className="px-6 py-5 text-center font-mono font-bold text-slate-300">{team.totalPoints - team.totalKills}</td>
                          <td className="px-6 py-5 text-center font-mono font-bold text-slate-300">{team.totalKills}</td>
                          <td className={cn(
                            "px-6 py-5 text-center font-black text-xl italic tracking-tighter",
                            index === 0 ? "text-yellow-400" : "text-slate-100"
                          )}>{team.totalPoints}</td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Stats Row */}
            <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Scoring Rules Bento */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-xs uppercase font-black tracking-[0.2em] italic text-slate-400">Point Scoring Algorithm</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500">{tournament.gameType === GameType.FREE_FIRE ? 'BOOYAH' : 'WWCD'} / 1ST PLACE</span>
                    <span className="text-sm font-black text-yellow-400 italic font-mono">{SCORING[liveTournament.gameType].placement[0]} PTS</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Per Kill Elimination</span>
                    <span className="text-sm font-black text-green-400 italic font-mono">01 PTS</span>
                  </div>
                </div>
              </div>

              {/* MVP / Top Perfomer Spot */}
              <div className="bg-gradient-to-br from-yellow-400 to-amber-600 rounded-3xl p-6 text-slate-950 shadow-xl shadow-yellow-400/10 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-10 transform scale-150 group-hover:rotate-12 transition-transform duration-700">
                  <Zap className="w-40 h-40" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-slate-900/60">Dominant Performance</p>
                  <h4 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-4">Top Fragging Team</h4>
                  {teams.length > 0 ? (
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center font-black text-xl italic shadow-2xl">
                        {[...teams].sort((a, b) => b.totalKills - a.totalKills)[0].tag || "S1"}
                      </div>
                      <div>
                        <p className="text-xl font-black tracking-tight">{[...teams].sort((a, b) => b.totalKills - a.totalKills)[0].name}</p>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-70">{[...teams].sort((a, b) => b.totalKills - a.totalKills)[0].totalKills} TOTAL_ELIMS</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-black italic uppercase tracking-widest opacity-60">Scanning_Active_Matches...</p>
                  )}
                </div>
              </div>

              {/* Team of the Day */}
              <div className="bg-gradient-to-br from-indigo-400 to-purple-600 rounded-3xl p-6 text-slate-950 shadow-xl shadow-indigo-400/10 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-10 transform scale-150 group-hover:rotate-12 transition-transform duration-700">
                  <Trophy className="w-40 h-40" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-slate-900/60">Highest Overall Score</p>
                  <h4 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-4">Team of the Day</h4>
                  {teams.length > 0 ? (
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center font-black text-xl italic shadow-2xl">
                        {teams[0].tag || "S1"}
                      </div>
                      <div>
                        <p className="text-xl font-black tracking-tight">{teams[0].name}</p>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-70">{teams[0].totalPoints} TOTAL_PTS</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-black italic uppercase tracking-widest opacity-60">Scanning_Active_Matches...</p>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="col-span-full mb-4">
            <div className="rounded-3xl border border-yellow-400/20 bg-gradient-to-r from-yellow-400/10 to-slate-900/80 p-5 shadow-lg shadow-yellow-400/10">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-yellow-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">Official Announcement</h3>
              </div>
              <p className="text-sm font-medium text-slate-200 leading-relaxed">
                {liveTournament.announcement?.trim() || 'No official announcement yet. Organizers can add one from the admin console.'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'players' && (() => {
          const filteredPlayers = players.filter(p => playerTeamFilter === "all" || p.teamId === playerTeamFilter);
          const sortedPlayers = [...filteredPlayers].sort((a, b) => {
            if (playerSortBy === 'totalKills') {
              return b.totalKills - a.totalKills;
            } else {
              const teamA = teams.find(t => t.id === a.teamId);
              const teamB = teams.find(t => t.id === b.teamId);
              const avgA = a.totalKills / Math.max(1, (teamA?.matchesPlayed || 0));
              const avgB = b.totalKills / Math.max(1, (teamB?.matchesPlayed || 0));
              return avgB - avgA;
            }
          });

          return (
          <motion.div
            key="players"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Player Standings</h3>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <select
                  value={playerTeamFilter}
                  onChange={(e) => setPlayerTeamFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 focus:border-yellow-400 focus:outline-none text-xs font-black uppercase tracking-widest text-slate-300"
                >
                  <option value="all">ALL SQUADS</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.tag} - {t.name}</option>
                  ))}
                </select>
                <select
                  value={playerSortBy}
                  onChange={(e) => setPlayerSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 focus:border-yellow-400 focus:outline-none text-xs font-black uppercase tracking-widest text-slate-300"
                >
                  <option value="totalKills">SORT: TOTAL ELIMS</option>
                  <option value="avgKills">SORT: AVG KILLS/MATCH</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedPlayers.length === 0 ? (
                <div className="col-span-full py-32 text-center bg-slate-900/30 border border-slate-800 rounded-3xl border-dashed">
                  <p className="text-sm font-black uppercase italic tracking-widest text-slate-500">Scanning_Bios_For_Tournament_Metadata...</p>
                </div>
              ) : (
                sortedPlayers.map((player, index) => {
                  const team = teams.find(t => t.id === player.teamId);
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-slate-900 border border-slate-800 p-6 rounded-3xl group hover:border-yellow-400/30 transition-all relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Target className="w-16 h-16" />
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center font-black text-xs text-yellow-400 italic">
                            #{index + 1}
                          </div>
                          <div>
                            <h4 className="text-lg font-black uppercase italic tracking-tight group-hover:text-yellow-400 transition-colors">{player.name}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{team?.name || 'Mercenary'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black italic text-slate-100">{player.totalKills}</p>
                          <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Total Elims</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800/50 grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                          <p className="text-[8px] font-bold uppercase text-slate-500 mb-1 leading-none">Avg Kills / Match</p>
                          <p className="text-xs font-black uppercase italic text-slate-300">
                            {(player.totalKills / Math.max(1, (team?.matchesPlayed || 0))).toFixed(2)} K/M
                          </p>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                          <p className="text-[8px] font-bold uppercase text-slate-500 mb-1 leading-none">Team Share</p>
                          <p className="text-xs font-black uppercase italic text-slate-300">
                            {team?.totalKills ? ((player.totalKills / team.totalKills) * 100).toFixed(0) : 0}%
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )})()}
        {activeTab === 'matches' && <MatchHistory tournament={liveTournament} teams={teams} isAdmin={isAdmin} />}
        {activeTab === 'admin' && <AdminPanel tournament={liveTournament} teams={teams} isAdmin={isAdmin} />}
      </AnimatePresence>
    </div>
  );
}

function MatchHistory({ tournament, teams, isAdmin }: { tournament: Tournament, teams: Team[], isAdmin: boolean }) {
  const [results, setResults] = useState<MatchResult[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'tournaments', tournament.id, 'results'));
    const unsub = onSnapshot(q, (snapshot) => {
      setResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchResult)));
    });
    return () => unsub();
  }, [tournament.id]);

  const deleteResult = async (res: MatchResult) => {
    if (!window.confirm("Delete this match record?")) return;

    try {
      await runTransaction(db, async (tx) => {
        const teamRef = doc(db, 'tournaments', tournament.id, 'teams', res.teamId);
        const teamSnap = await tx.get(teamRef);
        if (teamSnap.exists()) {
          const teamData = teamSnap.data() as Team;
          const wasWin = res.placement === 1 ? 1 : 0;
          tx.update(teamRef, {
            totalPoints: Math.max(0, ((teamData.totalPoints || 0) as number) - (res.totalMatchPoints || 0)),
            totalKills: Math.max(0, ((teamData.totalKills || 0) as number) - (res.kills || 0)),
            matchesPlayed: Math.max(0, ((teamData.matchesPlayed || 0) as number) - 1),
            wins: Math.max(0, ((teamData.wins || 0) as number) - wasWin)
          });
        }
        tx.delete(doc(db, 'tournaments', tournament.id, 'results', res.id));
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `tournaments/${tournament.id}/results/${res.id}`);
    }
  };

  const groupedResultsByMatch = results.reduce((acc, curr) => {
    if (!acc[curr.matchNumber]) acc[curr.matchNumber] = [];
    acc[curr.matchNumber].push(curr);
    return acc;
  }, {} as Record<number, MatchResult[]>);

  const matchNumbers = Object.keys(groupedResultsByMatch).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-8">
      {matchNumbers.length === 0 && (
        <div className="py-32 flex flex-col items-center justify-center gap-4 bg-slate-900/30 border border-slate-800/50 rounded-3xl border-dashed">
          <Gamepad2 className="w-12 h-12 text-slate-800" />
          <div className="text-center">
            <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-500">NO_MATCH_RECORDS_FOUND</h3>
            <p className="text-[10px] uppercase font-bold text-slate-600 mt-1">Start entering data in the Admin terminal</p>
          </div>
        </div>
      )}

      {matchNumbers.map(matchNum => {
        const matchResults = groupedResultsByMatch[matchNum].sort((a, b) => {
          if (b.totalMatchPoints !== a.totalMatchPoints) return b.totalMatchPoints - a.totalMatchPoints;
          if (b.kills !== a.kills) return b.kills - a.kills;
          return a.placement - b.placement; // lower placement (1st) is better
        });
        
        return (
        <motion.div
          key={matchNum}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm"
        >
          <div className="bg-slate-800/40 px-8 py-5 flex justify-between items-center border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400 text-slate-950 rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-yellow-400/10">
                M{matchNum}
              </div>
              <h4 className="font-black italic text-xl uppercase tracking-tighter">Combat Report #{matchNum}</h4>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] hidden md:block">Finalized_Tactical_Score</span>
              <div className="h-5 w-px bg-slate-800/50" />
              <div className="text-[10px] text-green-400 font-black uppercase flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
                Validated
              </div>
            </div>
          </div>

          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/30 bg-slate-950/20 italic">
                  <th className="px-8 py-4 font-normal text-left">Placement</th>
                  <th className="px-8 py-4 font-normal text-left">Squad Identity</th>
                  <th className="px-8 py-4 font-normal text-center">Place Pts</th>
                  <th className="px-8 py-4 font-normal text-center">Elim Pts</th>
                  <th className="px-8 py-4 font-normal text-right">Match Result</th>
                  {isAdmin && <th className="px-8 py-4 font-normal"></th>}
                </tr>
              </thead>
              <tbody>
                {matchResults.map((reg, index) => {
                  const team = teams.find(t => t.id === reg.teamId);
                  return (
                    <tr key={reg.id} className={cn(
                      "border-b border-slate-800/20 last:border-0 hover:bg-slate-800/40 transition-all group",
                      reg.placement === 1 ? "bg-yellow-400/[0.03]" : ""
                    )}>
                      <td className="px-8 py-5">
                        <span className={cn(
                          "font-black italic text-base",
                          reg.placement === 1 ? "text-yellow-400" : (reg.placement <= 3 ? "text-slate-300" : "text-slate-500")
                        )}>#{reg.placement}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] border",
                            reg.placement === 1 ? "bg-yellow-400 border-yellow-300 text-slate-950" : "bg-slate-800/50 border-slate-700/50 text-slate-400"
                          )}>
                            {team?.tag || "??"}
                          </div>
                          <span className="font-black uppercase italic tracking-tight text-slate-200 group-hover:text-white transition-colors">{team?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-mono text-center text-slate-400 font-bold">{reg.placementPoints}</td>
                      <td className="px-8 py-5 font-mono text-center text-slate-400 font-bold">{reg.kills}</td>
                      <td className={cn(
                        "px-8 py-5 font-black text-right text-lg italic",
                        reg.placement === 1 ? "text-yellow-400" : "text-slate-100"
                      )}>{reg.totalMatchPoints}</td>
                      {isAdmin && (
                        <td className="px-8 py-5 text-right">
                          <button onClick={() => deleteResult(reg)} className="text-slate-700 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-xl">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )})}
    </div>
  );
}

function AdminPanel({ tournament, teams, isAdmin }: { tournament: Tournament, teams: Team[], isAdmin: boolean }) {
  const [regMode, setRegMode] = useState<'manual' | 'bulk'>('manual');
  const [announcementText, setAnnouncementText] = useState(tournament.announcement || '');
  const [parsedTeams, setParsedTeams] = useState<{ name: string, players: string[], tag: string }[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamTag, setNewTeamTag] = useState("");
  const [newPlayerNames, setNewPlayerNames] = useState<string[]>(["", "", "", ""]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [placement, setPlacement] = useState(0);
  const [kills, setKills] = useState(0);
  const [matchNumber, setMatchNumber] = useState(1);
  const [existingResultDocId, setExistingResultDocId] = useState<string | null>(null);

  // Player management state
  const [newPlayerName, setNewPlayerName] = useState("");
  const [teamForPlayer, setTeamForPlayer] = useState("");
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [selectedTeamPlayers, setSelectedTeamPlayers] = useState<Player[]>([]);
  const [matchPlayerKills, setMatchPlayerKills] = useState<Record<string, number>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Inline editing state
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState("");
  const [editingTeamTag, setEditingTeamTag] = useState("");
  
  const [editingPlayerName, setEditingPlayerName] = useState("");
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    setAnnouncementText(tournament.announcement || '');
  }, [tournament.announcement]);

  const completeTournament = async () => {
    if (!window.confirm("Are you sure you want to finalize this event? It will be marked for automatic deletion in 2 hours.")) return;
    setIsCompleting(true);
    try {
      const now = new Date();
      const deletionTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
      await updateDoc(doc(db, 'tournaments', tournament.id), {
        status: 'completed',
        completedAt: serverTimestamp(),
        deletionEligibleAt: deletionTime.getTime()
      });
      showNotification("Tournament finalized successfully!");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `tournaments/${tournament.id}`);
    } finally {
      setIsCompleting(false);
    }
  };

  // Notification state
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  const downloadCSVTemplate = () => {
    // BOM prefix ensures Excel opens the file with correct UTF-8 encoding
    const BOM = '\uFEFF';
    const headers = "Team Name,Player 1,Player 2,Player 3,Player 4,Player 5 (Optional)\n";
    const exampleRow = "Team Alpha,AlphaPlayer1,AlphaPlayer2,AlphaPlayer3,AlphaPlayer4,AlphaPlayer5\n";
    const csvContent = BOM + headers + exampleRow;

    // Use a data URI for reliable cross-browser download (avoids createObjectURL race conditions)
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", "esports_teams_template.csv");
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const parsed: { name: string, players: string[], tag: string }[] = [];
        const lines = text.split(/\r?\n/);
        
        let startIndex = 0;
        if (lines.length > 0 && (lines[0].toLowerCase().includes("team") || lines[0].toLowerCase().includes("player"))) {
          startIndex = 1;
        }

        let slotIndex = teams.length + 1;

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Simple CSV line parser
          const columns: string[] = [];
          let currentField = '';
          let insideQuotes = false;
          
          for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
              columns.push(currentField.trim());
              currentField = '';
            } else {
              currentField += char;
            }
          }
          columns.push(currentField.trim());

          const teamName = columns[0];
          if (!teamName) continue;

          const players: string[] = [];
          for (let colIdx = 1; colIdx <= 5; colIdx++) {
            const pName = columns[colIdx];
            if (pName) {
              players.push(pName);
            }
          }

          parsed.push({
            name: teamName,
            players,
            tag: slotIndex.toString()
          });

          slotIndex++;
        }

        setParsedTeams(parsed);
        e.target.value = '';
      } catch (err) {
        console.error("Error parsing CSV:", err);
        showNotification("Failed to parse CSV file. Make sure it has valid fields.", "error");
      }
    };
    reader.readAsText(file);
  };

  const importBulkTeams = async () => {
    if (parsedTeams.length === 0) return;
    setIsImporting(true);
    try {
      const batchOp = writeBatch(db);

      for (const pTeam of parsedTeams) {
        const teamRef = doc(collection(db, 'tournaments', tournament.id, 'teams'));
        
        batchOp.set(teamRef, {
          name: pTeam.name,
          tag: pTeam.tag,
          totalPoints: 0,
          totalKills: 0,
          matchesPlayed: 0,
          wins: 0,
          logoUrl: ""
        });

        const playersToCreate: string[] = [];
        for (let i = 0; i < 5; i++) {
          const pName = pTeam.players[i];
          if (pName && pName.trim() !== "") {
            playersToCreate.push(pName.trim());
          } else if (i < 4) {
            playersToCreate.push(`${pTeam.tag}_Player ${i + 1}`);
          }
        }

        for (const pName of playersToCreate) {
          const playerRef = doc(collection(db, 'tournaments', tournament.id, 'teams', teamRef.id, 'players'));
          batchOp.set(playerRef, {
            name: pName,
            totalKills: 0
          });
        }
      }

      await batchOp.commit();
      showNotification(`Successfully imported ${parsedTeams.length} squads!`);
      setParsedTeams([]);
      setRegMode('manual');
    } catch (err) {
      console.error("Bulk import error:", err);
      showNotification("Failed to import teams. Please check connection.", "error");
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    if (!teamForPlayer) {
      setTeamPlayers([]);
      return;
    }
    const q = query(collection(db, 'tournaments', tournament.id, 'teams', teamForPlayer, 'players'));
    const unsub = onSnapshot(q, (snapshot) => {
      setTeamPlayers(snapshot.docs.map(doc => ({ id: doc.id, teamId: teamForPlayer, ...doc.data() } as Player)));
    });
    return () => unsub();
  }, [teamForPlayer, tournament.id]);

  useEffect(() => {
    if (selectedTeamId) {
      const q = query(collection(db, 'tournaments', tournament.id, 'teams', selectedTeamId, 'players'));
      const unsub = onSnapshot(q, (snapshot) => {
        const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
        setSelectedTeamPlayers(players);
        const initialKills: Record<string, number> = {};
        players.forEach(p => initialKills[p.id] = 0);
        
        // If we are currently viewing an existing match, we shouldn't overwrite the fetched kills immediately,
        // but this will run on select. The secondary useEffect will override it with actual kills.
        setMatchPlayerKills(initialKills);
      });
      return () => unsub();
    }
  }, [selectedTeamId, tournament.id]);

  useEffect(() => {
    const fetchExistingData = async () => {
      if (!selectedTeamId || !matchNumber) return;
      
      const resQ = query(
        collection(db, 'tournaments', tournament.id, 'results'),
        where('teamId', '==', selectedTeamId),
        where('matchNumber', '==', matchNumber)
      );
      const resSnap = await getDocs(resQ);
      
      if (!resSnap.empty) {
        const resDoc = resSnap.docs[0];
        setExistingResultDocId(resDoc.id);
        setPlacement(resDoc.data().placement);
        
        const prQ = query(
          collection(db, 'tournaments', tournament.id, 'playerResults'),
          where('teamId', '==', selectedTeamId),
          where('matchNumber', '==', matchNumber)
        );
        const prSnap = await getDocs(prQ);
        
        const existingKills: Record<string, number> = {};
        prSnap.forEach(d => {
          existingKills[d.data().playerId] = d.data().kills;
        });
        
        setMatchPlayerKills(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(k => {
            updated[k] = existingKills[k] || 0;
          });
          return updated;
        });
      } else {
        setExistingResultDocId(null);
        setPlacement(0);
        setMatchPlayerKills(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(k => updated[k] = 0);
          return updated;
        });
      }
    };
    fetchExistingData();
  }, [selectedTeamId, matchNumber, tournament.id]);

  if (!isAdmin) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-6 text-center animate-in fade-in slide-in-from-bottom-4">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter">ACCESS_DENIED_TERMINAL</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest max-w-xs mt-2 mx-auto leading-relaxed">
            Authentication failed for administrative operations. Current user is not the authorized event governor.
          </p>
        </div>
      </div>
    );
  }

  const saveAnnouncement = async () => {
    try {
      await updateDoc(doc(db, 'tournaments', tournament.id), {
        announcement: announcementText.trim()
      });
      showNotification('Announcement updated successfully');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `tournaments/${tournament.id}`);
    }
  };

  const addTeam = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;
    try {
      const teamTag = newTeamTag || newTeamName.substring(0, 3).toUpperCase();
      const teamRef = await addDoc(collection(db, 'tournaments', tournament.id, 'teams'), {
        name: newTeamName,
        tag: teamTag,
        totalPoints: 0,
        totalKills: 0,
        matchesPlayed: 0,
        wins: 0,
        logoUrl: ""
      });

      // Add players with smart defaults
      const playersToCreate = newPlayerNames.map((n, i) => n.trim() !== "" ? n.trim() : `${teamTag}_Player ${i + 1}`);

      for (const pName of playersToCreate) {
        await addDoc(collection(db, 'tournaments', tournament.id, 'teams', teamRef.id, 'players'), {
          name: pName,
          totalKills: 0
        });
      }

      showNotification(`Team ${newTeamName} created`);
      setNewTeamName("");
      setNewTeamTag("");
      setNewPlayerNames(["", "", "", ""]);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `tournaments/${tournament.id}/teams`);
    }
  };

  const deleteTeam = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Permanently dismantle ${teamName}? This will also delete all match results and player data for this squad.`)) return;
    setIsDeleting(teamId);
    try {
      // 1. Fetch match results
      const resultsRef = collection(db, 'tournaments', tournament.id, 'results');
      const resultsQ = query(resultsRef, where('teamId', '==', teamId));
      const resultsSnap = await getDocs(resultsQ);

      // 2. Fetch player results
      const playerResultsRef = collection(db, 'tournaments', tournament.id, 'playerResults');
      const playerResultsQ = query(playerResultsRef, where('teamId', '==', teamId));
      const playerResultsSnap = await getDocs(playerResultsQ);

      // 3. Fetch players in the team
      const playersRef = collection(db, 'tournaments', tournament.id, 'teams', teamId, 'players');
      const playersSnap = await getDocs(playersRef);

      // 4. Batch delete
      const batchOp = writeBatch(db);

      resultsSnap.forEach(doc => batchOp.delete(doc.ref));
      playerResultsSnap.forEach(doc => batchOp.delete(doc.ref));
      playersSnap.forEach(doc => batchOp.delete(doc.ref));
      batchOp.delete(doc(db, 'tournaments', tournament.id, 'teams', teamId));

      await batchOp.commit();

      showNotification(`Team ${teamName} and all records purged successfully`, 'success');
      if (selectedTeamId === teamId) setSelectedTeamId("");
      if (teamForPlayer === teamId) setTeamForPlayer("");
    } catch (e) {
      console.error("Delete team error:", e);
      showNotification(`Failed to dismantle squad: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
      handleFirestoreError(e, OperationType.DELETE, `tournaments/${tournament.id}/teams/${teamId}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const updateTeam = async (teamId: string) => {
    if (!editingTeamName || !editingTeamTag) return;
    try {
      await updateDoc(doc(db, 'tournaments', tournament.id, 'teams', teamId), {
        name: editingTeamName,
        tag: editingTeamTag
      });
      setEditingTeamId(null);
      showNotification(`Team updated to ${editingTeamName}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `tournaments/${tournament.id}/teams`);
    }
  };

  const updatePlayer = async (playerId: string) => {
    if (!editingPlayerName || !teamForPlayer) return;
    try {
      await updateDoc(doc(db, 'tournaments', tournament.id, 'teams', teamForPlayer, 'players', playerId), {
        name: editingPlayerName
      });
      setEditingPlayerId(null);
      showNotification(`Player updated to ${editingPlayerName}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `tournaments/${tournament.id}/teams/${teamForPlayer}/players`);
    }
  };

  const addPlayer = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPlayerName || !teamForPlayer) return;
    try {
      const team = teams.find(t => t.id === teamForPlayer);
      await addDoc(collection(db, 'tournaments', tournament.id, 'teams', teamForPlayer, 'players'), {
        name: newPlayerName,
        totalKills: 0
      });
      showNotification(`${newPlayerName} added to ${team?.name || 'Squad'}`);
      setNewPlayerName("");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `tournaments/${tournament.id}/teams/${teamForPlayer}/players`);
    }
  };

  const addMatchStatus = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;

    const scoring = (SCORING as any)[tournament.gameType];
    const placementPoints: number = placement > 0 ? scoring.placement[placement - 1] || 0 : 0;

    // Total team kills is sum of player kills
    const totalTeamKills = (Object.values(matchPlayerKills) as number[]).reduce((a: number, b: number) => a + b, 0);
    const totalMatchPoints: number = (placementPoints as number) + ((totalTeamKills as number) * (scoring.kill as number));
    const isWin = placement === 1 ? 1 : 0;

    try {
      // Check if this match is completely new
      const resQ = query(
        collection(db, 'tournaments', tournament.id, 'results'),
        where('matchNumber', '==', matchNumber)
      );
      const matchSnap = await getDocs(resQ);
      const isFirstTeamInMatch = matchSnap.empty;

      if (isFirstTeamInMatch) {
        const batchOp = writeBatch(db);
        teams.forEach(t => {
          if (t.id !== selectedTeamId) {
            // Pre-initialize empty match result for other teams
            const newResRef = doc(db, 'tournaments', tournament.id, 'results', `${t.id}_${matchNumber}`);
            batchOp.set(newResRef, {
              teamId: t.id,
              matchNumber,
              placement: 0,
              kills: 0,
              placementPoints: 0,
              totalMatchPoints: 0,
              timestamp: serverTimestamp()
            });

            // Increment matches played for those teams
            const teamRef = doc(db, 'tournaments', tournament.id, 'teams', t.id);
            batchOp.update(teamRef, {
              matchesPlayed: ((t.matchesPlayed || 0) as number) + 1
            });
          }
        });
        await batchOp.commit();
      }

      // Actually, since queries inside transactions are restricted, we do the queries BEFORE the transaction for old PlayerResults
      const prQ = query(
        collection(db, 'tournaments', tournament.id, 'playerResults'),
        where('teamId', '==', selectedTeamId),
        where('matchNumber', '==', matchNumber)
      );
      const oldPrSnap = await getDocs(prQ);
      const oldPlayerKills: Record<string, { kills: number, docId: string }> = {};
      oldPrSnap.forEach(d => {
        oldPlayerKills[d.data().playerId] = { kills: d.data().kills, docId: d.id };
      });

      await runTransaction(db, async (tx) => {
        // Reads
        const teamRef = doc(db, 'tournaments', tournament.id, 'teams', selectedTeamId);
        const teamSnap = await tx.get(teamRef);
        if (!teamSnap.exists()) throw new Error("Team not found");
        const teamData = teamSnap.data() as Team;

        let oldMatchPoints = 0;
        let oldTeamKills = 0;
        let oldIsWin = 0;
        let oldMatchPlayedDelta = 1;

        if (existingResultDocId) {
          const oldResRef = doc(db, 'tournaments', tournament.id, 'results', existingResultDocId);
          const oldResSnap = await tx.get(oldResRef);
          if (oldResSnap.exists()) {
            const oldData = oldResSnap.data();
            oldMatchPoints = oldData.totalMatchPoints || 0;
            oldTeamKills = oldData.kills || 0;
            oldIsWin = oldData.placement === 1 ? 1 : 0;
            oldMatchPlayedDelta = 0;
          }
        }

        const playerUpdates: { pRef: any, prRef: any, newTotalKills: number, matchKills: number, isNewPr: boolean }[] = [];
        for (const [playerId, newMatchKills] of Object.entries(matchPlayerKills) as [string, number][]) {
          const oldPrData = oldPlayerKills[playerId];
          const oldMatchKills = oldPrData ? oldPrData.kills : 0;
          const killDelta = newMatchKills - oldMatchKills;

          // Read current total kills from player
          const playerRef = doc(db, 'tournaments', tournament.id, 'teams', selectedTeamId, 'players', playerId);
          const playerSnap = await tx.get(playerRef);
          
          if (playerSnap.exists()) {
            const currentTotalKills = (playerSnap.data() as any).totalKills || 0;
            
            const prRef = oldPrData ? 
              doc(db, 'tournaments', tournament.id, 'playerResults', oldPrData.docId) : 
              doc(collection(db, 'tournaments', tournament.id, 'playerResults'));

            playerUpdates.push({
              pRef: playerRef,
              prRef: prRef,
              newTotalKills: currentTotalKills + killDelta,
              matchKills: newMatchKills,
              isNewPr: !oldPrData
            });
          }
        }

        // Writes
        tx.update(teamRef, {
          totalPoints: ((teamData.totalPoints || 0) as number) - oldMatchPoints + (totalMatchPoints as number),
          totalKills: ((teamData.totalKills || 0) as number) - oldTeamKills + (totalTeamKills as number),
          matchesPlayed: ((teamData.matchesPlayed || 0) as number) + oldMatchPlayedDelta,
          wins: ((teamData.wins || 0) as number) - oldIsWin + isWin
        });

        const resRef = existingResultDocId ? 
          doc(db, 'tournaments', tournament.id, 'results', existingResultDocId) : 
          doc(collection(db, 'tournaments', tournament.id, 'results'));

        tx.set(resRef, {
          teamId: selectedTeamId,
          matchNumber,
          placement,
          kills: totalTeamKills,
          placementPoints,
          totalMatchPoints,
          timestamp: serverTimestamp() // Keeping original timestamp might be better, but this is okay
        }, { merge: true });

        for (const update of playerUpdates) {
          tx.update(update.pRef, { totalKills: update.newTotalKills });
          
          if (update.matchKills > 0 || !update.isNewPr) {
            tx.set(update.prRef, {
              tournamentId: tournament.id,
              teamId: selectedTeamId,
              playerId: update.pRef.id,
              matchNumber,
              kills: update.matchKills,
              timestamp: serverTimestamp()
            }, { merge: true });
          }
        }
      });
      
      // Update local state to reflect it's now an existing result
      // Actually fetchExistingData will re-run, so this is fine.
      showNotification("Match Points Updated Successfully!");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `tournaments/${tournament.id}/results`);
    }
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-xl font-black uppercase italic tracking-tighter">Event_Governance_Console</h3>
        </div>
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-24 right-8 z-[200] bg-slate-900 border border-slate-800 py-3 px-5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl"
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                notification.type === 'success' ? "bg-green-500 animate-pulse" : "bg-red-500"
              )} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 italic">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Team Registration */}
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl">
                  <Users className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="font-black uppercase italic text-xl tracking-tighter">Team Registration</h3>
              </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-sm space-y-6">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setRegMode('manual')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all italic",
                    regMode === 'manual' ? "bg-slate-800 text-yellow-400 font-black" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setRegMode('bulk')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all italic",
                    regMode === 'bulk' ? "bg-slate-800 text-yellow-400 font-black" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Bulk Import (CSV)
                </button>
              </div>

              {regMode === 'manual' ? (
                <form onSubmit={addTeam} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Squad Name</label>
                      <input
                        value={newTeamName}
                        required
                        onChange={e => setNewTeamName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none text-sm font-bold uppercase"
                        placeholder="E.G. TEAM_SOUL"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Squad Tag</label>
                      <input
                        value={newTeamTag}
                        required
                        onChange={e => setNewTeamTag(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none text-sm font-bold uppercase tracking-widest"
                        placeholder="TAG"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Initial Roster (Optional)</label>
                    <div className="grid grid-cols-2 gap-3">
                      {newPlayerNames.map((name, i) => (
                        <input
                          key={i}
                          value={name}
                          onChange={e => {
                            const updated = [...newPlayerNames];
                            updated[i] = e.target.value;
                            setNewPlayerNames(updated);
                          }}
                          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 focus:border-yellow-400 focus:outline-none text-[11px] font-bold uppercase"
                          placeholder={`Player ${i + 1}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-center">
                      {newPlayerNames.length < 5 && (
                        <button
                          type="button"
                          onClick={() => setNewPlayerNames([...newPlayerNames, ""] )}
                          className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-yellow-400 transition-colors"
                        >
                          + Add Player Row
                        </button>
                      )}
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-slate-100 text-slate-950 py-3 rounded-xl font-black uppercase tracking-wider text-[10px] hover:bg-white transition-all shadow-xl shadow-white/5 active:scale-95">
                    Register Squad Terminal
                  </button>
                </form>
              ) : (
                parsedTeams.length === 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-yellow-400/40 rounded-2xl p-8 bg-slate-950/30 transition-all text-center relative group">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-8 h-8 text-slate-500 group-hover:text-yellow-400 transition-colors mb-2" />
                      <p className="text-xs font-bold text-slate-300">Click or Drag & Drop CSV</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Files must be in CSV format</p>
                    </div>

                    <button
                      type="button"
                      onClick={downloadCSVTemplate}
                      className="w-full flex items-center justify-center gap-2 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 hover:text-white py-3 rounded-xl font-black uppercase tracking-wider text-[10px] transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download CSV Template
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 italic">Parsed {parsedTeams.length} Squads</span>
                      <button 
                        type="button" 
                        onClick={() => setParsedTeams([])} 
                        className="text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-wider"
                      >
                        Clear Upload
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-2xl custom-scrollbar bg-slate-950/50">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 bg-slate-950 sticky top-0 italic">
                            <th className="px-4 py-2 text-left">Slot</th>
                            <th className="px-4 py-2 text-left">Team Name</th>
                            <th className="px-4 py-2 text-left">Roster</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedTeams.map((pt, idx) => (
                            <tr key={idx} className="border-b border-slate-800/40 last:border-0 hover:bg-slate-800/20">
                              <td className="px-4 py-2 font-black italic text-yellow-400">{pt.tag}</td>
                              <td className="px-4 py-2 font-bold text-slate-200 uppercase">{pt.name}</td>
                              <td className="px-4 py-2 text-slate-400 text-[10px]">
                                {pt.players.join(', ') || 'No players'}
                                {pt.players.length < 4 && <span className="text-red-400 ml-1 font-bold">(Auto-fills {4 - pt.players.length} placeholders)</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      disabled={isImporting}
                      onClick={importBulkTeams}
                      className={cn(
                        "w-full bg-yellow-400 text-slate-950 py-3.5 rounded-xl font-black uppercase tracking-wider text-xs shadow-xl shadow-yellow-400/10 active:scale-95 transition-all flex items-center justify-center gap-2",
                        isImporting && "opacity-50 cursor-wait"
                      )}
                    >
                      {isImporting ? "Importing Roster..." : <>Confirm & Import Teams <Check className="w-4 h-4" /></>}
                    </button>
                  </div>
                )
              )}

              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Edit Roster / Manage Squads</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Global Squad Registry</label>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {teams.length === 0 ? (
                      <p className="text-[10px] italic text-slate-700 py-4 text-center border border-dashed border-slate-800 rounded-xl">No squads registered in this arena</p>
                    ) : (
                      teams.map(t => (
                        <div key={t.id} className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer relative group",
                          teamForPlayer === t.id ? "bg-yellow-400/5 border-yellow-400/20" : "bg-slate-950 border-slate-800 hover:border-slate-700",
                          isDeleting === t.id && "opacity-50 pointer-events-none"
                        )} onClick={() => { if (!editingTeamId) setTeamForPlayer(t.id); }}>
                          {isDeleting === t.id && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 rounded-xl z-10">
                              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                          {editingTeamId === t.id ? (
                            <div className="flex-1 flex items-center gap-2 mr-2" onClick={(e) => e.stopPropagation()}>
                              <input 
                                value={editingTeamTag} 
                                onChange={e => setEditingTeamTag(e.target.value)} 
                                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-black italic text-slate-300 uppercase"
                                placeholder="TAG"
                              />
                              <input 
                                value={editingTeamName} 
                                onChange={e => setEditingTeamName(e.target.value)} 
                                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white uppercase"
                                placeholder="TEAM NAME"
                              />
                              <button onClick={() => updateTeam(t.id)} className="text-green-400 hover:text-green-300 p-1">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingTeamId(null)} className="text-slate-500 hover:text-slate-400 p-1">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 bg-slate-900 border border-slate-800 rounded flex items-center justify-center text-[10px] font-black text-slate-500 italic">{t.tag}</div>
                                <span className="text-xs font-bold text-slate-300 uppercase">{t.name}</span>
                              </div>
                              <div className="flex items-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  disabled={isDeleting !== null}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTeamId(t.id);
                                    setEditingTeamName(t.name);
                                    setEditingTeamTag(t.tag);
                                  }}
                                  className="text-slate-700 hover:text-blue-400 transition-colors p-1"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  disabled={isDeleting !== null}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTeam(t.id, t.name);
                                  }}
                                  className="text-slate-700 hover:text-red-500 transition-colors p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {teamForPlayer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-4 border-t border-slate-800/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 italic">Managing: {teams.find(t => t.id === teamForPlayer)?.name}</span>
                      <button onClick={() => setTeamForPlayer("")} className="text-[10px] font-bold text-slate-500 uppercase">Close</button>
                    </div>

                    <form onSubmit={addPlayer} className="flex gap-2">
                      <input
                        value={newPlayerName}
                        required
                        onChange={e => setNewPlayerName(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none text-sm font-bold"
                        placeholder="Add Player Name"
                      />
                      <button type="submit" className="bg-yellow-400 text-slate-950 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">
                        Add
                      </button>
                    </form>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {teamPlayers.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800/50 group/item">
                          {editingPlayerId === p.id ? (
                            <div className="flex-1 flex items-center gap-2 mr-2">
                              <input 
                                value={editingPlayerName} 
                                onChange={e => setEditingPlayerName(e.target.value)} 
                                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-bold text-white"
                                placeholder="Player Name"
                              />
                              <button onClick={() => updatePlayer(p.id)} className="text-green-400 hover:text-green-300 p-1">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingPlayerId(null)} className="text-slate-500 hover:text-slate-400 p-1">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-bold text-slate-300">{p.name}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingPlayerId(p.id);
                                    setEditingPlayerName(p.name);
                                  }}
                                  className="text-slate-700 hover:text-blue-400 transition-colors p-1"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`Expel ${p.name} from squad?`)) {
                                      await deleteDoc(doc(db, 'tournaments', tournament.id, 'teams', teamForPlayer, 'players', p.id));
                                      showNotification(`${p.name} removed`);
                                    }
                                  }}
                                  className="text-slate-700 hover:text-red-500 transition-colors p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        disabled={isDeleting !== null}
                        onClick={() => {
                          const team = teams.find(t => t.id === teamForPlayer);
                          if (team) deleteTeam(team.id, team.name);
                        }}
                        className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 group/dismantle"
                      >
                        <Trash2 className="w-3.5 h-3.5 group-hover/dismantle:animate-bounce" /> Dismantle Entire Squad Registry
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Match Update */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-yellow-400">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h3 className="font-black uppercase italic text-xl tracking-tighter">Match Update</h3>
            </div>
          </div>

          <form onSubmit={addMatchStatus} className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-sm space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Match Number</label>
                <input
                  type="number"
                  min="1"
                  value={matchNumber}
                  required
                  onChange={e => setMatchNumber(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 focus:border-yellow-400 focus:outline-none text-sm font-black"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Squad</label>
                <select
                  value={selectedTeamId}
                  required
                  onChange={e => setSelectedTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 focus:border-yellow-400 focus:outline-none text-xs font-black uppercase tracking-widest appearance-none"
                >
                  <option value="">-- SQUAD --</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.tag} // {t.name}</option>)}
                </select>
              </div>
            </div>

            {selectedTeamId && (
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Player Frags</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.keys(matchPlayerKills).length === 0 ? (
                    <p className="text-[10px] italic text-slate-600">No players registered for this team.</p>
                  ) : (
                    Object.entries(matchPlayerKills).map(([pid, pkills]) => {
                      const pName = selectedTeamPlayers.find(tp => tp.id === pid)?.name || "Player";
                      return (
                        <div key={pid} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800/50">
                          <span className="text-xs font-bold text-slate-400">{pName}</span>
                          <input
                            type="number"
                            min={0}
                            value={pkills || 0}
                            onChange={e => setMatchPlayerKills(prev => ({ ...prev, [pid]: parseInt(e.target.value) || 0 }))}
                            className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-center text-xs font-black text-yellow-400"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Placement</label>
              <input
                type="number"
                min={0}
                required
                value={placement}
                onChange={e => setPlacement(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 focus:border-yellow-400 focus:outline-none text-sm font-black"
              />
            </div>

            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-500">
                <span>Position Points</span>
                <span className="text-slate-300 font-mono italic">{(placement > 0 ? (SCORING as any)[tournament.gameType].placement[placement - 1] : 0) || 0} PTS</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-500">
                <span>Frag Points</span>
                <span className="text-slate-300 font-mono italic">{(Object.values(matchPlayerKills) as number[]).reduce((a: number, b: number) => a + b, 0)} ELIMS</span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[11px] font-black uppercase italic text-yellow-400">Total match score</span>
                <span className="text-2xl font-black italic tracking-tighter text-yellow-400">
                  {((placement > 0 ? (SCORING as any)[tournament.gameType].placement[placement - 1] : 0) || 0) + (((Object.values(matchPlayerKills) as number[]).reduce((a: number, b: number) => a + b, 0) as number) * ((SCORING as any)[tournament.gameType].kill as number))}
                </span>
              </div>
            </div>

            <button type="submit" className="w-full bg-yellow-400 text-slate-950 py-4 rounded-xl font-black uppercase tracking-wider text-xs hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 group">
              Update Points <Zap className="w-3.5 h-3.5 group-hover:animate-pulse" />
            </button>
          </form>
        </div>

        <div className="col-span-full">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Admin Notifications</p>
              <p className="mt-3 text-sm text-slate-200 leading-relaxed">
                {notification ? notification.message : 'No active notifications. Save announcements or update matches to see system alerts here.'}
              </p>
            </div>
            <div className="text-[10px] uppercase font-black tracking-[0.25em] text-slate-400">
              {notification ? notification.type.toUpperCase() : 'STATUS: IDLE'}
            </div>
          </div>
        </div>

        <div className="col-span-full space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl">
                  <Bell className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="font-black uppercase italic text-xl tracking-tighter">Live Announcement</h3>
              </div>
              <button
                onClick={saveAnnouncement}
                className="bg-yellow-400 text-slate-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-300 transition-colors"
              >
                Save
              </button>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-sm space-y-4">
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                rows={5}
                placeholder="Type a message for viewers. It will be shown above the leaderboard."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:border-yellow-400 focus:outline-none"
              />
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                This announcement will appear for everyone viewing the leaderboard.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Danger Zone: Complete Tournament */}
      <div className="pt-12 border-t border-slate-800/50">
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 md:p-8 relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-5 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
            <Lock className="w-64 h-64 text-red-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-red-400">Finalize Event</h3>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl mb-6">
              Marking this tournament as completed will freeze the leaderboard, generate the final post-match reports, and schedule the event for server deletion after 2 hours to conserve database resources.
            </p>
            <button
              onClick={completeTournament}
              disabled={isCompleting || tournament.status === 'completed'}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 shadow-lg shadow-red-500/20"
            >
              {isCompleting ? "Finalizing..." : tournament.status === 'completed' ? "Tournament Completed" : "Complete & Finalize Event"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
