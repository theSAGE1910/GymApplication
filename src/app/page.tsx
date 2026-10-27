'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useWorkoutStore, SetType } from '@/store/useWorkoutStore';
import { supabase } from '@/lib/supabase';
import {
  Dumbbell,
  Plus,
  Check,
  Trash2,
  Clock,
  Trophy,
  X,
  Play,
  SkipForward,
  Calendar,
  FolderPlus,
  ClipboardList,
  BarChart3,
  TrendingUp,
  Calculator,
  Link2,
  User as UserIcon,
  LogOut,
  Flame,
} from 'lucide-react';

interface DbExercise {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
  isCustom?: boolean;
}

const SET_TYPE_Order: SetType[] = ['NORMAL', 'WARMUP', 'DROPSET', 'FAILURE'];

const MUSCLE_GROUPS = [
  'CHEST',
  'BACK',
  'SHOULDERS',
  'BICEPS',
  'TRICEPS',
  'QUADRICEPS',
  'HAMSTRINGS',
  'GLUTES',
  'CALVES',
  'ABS',
  'FOREARMS',
  'FULL_BODY',
];

const EQUIPMENT_TYPES = [
  'BARBELL',
  'DUMBBELL',
  'MACHINE',
  'CABLE',
  'BODYWEIGHT',
  'KETTLEBELL',
  'BAND',
  'OTHER',
];

const STANDARD_PLATES = [
  { weight: 25, color: 'bg-red-600 text-white h-24' },
  { weight: 20, color: 'bg-blue-600 text-white h-24' },
  { weight: 15, color: 'bg-amber-400 text-slate-950 h-20' },
  { weight: 10, color: 'bg-emerald-500 text-slate-950 h-16' },
  { weight: 5, color: 'bg-slate-100 text-slate-950 h-14' },
  { weight: 2.5, color: 'bg-slate-700 text-white h-12' },
  { weight: 1.25, color: 'bg-slate-500 text-white h-10' },
];

