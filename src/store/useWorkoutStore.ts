import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SetType = 'WARMUP' | 'NORMAL' | 'DROPSET' | 'FAILURE';

export interface ActiveSet {
    id: string;
    setNumber: number;
    setType: SetType;
    weight: string;
    reps: string;
    rpe: string;
    previousText?: string;
    isCompleted: boolean;
}

export interface ActiveWorkoutExercise {
    id: string;
    exerciseId: string;
    name: string;
    primaryMuscle: string;
    equipment: string;
    notes: string;
    supersetGroupId: number | null;
    restTimerSeconds: number;
    sets: ActiveSet[];
}

// Helper to round weights to the nearest loadable 2.5kg increment
const roundToNearest2Point5 = (weight: number) => Math.max(20, Math.round(weight / 2.5) * 2.5);

interface WorkoutState {
    isActive: boolean;
    routineId: string | null;
    workoutName: string;
    startTime: number | null;
    restEndTime: number | null;
    exercises: ActiveWorkoutExercise[];

    // Actions
    startEmptyWorkout: (name?: string) => void;
    startWorkoutFromRoutine: (routine: any) => void;
    updateWorkoutName: (name: string) => void;
    addExercise: (
        exercise: { id: string; name: string; primaryMuscle: string; equipment: string },
        previousSets?: { weight: number | null; reps: number | null }[]
    ) => void;
    setExercisePreviousSets: (
        workoutExerciseId: string,
        previousSets: { weight: number | null; reps: number | null }[]
    ) => void;
    updateExerciseNotes: (workoutExerciseId: string, notes: string) => void;
    toggleSuperset: (workoutExerciseId: string) => void;
    generateWarmupSets: (workoutExerciseId: string, workingWeight: number) => void;
    removeExercise: (workoutExerciseId: string) => void;
    addSet: (workoutExerciseId: string) => void;
    removeSet: (workoutExerciseId: string, setId: string) => void;
    updateSet: (
        workoutExerciseId: string,
        setId: string,
        field: 'weight' | 'reps' | 'rpe' | 'setType',
        value: string
    ) => void;
    toggleSetComplete: (workoutExerciseId: string, setId: string) => void;
    skipRestTimer: () => void;
    addRestTime: (seconds: number) => void;
    discardWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
    persist(
        (set, get) => ({
            isActive: false,
            routineId: null,
            workoutName: 'Workout Session',
            startTime: null,
            restEndTime: null,
            exercises: [],

            startEmptyWorkout: (name = 'Workout Session') =>
                set({
                    isActive: true,
                    routineId: null,
                    workoutName: name,
                    startTime: Date.now(),
                    restEndTime: null,
                    exercises: [],
                }),

            startWorkoutFromRoutine: (routine) =>
                set({
                    isActive: true,
                    routineId: routine.id,
                    workoutName: routine.name,
                    startTime: Date.now(),
                    restEndTime: null,
                    exercises: routine.exercises.map((re: any) => ({
                        id: crypto.randomUUID(),
                        exerciseId: re.exercise.id,
                        name: re.exercise.name,
                        primaryMuscle: re.exercise.primaryMuscle,
                        equipment: re.exercise.equipment,
                        notes: re.notes || '',
                        supersetGroupId: re.supersetGroupId || null,
                        restTimerSeconds: re.restTimerSeconds || 90,
                        sets: re.sets.map((s: any, idx: number) => ({
                            id: crypto.randomUUID(),
                            setNumber: idx + 1,
                            setType: s.setType || 'NORMAL',
                            weight: s.targetWeight != null ? String(s.targetWeight) : '',
                            reps: s.targetReps != null ? String(s.targetReps) : '',
                            rpe: '',
                            previousText: undefined,
                            isCompleted: false,
                        })),
                    })),
                }),

            updateWorkoutName: (name) => set({ workoutName: name }),

            addExercise: (exercise, previousSets = []) =>
                set((state) => {
                    const initialSets: ActiveSet[] =
                        previousSets.length > 0
                            ? previousSets.map((prev, idx) => ({
                                id: crypto.randomUUID(),
                                setNumber: idx + 1,
                                setType: 'NORMAL',
                                weight: prev.weight != null ? String(prev.weight) : '',
                                reps: prev.reps != null ? String(prev.reps) : '',
                                rpe: '',
                                previousText:
                                    prev.weight != null && prev.reps != null
                                        ? `${prev.weight}kg × ${prev.reps}`
                                        : '—',
                                isCompleted: false,
                            }))
                            : [
                                {
                                    id: crypto.randomUUID(),
                                    setNumber: 1,
                                    setType: 'NORMAL',
                                    weight: '',
                                    reps: '',
                                    rpe: '',
                                    previousText: '—',
                                    isCompleted: false,
                                },
                            ];

                    return {
                        exercises: [
                            ...state.exercises,
                            {
                                id: crypto.randomUUID(),
                                exerciseId: exercise.id,
                                name: exercise.name,
                                primaryMuscle: exercise.primaryMuscle,
                                equipment: exercise.equipment,
                                notes: '',
                                supersetGroupId: null,
                                restTimerSeconds: 90,
                                sets: initialSets,
                            },
                        ],
                    };
                }),

            setExercisePreviousSets: (workoutExerciseId, previousSets) =>
                set((state) => ({
                    exercises: state.exercises.map((ex) => {
                        if (ex.id !== workoutExerciseId) return ex;
                        return {
                            ...ex,
                            sets: ex.sets.map((s, idx) => {
                                const prev = previousSets[idx];
                                return {
                                    ...s,
                                    previousText:
                                        prev && prev.weight != null && prev.reps != null
                                            ? `${prev.weight}kg × ${prev.reps}`
                                            : '—',
                                    weight: s.weight === '' && prev?.weight != null ? String(prev.weight) : s.weight,
                                    reps: s.reps === '' && prev?.reps != null ? String(prev.reps) : s.reps,
                                };
                            }),
                        };
                    }),
                })),

            updateExerciseNotes: (workoutExerciseId, notes) =>
                set((state) => ({
                    exercises: state.exercises.map((ex) =>
                        ex.id === workoutExerciseId ? { ...ex, notes } : ex
                    ),
                })),

            toggleSuperset: (workoutExerciseId) =>
                set((state) => ({
                    exercises: state.exercises.map((ex) => {
                        if (ex.id !== workoutExerciseId) return ex;
                        const nextGroup =
                            ex.supersetGroupId === null ? 1 : ex.supersetGroupId === 1 ? 2 : null;
                        return { ...ex, supersetGroupId: nextGroup };
                    }),
                })),

            generateWarmupSets: (workoutExerciseId, workingWeight) =>
                set((state) => ({
                    exercises: state.exercises.map((ex) => {
                        if (ex.id !== workoutExerciseId) return ex;

                        // Remove existing uncompleted warmup sets before inserting fresh ones
                        const nonWarmupSets = ex.sets.filter((s) => s.setType !== 'WARMUP' || s.isCompleted);

                        const warmupStages: { weight: number; reps: number }[] = [];
                        if (workingWeight > 25) {
                            warmupStages.push({ weight: 20, reps: 10 }); // Empty bar
                        }
                        if (workingWeight >= 40) {
                            warmupStages.push({ weight: roundToNearest2Point5(workingWeight * 0.5), reps: 8 });
                            warmupStages.push({ weight: roundToNearest2Point5(workingWeight * 0.7), reps: 5 });
                            warmupStages.push({ weight: roundToNearest2Point5(workingWeight * 0.85), reps: 2 });
                        } else {
                            warmupStages.push({
                                weight: Math.max(5, Math.round((workingWeight * 0.6) / 2.5) * 2.5),
                                reps: 8,
                            });
                        }

                        const newWarmupSets: ActiveSet[] = warmupStages.map((stage, idx) => ({
                            id: crypto.randomUUID(),
                            setNumber: idx + 1,
                            setType: 'WARMUP',
                            weight: String(stage.weight),
                            reps: String(stage.reps),
                            rpe: '',
                            previousText: 'Warm-up',
                            isCompleted: false,
                        }));

                        const combined = [...newWarmupSets, ...nonWarmupSets].map((s, idx) => ({
                            ...s,
                            setNumber: idx + 1,
                        }));

                        return {
                            ...ex,
                            sets: combined,
                        };
                    }),
                })),

            removeExercise: (workoutExerciseId) =>
                set((state) => ({
                    exercises: state.exercises.filter((ex) => ex.id !== workoutExerciseId),
                })),

            addSet: (workoutExerciseId) =>
                set((state) => ({
                    exercises: state.exercises.map((ex) => {
                        if (ex.id !== workoutExerciseId) return ex;
                        const prevSet = ex.sets[ex.sets.length - 1];
                        return {
                            ...ex,
                            sets: [
                                ...ex.sets,
                                {
                                    id: crypto.randomUUID(),
                                    setNumber: ex.sets.length + 1,
                                    setType: 'NORMAL',
                                    // Autofill weight & reps from the previous set just like Hevy!
                                    weight: prevSet ? prevSet.weight : '',
                                    reps: prevSet ? prevSet.reps : '',
                                    rpe: '',
                                    previousText: '—',
                                    isCompleted: false,
                                },
                            ],
                        };
                    }),
                })),

            removeSet: (workoutExerciseId, setId) =>
                set((state) => ({
                    exercises: state.exercises.map((ex) => {
                        if (ex.id !== workoutExerciseId) return ex;
                        const filtered = ex.sets.filter((s) => s.id !== setId);
                        return {
                            ...ex,
                            sets: filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 })),
                        };
                    }),
                })),

