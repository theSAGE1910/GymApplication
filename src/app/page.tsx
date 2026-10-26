'use client';

import React, { useEffect, useState } from 'react';
import { useWorkoutStore, SetType } from '@/store/useWorkoutStore';
import {
  Dumbbell,
  Plus,
  Check,
  Trash2,
  Clock,
  X,
  Play,
  SkipForward,
  Calendar,
  FolderPlus,
  ClipboardList,
} from 'lucide-react';

interface DbExercise {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
}

const SET_TYPE_Order: SetType[] = ['NORMAL', 'WARMUP', 'DROPSET', 'FAILURE'];

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
  const [dbExercises, setDbExercises] = useState<DbExercise[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [pastWorkouts, setPastWorkouts] = useState<any[]>([]);

  // Modals
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [routinePickerMode, setRoutinePickerMode] = useState(false);

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

  useEffect(() => {
    setMounted(true);
    fetch('/api/exercises')
        .then((res) => res.json())
        .then((data) => Array.isArray(data) && setDbExercises(data));

    fetchRoutines();
    fetchWorkouts();
  }, []);

  const fetchRoutines = () => {
    fetch('/api/routines')
        .then((res) => res.json())
        .then((data) => Array.isArray(data) && setRoutines(data));
  };

  const fetchWorkouts = () => {
    fetch('/api/workouts')
        .then((res) => res.json())
        .then((data) => Array.isArray(data) && setPastWorkouts(data));
  };

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

  // Add exercise to active workout AND fetch its previous history from Supabase
  const handleSelectExerciseForWorkout = async (ex: DbExercise) => {
    setShowExerciseModal(false);
    setSearchQuery('');
    try {
      const res = await fetch(`/api/exercises/history?exerciseId=${ex.id}`);
      const prevSets = res.ok ? await res.json() : [];
      addExercise(ex, Array.isArray(prevSets) ? prevSets : []);
    } catch {
      addExercise(ex, []);
    }
  };

  // Start routine and load "Previous" history for each exercise in the routine
  const handleStartRoutine = async (routine: any) => {
    startWorkoutFromRoutine(routine);
    setTimeout(async () => {
      const currentExercises = useWorkoutStore.getState().exercises;
      for (const we of currentExercises) {
        try {
          const res = await fetch(`/api/exercises/history?exerciseId=${we.exerciseId}`);
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

  // Save a new Routine Template
  const handleSaveRoutine = async () => {
    if (!draftRoutineName.trim() || draftRoutineExercises.length === 0) {
      alert('Give your routine a name and add at least one exercise.');
      return;
    }
    const res = await fetch('/api/routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    await fetch(`/api/routines?id=${id}`, { method: 'DELETE' });
    fetchRoutines();
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
        headers: { 'Content-Type': 'application/json' },
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

  return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-32">
        {/* TOP BAR */}
        <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">HEVY CLONE</span>
          </div>

          {isActive && (
              <button
                  onClick={handleFinishWorkout}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-4 py-1.5 rounded-lg text-sm transition"
              >
                {isSaving ? 'Saving...' : 'Finish'}
              </button>
          )}
        </header>

        <main className="max-w-2xl mx-auto p-4 space-y-6">
          {!isActive ? (
              /* ================= HOME / DASHBOARD VIEW ================= */
              <div className="space-y-8">
                {/* QUICK START */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h2 className="text-lg font-bold">Quick Start</h2>
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

                {/* WORKOUT HISTORY FEED */}
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
                      pastWorkouts.map((w) => (
                          <div
                              key={w.id}
                              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-base text-white">{w.name}</h3>
                                <p className="text-xs text-slate-400">
                                  {new Date(w.startTime).toLocaleDateString(undefined, {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                              <div className="flex gap-4 text-right">
                                <div>
                                  <p className="text-xs text-slate-400">Volume</p>
                                  <p className="font-semibold text-sm">{w.totalVolume} kg</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-400">Sets</p>
                                  <p className="font-semibold text-sm">{w.totalSets}</p>
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-slate-800 pt-3 space-y-1.5">
                              {w.exercises?.map((we: any) => (
                                  <div key={we.id} className="text-sm text-slate-300 flex justify-between">
                          <span>
                            <span className="font-semibold text-blue-400">
                              {we.sets?.length} sets
                            </span>{' '}
                            × {we.exercise?.name}
                          </span>
                                    {we.sets?.[0] && (
                                        <span className="text-slate-400 text-xs">
                              Best: {we.sets[0].weight}kg × {we.sets[0].reps}
                            </span>
                                    )}
                                  </div>
                              ))}
                            </div>
                          </div>
                      ))
                  )}
                </div>
              </div>
          ) : (
              /* ================= ACTIVE WORKOUT LOGGER VIEW ================= */
              <div className="space-y-6">
                {/* LIVE STATS BAR */}
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

                {/* EXERCISE CARDS */}
                {exercises.map((ex) => (
                    <div
                        key={ex.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-blue-400 text-base">{ex.name}</h3>
                          <span className="text-xs text-slate-400 uppercase tracking-wider">
                      {ex.primaryMuscle} • {ex.equipment}
                    </span>
                        </div>
                        <button
                            onClick={() => removeExercise(ex.id)}
                            className="text-slate-500 hover:text-red-400 p-1.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* SETS TABLE WITH "PREVIOUS" COLUMN */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-1.5 text-[11px] font-semibold text-slate-400 px-1">
                          <div className="col-span-2">SET</div>
                          <div className="col-span-3 text-center">PREVIOUS</div>
                          <div className="col-span-3 text-center">KG</div>
                          <div className="col-span-2 text-center">REPS</div>
                          <div className="col-span-2 text-right">✓</div>
                        </div>

                        {ex.sets.map((s) => (
                            <div
                                key={s.id}
                                className={`grid grid-cols-12 gap-1.5 items-center p-1.5 rounded-xl transition ${
                                    s.isCompleted ? 'bg-emerald-950/40 border border-emerald-800/40' : ''
                                }`}
                            >
                              {/* Set Number / Type Badge */}
                              <div className="col-span-2 flex items-center">
                                <button
                                    onClick={() => cycleSetType(ex.id, s.id, s.setType)}
                                    className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${
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

                              {/* Previous Performance */}
                              <div className="col-span-3 text-center text-xs text-slate-400 font-medium truncate">
                                {s.previousText || '—'}
                              </div>

                              {/* Weight Input */}
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

                              {/* Reps Input */}
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

                              {/* Complete Checkmark & Delete */}
                              <div className="col-span-2 flex justify-end gap-1">
                                <button
                                    onClick={() => toggleSetComplete(ex.id, s.id)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
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

                {/* ADD EXERCISE & DISCARD BUTTONS */}
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
            <div className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto bg-slate-900 border border-blue-500/50 shadow-2xl rounded-2xl p-3.5 flex items-center justify-between z-30">
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
                  <h3 className="font-bold text-lg">Select Exercise</h3>
                  <button
                      onClick={() => setShowExerciseModal(false)}
                      className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <input
                    type="text"
                    placeholder="Search exercise or muscle (e.g. Bench, Chest)..."
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
                          <p className="font-semibold text-sm text-white">{ex.name}</p>
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
      </div>
  );
}