export default function HevyCloneApp() {
  const {
    isActive,
    workoutName,
    startTime,
    restEndTime,
    exercises,
    startEmptyWorkout,
    startWorkoutFromRoutine,
    updateWorkoutName,
    addExercise,
    setExercisePreviousSets,
    updateExerciseNotes,
    toggleSuperset,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    toggleSetComplete,
    skipRestTimer,
    addRestTime,
    discardWorkout,
  } = useWorkoutStore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'workout' | 'analytics'>('workout');
  const [dbExercises, setDbExercises] = useState<DbExercise[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [pastWorkouts, setPastWorkouts] = useState<any[]>([]);
  const [selectedAnalyticsExId, setSelectedAnalyticsExId] = useState<string>('');

  // Auth State
  const [userEmail, setUserEmail] = useState<string>('athlete@hevy-clone.local');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authInputEmail, setAuthInputEmail] = useState('');
  const [authInputPassword, setAuthInputPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Modals
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showCreateExerciseModal, setShowCreateExerciseModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [plateCalcWeight, setPlateCalcWeight] = useState('100');
  const [barWeight, setBarWeight] = useState(20);
  const [routinePickerMode, setRoutinePickerMode] = useState(false);

  // Custom Exercise Form State
  const [customExName, setCustomExName] = useState('');
  const [customExMuscle, setCustomExMuscle] = useState('CHEST');
  const [customExEquipment, setCustomExEquipment] = useState('BARBELL');

  // Routine Builder Draft State
  const [draftRoutineName, setDraftRoutineName] = useState('');
  const [draftRoutineExercises, setDraftRoutineExercises] = useState<
      {
        id: string;
        exerciseId: string;
        name: string;
        sets: { weight: string; reps: string }[];
      }[]
  >([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [restRemainingSec, setRestRemainingSec] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const authHeaders = useCallback(
      (extra: Record<string, string> = {}) => ({
        'x-user-email': userEmail,
        ...extra,
      }),
      [userEmail]
  );

  const fetchExercises = useCallback(() => {
    fetch('/api/exercises')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setDbExercises(data);
            if (data.length > 0 && !selectedAnalyticsExId) {
              setSelectedAnalyticsExId(data[0].id);
            }
          }
        });
  }, [selectedAnalyticsExId]);

  const fetchRoutines = useCallback(() => {
    fetch('/api/routines', { headers: authHeaders() })
        .then((res) => res.json())
        .then((data) => Array.isArray(data) && setRoutines(data));
  }, [authHeaders]);

  const fetchWorkouts = useCallback(() => {
    fetch('/api/workouts', { headers: authHeaders() })
        .then((res) => res.json())
        .then((data) => Array.isArray(data) && setPastWorkouts(data));
  }, [authHeaders]);

  // Check Supabase session on mount
  useEffect(() => {
    setMounted(true);
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserEmail(session?.user?.email || 'athlete@hevy-clone.local');
      });
      return () => listener.subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchExercises();
    fetchRoutines();
    fetchWorkouts();
  }, [mounted, userEmail, fetchExercises, fetchRoutines, fetchWorkouts]);

  // Live Workout Duration & Rest Timer Ticker
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      if (startTime) {
        setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
      }
      if (restEndTime) {
        const remaining = Math.ceil((restEndTime - Date.now()) / 1000);
        if (remaining <= 0) {
          setRestRemainingSec(0);
          skipRestTimer();
        } else {
          setRestRemainingSec(remaining);
        }
      } else {
        setRestRemainingSec(0);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isActive, startTime, restEndTime, skipRestTimer]);

  if (!mounted) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${mins}:${remSec < 10 ? '0' : ''}${remSec}`;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Fallback if NEXT_PUBLIC_SUPABASE_URL isn't set yet: allow instant profile switching by email
    if (!supabase) {
      if (authInputEmail.includes('@')) {
        setUserEmail(authInputEmail.toLowerCase().trim());
        setShowAuthModal(false);
      } else {
        setAuthError('Please enter a valid email address.');
      }
      return;
    }

    setAuthLoading(true);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: authInputEmail,
          password: authInputPassword,
        });
        if (error) throw error;
        setShowAuthModal(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authInputEmail,
          password: authInputPassword,
        });
        if (error) throw error;
        setShowAuthModal(false);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUserEmail('athlete@hevy-clone.local');
    setShowAuthModal(false);
  };

  const calculatePlatesPerSide = (targetTotal: number, barbell: number) => {
    const platesPerSide: { weight: number; color: string }[] = [];
    if (targetTotal <= barbell) return platesPerSide;
    let remainingOneSide = (targetTotal - barbell) / 2;

    for (const plate of STANDARD_PLATES) {
      while (remainingOneSide >= plate.weight - 0.001) {
        platesPerSide.push(plate);
        remainingOneSide = Number((remainingOneSide - plate.weight).toFixed(2));
      }
    }
    return platesPerSide;
  };

  const platesNeeded = calculatePlatesPerSide(parseFloat(plateCalcWeight) || 0, barWeight);

  const handleCreateCustomExercise = async () => {
    if (!customExName.trim()) return;
    const res = await fetch('/api/exercises', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: customExName,
        primaryMuscle: customExMuscle,
        equipment: customExEquipment,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setCustomExName('');
      setShowCreateExerciseModal(false);
      fetchExercises();
      if (!routinePickerMode && isActive) {
        handleSelectExerciseForWorkout(created);
      }
    }
  };

  const handleSelectExerciseForWorkout = async (ex: DbExercise) => {
    setShowExerciseModal(false);
    setSearchQuery('');
    try {
      const res = await fetch(`/api/exercises/history?exerciseId=${ex.id}`, {
        headers: authHeaders(),
      });
      const prevSets = res.ok ? await res.json() : [];
      addExercise(ex, Array.isArray(prevSets) ? prevSets : []);
    } catch {
      addExercise(ex, []);
    }
  };

  const handleStartRoutine = async (routine: any) => {
    startWorkoutFromRoutine(routine);
    setActiveTab('workout');
    setTimeout(async () => {
      const currentExercises = useWorkoutStore.getState().exercises;
      for (const we of currentExercises) {
        try {
          const res = await fetch(`/api/exercises/history?exerciseId=${we.exerciseId}`, {
            headers: authHeaders(),
          });
          if (res.ok) {
            const prevSets = await res.json();
            if (Array.isArray(prevSets) && prevSets.length > 0) {
              setExercisePreviousSets(we.id, prevSets);
            }
          }
        } catch {
          // ignore offline error
        }
      }
    }, 50);
  };

  const handleSaveRoutine = async () => {
    if (!draftRoutineName.trim() || draftRoutineExercises.length === 0) {
      alert('Give your routine a name and add at least one exercise.');
      return;
    }
    const res = await fetch('/api/routines', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: draftRoutineName,
        exercises: draftRoutineExercises,
      }),
    });
    if (res.ok) {
      setDraftRoutineName('');
      setDraftRoutineExercises([]);
      setShowRoutineModal(false);
      fetchRoutines();
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (!confirm('Delete this routine template?')) return;
    await fetch(`/api/routines?id=${id}`, { method: 'DELETE', headers: authHeaders() });
    fetchRoutines();
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Delete this workout log from your history?')) return;
    await fetch(`/api/workouts?id=${id}`, { method: 'DELETE', headers: authHeaders() });
    fetchWorkouts();
  };

  const liveStats = exercises.reduce(
      (acc, ex) => {
        ex.sets.forEach((s) => {
          if (s.isCompleted) {
            acc.sets += 1;
            acc.volume += (parseFloat(s.weight) || 0) * (parseInt(s.reps, 10) || 0);
          }
        });
        return acc;
      },
      { volume: 0, sets: 0 }
  );

  const cycleSetType = (workoutExId: string, setId: string, current: SetType) => {
    const nextIndex = (SET_TYPE_Order.indexOf(current) + 1) % SET_TYPE_Order.length;
    updateSet(workoutExId, setId, 'setType', SET_TYPE_Order[nextIndex]);
  };

  const handleFinishWorkout = async () => {
    if (liveStats.sets === 0) {
      alert('Complete at least one set (tap the green checkmark) before finishing!');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ workoutName, startTime, exercises }),
      });
      if (res.ok) {
        discardWorkout();
        fetchWorkouts();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save workout');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredExercises = dbExercises.filter(
      (ex) =>
          ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ex.primaryMuscle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ================= ANALYTICS & HEATMAP CALCULATIONS =================
  const totalCompletedWorkouts = pastWorkouts.length;
  const lifetimeVolume = pastWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

  // Build 84-day (12-week) consistency calendar heatmap
  const workoutSetsByDay: Record<string, { sets: number; workouts: number }> = {};
  pastWorkouts.forEach((w) => {
    const dayKey = new Date(w.startTime).toISOString().split('T')[0];
    if (!workoutSetsByDay[dayKey]) {
      workoutSetsByDay[dayKey] = { sets: 0, workouts: 0 };
    }
    workoutSetsByDay[dayKey].sets += w.totalSets || 0;
    workoutSetsByDay[dayKey].workouts += 1;
  });

  const heatmapDays: { dateKey: string; label: string; sets: number; workouts: number }[] = [];
  const today = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    heatmapDays.push({
      dateKey: key,
      label,
      sets: workoutSetsByDay[key]?.sets || 0,
      workouts: workoutSetsByDay[key]?.workouts || 0,
    });
  }

  const activeDaysLast12Weeks = heatmapDays.filter((d) => d.workouts > 0).length;

  const muscleCounts: Record<string, number> = {};
  let totalLoggedSets = 0;
  pastWorkouts.forEach((w) => {
    w.exercises?.forEach((we: any) => {
      const m = we.exercise?.primaryMuscle || 'OTHER';
      const setLen = we.sets?.length || 0;
      muscleCounts[m] = (muscleCounts[m] || 0) + setLen;
      totalLoggedSets += setLen;
    });
  });

  // Selected Exercise Progression & PRs
  const exerciseSessions: { date: string; bestWeight: number; best1Rm: number; bestVolume: number }[] = [];
  let allTimeBestWeight = 0;
  let allTimeBest1Rm = 0;
  let allTimeBestVolume = 0;

  [...pastWorkouts].reverse().forEach((w) => {
    w.exercises?.forEach((we: any) => {
      if (we.exerciseId === selectedAnalyticsExId && we.sets?.length > 0) {
        let sessionMaxWeight = 0;
        let sessionMax1Rm = 0;
        let sessionMaxVol = 0;
        we.sets.forEach((s: any) => {
          const wt = s.weight || 0;
          const rp = s.reps || 0;
          const rm = s.estimated1Rm || (wt > 0 && rp > 0 ? Number((wt * (1 + rp / 30)).toFixed(1)) : 0);
          const vol = wt * rp;
          if (wt > sessionMaxWeight) sessionMaxWeight = wt;
          if (rm > sessionMax1Rm) sessionMax1Rm = rm;
          if (vol > sessionMaxVol) sessionMaxVol = vol;
        });

        if (sessionMaxWeight > allTimeBestWeight) allTimeBestWeight = sessionMaxWeight;
        if (sessionMax1Rm > allTimeBest1Rm) allTimeBest1Rm = sessionMax1Rm;
        if (sessionMaxVol > allTimeBestVolume) allTimeBestVolume = sessionMaxVol;

        exerciseSessions.push({
          date: new Date(w.startTime).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          }),
          bestWeight: sessionMaxWeight,
          best1Rm: sessionMax1Rm,
          bestVolume: sessionMaxVol,
        });
      }
    });
  });

  return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-36">
        {/* TOP BAR */}
        <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">HEVY CLONE</span>
          </div>

          <div className="flex items-center gap-2">
            <button
                onClick={() => setShowPlateCalc(true)}
                title="Barbell Plate Calculator"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-lg transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <Calculator className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Plates</span>
            </button>

            {!isActive && (
                <button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-2 rounded-lg transition flex items-center gap-1.5 text-xs font-semibold"
                    title="Account & Login"
                >
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                  <span className="max-w-[90px] truncate hidden sm:inline">
                {userEmail === 'athlete@hevy-clone.local' ? 'Sign In' : userEmail.split('@')[0]}
              </span>
                </button>
            )}

            {isActive && (
                <button
                    onClick={handleFinishWorkout}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-4 py-1.5 rounded-lg text-sm transition"
                >
                  {isSaving ? 'Saving...' : 'Finish'}
                </button>
            )}
          </div>
        </header>

        <main className="max-w-2xl mx-auto p-4 space-y-6">
          {activeTab === 'analytics' && !isActive ? (
              /* ================= ANALYTICS, HEATMAP & PR DASHBOARD ================= */
              <div className="space-y-6">
                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-400">Workouts</p>
                    <p className="text-2xl font-bold text-white mt-1">{totalCompletedWorkouts}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-400">Total Volume</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">
                      {lifetimeVolume.toLocaleString()} <span className="text-xs">kg</span>
                    </p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-400">Total Sets</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{totalLoggedSets}</p>
                  </div>
                </div>

                {/* 12-WEEK CONSISTENCY CALENDAR HEATMAP */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-base flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-400" />
                      12-Week Consistency Heatmap
                    </h2>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  {activeDaysLast12Weeks} Active Days
                </span>
                  </div>

                  <div className="grid grid-cols-12 gap-1.5 pt-1">
                    {heatmapDays.map((day) => {
                      const colorClass =
                          day.sets === 0
                              ? 'bg-slate-800/80 border-slate-800'
                              : day.sets < 8
                                  ? 'bg-emerald-900/80 border-emerald-700/60'
                                  : day.sets < 16
                                      ? 'bg-emerald-600 border-emerald-500'
                                      : 'bg-emerald-400 border-emerald-300 shadow-sm shadow-emerald-400/30';

                      return (
                          <div
                              key={day.dateKey}
                              title={`${day.label}: ${day.workouts} workout(s), ${day.sets} sets`}
                              className={`aspect-square rounded-md border ${colorClass} transition hover:scale-110`}
                          />
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>12 weeks ago</span>
                    <div className="flex items-center gap-1.5">
                      <span>Rest</span>
                      <span className="w-3 h-3 rounded-sm bg-slate-800 inline-block" />
                      <span className="w-3 h-3 rounded-sm bg-emerald-900 inline-block" />
                      <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" />
                      <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />
                      <span>High Sets</span>
                    </div>
                    <span>Today</span>
                  </div>
                </div>

                {/* MUSCLE DISTRIBUTION */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h2 className="font-bold text-base flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    Muscle Split (Sets Logged)
                  </h2>
                  {totalLoggedSets === 0 ? (
                      <p className="text-sm text-slate-400">Log a workout to see your muscle distribution.</p>
                  ) : (
                      <div className="space-y-2.5">
                        {Object.entries(muscleCounts)
                            .sort((a, b) => b[1] - a[1])
                            .map(([muscle, count]) => {
                              const pct = Math.round((count / totalLoggedSets) * 100);
                              return (
                                  <div key={muscle} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="font-semibold text-slate-200">{muscle}</span>
                                      <span className="text-slate-400">
                              {count} sets ({pct}%)
                            </span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                      <div
                                          className="bg-blue-500 h-full rounded-full"
                                          style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                              );
                            })}
                      </div>
                  )}
                </div>

                {/* EXERCISE PRs & PROGRESSION */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-base flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Exercise Progression & PRs
                    </h2>
                  </div>

                  <select
                      value={selectedAnalyticsExId}
                      onChange={(e) => setSelectedAnalyticsExId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {dbExercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name} ({ex.primaryMuscle})
                        </option>
                    ))}
                  </select>

                  {/* ALL-TIME PR TROPHY CARDS */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                      <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <p className="text-[11px] text-slate-400">Heaviest Weight</p>
                      <p className="font-bold text-sm text-white mt-0.5">{allTimeBestWeight} kg</p>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                      <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <p className="text-[11px] text-slate-400">Best Est. 1RM</p>
                      <p className="font-bold text-sm text-amber-400 mt-0.5">{allTimeBest1Rm} kg</p>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                      <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <p className="text-[11px] text-slate-400">Best Set Volume</p>
                      <p className="font-bold text-sm text-emerald-400 mt-0.5">{allTimeBestVolume} kg</p>
                    </div>
                  </div>

                  {/* BAR CHART OF ESTIMATED 1RM OVER TIME */}
                  {exerciseSessions.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">
                        No completed sessions for this exercise yet.
                      </p>
                  ) : (
                      <div className="space-y-2 pt-2">
                        <p className="text-xs text-slate-400 font-semibold">
                          Estimated 1RM Progression (kg)
                        </p>
                        <div className="flex items-end gap-3 h-36 pt-6 px-2 bg-slate-950/50 rounded-xl border border-slate-800/80 overflow-x-auto">
                          {exerciseSessions.map((sess, i) => {
                            const heightPct =
                                allTimeBest1Rm > 0
                                    ? Math.max(15, Math.round((sess.best1Rm / allTimeBest1Rm) * 100))
                                    : 20;
                            return (
                                <div
                                    key={i}
                                    className="flex flex-col items-center justify-end h-full flex-1 min-w-[44px]"
                                >
                          <span className="text-[10px] font-bold text-blue-400 mb-1">
                            {sess.best1Rm}
                          </span>
                                  <div
                                      className="w-full max-w-[32px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all"
                                      style={{ height: `${heightPct}%` }}
                                  />
                                  <span className="text-[10px] text-slate-400 mt-1.5 truncate">
                            {sess.date}
                          </span>
                                </div>
                            );
                          })}
                        </div>
                      </div>
                  )}
                </div>
              </div>
          ) : !isActive ? (
              /* ================= HOME / DASHBOARD VIEW ================= */
              <div className="space-y-8">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Quick Start</h2>
                    <span className="text-xs text-slate-400">
                   Athlete: <strong className="text-slate-200">{userEmail.split('@')[0]}</strong>
                </span>
                  </div>
                  <button
                      onClick={() => startEmptyWorkout('Workout Session')}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Empty Workout
                  </button>
                </div>

                {/* MY ROUTINES SECTION */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-blue-400" />
                      My Routines ({routines.length})
                    </h2>
                    <button
                        onClick={() => setShowRoutineModal(true)}
                        className="bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
                    >
                      <FolderPlus className="w-4 h-4" />
                      New Routine
                    </button>
                  </div>

                  {routines.length === 0 ? (
                      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 text-center text-slate-400 text-sm">
                        No routines yet. Create a routine template (like &ldquo;Push Day&rdquo; or &ldquo;Full Body&rdquo;) to start workouts with one tap!
                      </div>
                  ) : (
                      <div className="grid gap-4">
                        {routines.map((r) => (
                            <div
                                key={r.id}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-bold text-base text-white">{r.name}</h3>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {r.exercises?.map((re: any) => re.exercise?.name).join(' • ')}
                                  </p>
                                </div>
                                <button
                                    onClick={() => handleDeleteRoutine(r.id)}
                                    className="text-slate-500 hover:text-red-400 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <button
                                  onClick={() => handleStartRoutine(r)}
                                  className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 font-semibold py-2.5 rounded-xl text-sm transition"
                              >
                                Start Routine
                              </button>
                            </div>
                        ))}
                      </div>
                  )}
                </div>

                {/* WORKOUT HISTORY FEED WITH PR BADGES */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    Recent Workouts
                  </h2>

                  {pastWorkouts.length === 0 ? (
                      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-400">
                        No workouts logged yet. Start your first session above!
                      </div>
                  ) : (
                      pastWorkouts.map((w) => {
                        const prCount =
                            w.exercises?.reduce(
                                (cnt: number, we: any) =>
                                    cnt +
                                    (we.sets?.filter((s: any) => s.isWeightPr || s.is1RmPr).length || 0),
                                0
                            ) || 0;

                        return (
                            <div
                                key={w.id}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-base text-white">{w.name}</h3>
                                    {prCount > 0 && (
                                        <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Trophy className="w-3 h-3" /> {prCount} PR{prCount > 1 ? 's' : ''}
                              </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {new Date(w.startTime).toLocaleDateString(undefined, {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                  <div>
                                    <p className="text-xs text-slate-400">Volume</p>
                                    <p className="font-semibold text-sm">{w.totalVolume} kg</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-400">Sets</p>
                                    <p className="font-semibold text-sm">{w.totalSets}</p>
                                  </div>
                                  <button
                                      onClick={() => handleDeleteWorkout(w.id)}
                                      className="text-slate-600 hover:text-red-400 p-1"
                                      title="Delete Workout"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="border-t border-slate-800 pt-3 space-y-1.5">
                                {w.exercises?.map((we: any) => {
                                  const hasPr = we.sets?.some((s: any) => s.isWeightPr || s.is1RmPr);
                                  return (
                                      <div
                                          key={we.id}
                                          className="text-sm text-slate-300 flex justify-between items-center"
                                      >
                              <span>
                                <span className="font-semibold text-blue-400">
                                  {we.sets?.length} sets
                                </span>{' '}
                                × {we.exercise?.name}
                              </span>
                                        <div className="flex items-center gap-2">
                                          {hasPr && (
                                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                                    🏆 PR
                                  </span>
                                          )}
                                          {we.sets?.[0] && (
                                              <span className="text-slate-400 text-xs">
                                    Best: {we.sets[0].weight}kg × {we.sets[0].reps}
                                  </span>
                                          )}
                                        </div>
                                      </div>
                                  );
                                })}
                              </div>
                            </div>
                        );
                      })
                  )}
                </div>
              </div>
          ) : (
              /* ================= ACTIVE WORKOUT LOGGER VIEW ================= */
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <input
                      type="text"
                      value={workoutName}
                      onChange={(e) => updateWorkoutName(e.target.value)}
                      className="bg-transparent text-xl font-bold w-full focus:outline-none focus:border-b border-blue-500"
                      placeholder="Workout Name"
                  />
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Duration</p>
                      <p className="font-mono font-semibold text-blue-400">
                        {formatDuration(elapsedSec)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Volume</p>
                      <p className="font-semibold">{liveStats.volume} kg</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Sets</p>
                      <p className="font-semibold">{liveStats.sets}</p>
                    </div>
                  </div>
                </div>

                {exercises.map((ex) => (
                    <div
                        key={ex.id}
                        className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition ${
                            ex.supersetGroupId === 1
                                ? 'border-l-4 border-l-purple-500 border-slate-800'
                                : ex.supersetGroupId === 2
                                    ? 'border-l-4 border-l-pink-500 border-slate-800'
                                    : 'border-slate-800'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-blue-400 text-base">{ex.name}</h3>
                            {ex.supersetGroupId && (
                                <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        ex.supersetGroupId === 1
                                            ? 'bg-purple-500/20 text-purple-300'
                                            : 'bg-pink-500/20 text-pink-300'
                                    }`}
                                >
                          Superset {ex.supersetGroupId === 1 ? 'A' : 'B'}
                        </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 uppercase tracking-wider">
                      {ex.primaryMuscle} • {ex.equipment}
                    </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                              onClick={() => toggleSuperset(ex.id)}
                              title="Toggle Superset Group (None -> A -> B)"
                              className={`p-1.5 rounded-lg transition ${
                                  ex.supersetGroupId
                                      ? 'bg-purple-500/20 text-purple-300'
                                      : 'text-slate-500 hover:text-slate-300'
                              }`}
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                          <button
                              onClick={() => removeExercise(ex.id)}
                              className="text-slate-500 hover:text-red-400 p-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* EXERCISE NOTES */}
                      <input
                          type="text"
                          placeholder="Add exercise notes (e.g. seat height 4, slow eccentric)..."
                          value={ex.notes || ''}
                          onChange={(e) => updateExerciseNotes(ex.id, e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />

                      {/* SETS TABLE WITH RPE */}
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-12 gap-1 text-[10px] font-semibold text-slate-400 px-1">
                          <div className="col-span-1">SET</div>
                          <div className="col-span-3 text-center">PREVIOUS</div>
                          <div className="col-span-3 text-center">KG</div>
                          <div className="col-span-2 text-center">REPS</div>
                          <div className="col-span-1 text-center">RPE</div>
                          <div className="col-span-2 text-right">✓</div>
                        </div>

                        {ex.sets.map((s) => (
                            <div
                                key={s.id}
                                className={`grid grid-cols-12 gap-1 items-center p-1.5 rounded-xl transition ${
                                    s.isCompleted ? 'bg-emerald-950/40 border border-emerald-800/40' : ''
                                }`}
                            >
                              <div className="col-span-1 flex items-center">
                                <button
                                    onClick={() => cycleSetType(ex.id, s.id, s.setType)}
                                    className={`w-6 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${
                                        s.setType === 'WARMUP'
                                            ? 'bg-amber-500/20 text-amber-400'
                                            : s.setType === 'DROPSET'
                                                ? 'bg-purple-500/20 text-purple-400'
                                                : s.setType === 'FAILURE'
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : 'bg-slate-800 text-slate-200'
                                    }`}
                                >
                                  {s.setType === 'NORMAL' ? s.setNumber : s.setType[0]}
                                </button>
                              </div>

                              <div className="col-span-3 text-center text-[11px] text-slate-400 font-medium truncate">
                                {s.previousText || '—'}
                              </div>

                              <div className="col-span-3">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={s.weight}
                                    onChange={(e) => updateSet(ex.id, s.id, 'weight', e.target.value)}
                                    className="w-full bg-slate-800/90 text-center rounded-lg py-1.5 font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>

                              <div className="col-span-2">
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={s.reps}
                                    onChange={(e) => updateSet(ex.id, s.id, 'reps', e.target.value)}
                                    className="w-full bg-slate-800/90 text-center rounded-lg py-1.5 font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>

                              <div className="col-span-1">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="-"
                                    value={s.rpe || ''}
                                    onChange={(e) => updateSet(ex.id, s.id, 'rpe', e.target.value)}
                                    className="w-full bg-slate-800/60 text-center rounded-lg py-1.5 text-xs text-amber-300 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400"
                                />
                              </div>

                              <div className="col-span-2 flex justify-end gap-1">
                                <button
                                    onClick={() => toggleSetComplete(ex.id, s.id)}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                                        s.isCompleted
                                            ? 'bg-emerald-500 text-slate-950'
                                            : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                >
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </button>
                                {ex.sets.length > 1 && (
                                    <button
                                        onClick={() => removeSet(ex.id, s.id)}
                                        className="text-slate-600 hover:text-red-400 px-0.5"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                              </div>
                            </div>
                        ))}
                      </div>

                      <button
                          onClick={() => addSet(ex.id)}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded-xl text-sm transition"
                      >
                        + Add Set
                      </button>
                    </div>
                ))}

                <div className="space-y-3 pt-2">
                  <button
                      onClick={() => {
                        setRoutinePickerMode(false);
                        setShowExerciseModal(true);
                      }}
                      className="w-full bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Add Exercise
                  </button>

                  <button
                      onClick={() => {
                        if (confirm('Discard this workout?')) discardWorkout();
                      }}
                      className="w-full bg-red-950/30 hover:bg-red-950/50 text-red-400 font-semibold py-2.5 rounded-xl text-sm transition"
                  >
                    Discard Workout
                  </button>
                </div>
              </div>
          )}
        </main>

        {/* FLOATING REST TIMER BAR */}
        {isActive && restRemainingSec > 0 && (
            <div className="fixed bottom-16 inset-x-4 max-w-2xl mx-auto bg-slate-900 border border-blue-500/50 shadow-2xl rounded-2xl p-3.5 flex items-center justify-between z-30">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
                <div>
                  <p className="text-xs text-slate-400">Rest Timer</p>
                  <p className="font-mono font-bold text-lg text-white">
                    {formatDuration(restRemainingSec)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                    onClick={() => addRestTime(-15)}
                    className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                >
                  -15s
                </button>
                <button
                    onClick={() => addRestTime(15)}
                    className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                >
                  +15s
                </button>
                <button
                    onClick={skipRestTimer}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  Skip <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
        )}

        {/* BOTTOM NAVIGATION BAR */}
        {!isActive && (
            <nav className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-20">
              <div className="max-w-2xl mx-auto grid grid-cols-2 py-2">
                <button
                    onClick={() => setActiveTab('workout')}
                    className={`flex flex-col items-center gap-1 py-1 text-xs font-semibold transition ${
                        activeTab === 'workout' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <Dumbbell className="w-5 h-5" />
                  Workout
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex flex-col items-center gap-1 py-1 text-xs font-semibold transition ${
                        activeTab === 'analytics' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  Analytics & PRs
                </button>
              </div>
            </nav>
        )}

        {/* SUPABASE AUTH / USER ACCOUNT MODAL */}
        {showAuthModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-emerald-400" />
                    Athlete Account
                  </h3>
                  <button
                      onClick={() => setShowAuthModal(false)}
                      className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400">Currently Logged In As</p>
                    <p className="text-sm font-bold text-emerald-400">{userEmail}</p>
                  </div>
                  {userEmail !== 'athlete@hevy-clone.local' && (
                      <button
                          onClick={handleSignOut}
                          className="bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                  )}
                </div>

                <div className="flex gap-2 bg-slate-800 p-1 rounded-xl">
                  <button
                      onClick={() => setAuthMode('login')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                          authMode === 'login' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                  >
                    Sign In
                  </button>
                  <button
                      onClick={() => setAuthMode('signup')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                          authMode === 'signup' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                  >
                    Create Account
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Email Address</label>
                    <input
                        type="email"
                        required
                        placeholder="you@university.edu"
                        value={authInputEmail}
                        onChange={(e) => setAuthInputEmail(e.target.value)}
                        className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {supabase && (
                      <div>
                        <label className="text-xs text-slate-400 font-semibold">Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            placeholder="••••••••"
                            value={authInputPassword}
                            onChange={(e) => setAuthInputPassword(e.target.value)}
                            className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                  )}

                  {authError && <p className="text-xs text-red-400 font-semibold">{authError}</p>}

                  <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                  >
                    {authLoading
                        ? 'Please wait...'
                        : authMode === 'signup'
                            ? 'Create Free Account'
                            : 'Sign In'}
                  </button>
                </form>
              </div>
            </div>
        )}

        {/* BARBELL PLATE CALCULATOR MODAL */}
        {showPlateCalc && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-400" />
                    Barbell Plate Calculator
                  </h3>
                  <button
                      onClick={() => setShowPlateCalc(false)}
                      className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Total Weight (kg)</label>
                    <input
                        type="number"
                        value={plateCalcWeight}
                        onChange={(e) => setPlateCalcWeight(e.target.value)}
                        className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-2.5 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Barbell Weight</label>
                    <select
                        value={barWeight}
                        onChange={(e) => setBarWeight(Number(e.target.value))}
                        className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={20}>20 kg (Olympic)</option>
                      <option value={15}>15 kg (Women&apos;s)</option>
                      <option value={10}>10 kg (EZ Curl)</option>
                    </select>
                  </div>
                </div>

                {/* VISUAL BARBELLSLEEVE */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <p className="text-xs text-slate-400 text-center font-semibold">
                    Load on <span className="text-blue-400 underline">EACH SIDE</span> of the bar:
                  </p>

                  <div className="flex items-center justify-center min-h-[110px] gap-1 py-2">
                    {/* Barbell shaft + collar */}
                    <div className="w-10 h-3 bg-slate-500 rounded-l" />
                    <div className="w-3 h-10 bg-slate-400 rounded-sm" />

                    {platesNeeded.length === 0 ? (
                        <span className="text-xs text-slate-500 pl-3">Just the empty bar!</span>
                    ) : (
                        platesNeeded.map((p, idx) => (
                            <div
                                key={idx}
                                className={`${p.color} px-2 rounded flex items-center justify-center font-bold text-xs shadow-md`}
                            >
                              {p.weight}
                            </div>
                        ))
                    )}
                  </div>

                  {platesNeeded.length > 0 && (
                      <div className="text-center text-xs text-slate-300 font-semibold pt-1 border-t border-slate-800">
                        Per side: {platesNeeded.map((p) => `${p.weight}kg`).join(' + ')}
                      </div>
                  )}
                </div>
              </div>
            </div>
        )}

        {/* ROUTINE BUILDER MODAL */}
        {showRoutineModal && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Create Routine Template</h3>
                  <button
                      onClick={() => setShowRoutineModal(false)}
                      className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <input
                    type="text"
                    placeholder="Routine Name (e.g., Push Day, Upper Body)..."
                    value={draftRoutineName}
                    onChange={(e) => setDraftRoutineName(e.target.value)}
                    className="w-full bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                  {draftRoutineExercises.map((dex, exIdx) => (
                      <div key={dex.id} className="bg-slate-800/60 rounded-xl p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm text-blue-400">{dex.name}</span>
                          <button
                              onClick={() =>
                                  setDraftRoutineExercises((prev) => prev.filter((item) => item.id !== dex.id))
                              }
                              className="text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {dex.sets.map((st, sIdx) => (
                            <div key={sIdx} className="grid grid-cols-7 gap-2 items-center text-xs">
                              <span className="col-span-1 text-slate-400 font-bold">#{sIdx + 1}</span>
                              <input
                                  type="number"
                                  placeholder="Target kg"
                                  value={st.weight}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftRoutineExercises((prev) =>
                                        prev.map((item, i) =>
                                            i === exIdx
                                                ? {
                                                  ...item,
                                                  sets: item.sets.map((s, si) =>
                                                      si === sIdx ? { ...s, weight: val } : s
                                                  ),
                                                }
                                                : item
                                        )
                                    );
                                  }}
                                  className="col-span-3 bg-slate-900 rounded-lg px-2 py-1.5 text-center"
                              />
                              <input
                                  type="number"
                                  placeholder="Target reps"
                                  value={st.reps}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftRoutineExercises((prev) =>
                                        prev.map((item, i) =>
                                            i === exIdx
                                                ? {
                                                  ...item,
                                                  sets: item.sets.map((s, si) =>
                                                      si === sIdx ? { ...s, reps: val } : s
                                                  ),
                                                }
                                                : item
                                        )
                                    );
                                  }}
                                  className="col-span-3 bg-slate-900 rounded-lg px-2 py-1.5 text-center"
                              />
                            </div>
                        ))}
                        <button
                            onClick={() =>
                                setDraftRoutineExercises((prev) =>
                                    prev.map((item, i) =>
                                        i === exIdx
                                            ? { ...item, sets: [...item.sets, { weight: '', reps: '10' }] }
                                            : item
                                    )
                                )
                            }
                            className="w-full bg-slate-800 hover:bg-slate-700 text-xs py-1.5 rounded-lg text-slate-300 font-semibold"
                        >
                          + Add Target Set
                        </button>
                      </div>
                  ))}

                  <button
                      onClick={() => {
                        setRoutinePickerMode(true);
                        setShowExerciseModal(true);
                      }}
                      className="w-full border border-dashed border-slate-700 hover:border-blue-500 text-slate-300 py-2.5 rounded-xl text-sm font-semibold"
                  >
                    + Add Exercise to Routine
                  </button>
                </div>

                <button
                    onClick={handleSaveRoutine}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm"
                >
                  Save Routine
                </button>
              </div>
            </div>
        )}

        {/* EXERCISE PICKER MODAL */}
        {showExerciseModal && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-4 space-y-4 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Select Exercise ({filteredExercises.length})</h3>
                  <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCreateExerciseModal(true)}
                        className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    >
                      + Create Custom
                    </button>
                    <button
                        onClick={() => setShowExerciseModal(false)}
                        className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <input
                    type="text"
                    placeholder="Search 50+ exercises or muscles (e.g. Squat, Back, Cable)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                  {filteredExercises.map((ex) => (
                      <button
                          key={ex.id}
                          onClick={() => {
                            if (routinePickerMode) {
                              setDraftRoutineExercises((prev) => [
                                ...prev,
                                {
                                  id: crypto.randomUUID(),
                                  exerciseId: ex.id,
                                  name: ex.name,
                                  sets: [
                                    { weight: '', reps: '10' },
                                    { weight: '', reps: '10' },
                                    { weight: '', reps: '10' },
                                  ],
                                },
                              ]);
                              setShowExerciseModal(false);
                              setSearchQuery('');
                            } else {
                              handleSelectExerciseForWorkout(ex);
                            }
                          }}
                          className="w-full text-left bg-slate-800/60 hover:bg-slate-800 p-3 rounded-xl flex items-center justify-between transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-white">{ex.name}</p>
                            {ex.isCustom && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                          Custom
                        </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {ex.primaryMuscle} • {ex.equipment}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-blue-400" />
                      </button>
                  ))}
                </div>
              </div>
            </div>
        )}

        {/* CREATE CUSTOM EXERCISE MODAL */}
        {showCreateExerciseModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Create Custom Exercise</h3>
                  <button
                      onClick={() => setShowCreateExerciseModal(false)}
                      className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Exercise Name</label>
                    <input
                        type="text"
                        placeholder="e.g., Pendulum Squat"
                        value={customExName}
                        onChange={(e) => setCustomExName(e.target.value)}
                        className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Primary Muscle Group</label>
                    <select
                        value={customExMuscle}
                        onChange={(e) => setCustomExMuscle(e.target.value)}
                        className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {MUSCLE_GROUPS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Equipment</label>
                    <select
                        value={customExEquipment}
                        onChange={(e) => setCustomExEquipment(e.target.value)}
                        className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {EQUIPMENT_TYPES.map((eq) => (
                          <option key={eq} value={eq}>
                            {eq}
                          </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                    onClick={handleCreateCustomExercise}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm"
                >
                  Save Exercise
                </button>
              </div>
            </div>
        )}
      </div>
  );
}