            updateSet: (workoutExerciseId, setId, field, value) =>
                set((state) => ({
                    exercises: state.exercises.map((ex) => {
                        if (ex.id !== workoutExerciseId) return ex;
                        return {
                            ...ex,
                            sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
                        };
                    }),
                })),

            toggleSetComplete: (workoutExerciseId, setId) => {
                const state = get();
                let shouldStartTimer = false;
                let timerSeconds = 90;

                const updatedExercises = state.exercises.map((ex) => {
                    if (ex.id !== workoutExerciseId) return ex;
                    timerSeconds = ex.restTimerSeconds;
                    return {
                        ...ex,
                        sets: ex.sets.map((s) => {
                            if (s.id !== setId) return s;
                            const nextComplete = !s.isCompleted;
                            if (nextComplete) shouldStartTimer = true;
                            return { ...s, isCompleted: nextComplete };
                        }),
                    };
                });

                set({
                    exercises: updatedExercises,
                    restEndTime: shouldStartTimer ? Date.now() + timerSeconds * 1000 : state.restEndTime,
                });
            },

            skipRestTimer: () => set({ restEndTime: null }),

            addRestTime: (seconds) =>
                set((state) => ({
                    restEndTime: state.restEndTime
                        ? state.restEndTime + seconds * 1000
                        : Date.now() + seconds * 1000,
                })),

            discardWorkout: () =>
                set({
                    isActive: false,
                    routineId: null,
                    startTime: null,
                    restEndTime: null,
                    exercises: [],
                }),
        }),
        {
            name: 'hevy-active-workout-storage',
        }
    )
);