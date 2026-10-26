import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SetType = 'WARMUP' | 'NORMAL' | 'DROPSET' | 'FAILURE';

export interface ActiveSet {
    id: string;
    setNumber: number;
    setType: SetType;
    weight: string; // Stored as string during input so typing decimals like "22.5" is smooth
    reps: string;
    rpe: string;
    isCompleted: boolean;
}

export interface ActiveWorkoutExercise {
    id: string; // Unique ID for this entry in the active workout
    exerciseId: string;
    name: string;
    primaryMuscle: string;
    equipment: string;
    notes: string;
    restTimerSeconds: number;
    sets: ActiveSet[];
}

interface WorkoutState {
    isActive: boolean;
    workoutName: string;
    startTime: number | null; // Unix timestamp (ms)
    restEndTime: number | null; // Unix timestamp (ms) for accurate background countdown
    exercises: ActiveWorkoutExercise[];

    // Actions
    startEmptyWorkout: (name?: string) => void;
    updateWorkoutName: (name: string) => void;
    addExercise: (exercise: { id: string; name: string; primaryMuscle: string; equipment: string }) => void;
    removeExercise: (workoutExerciseId: string) => void;
    addSet: (workoutExerciseId: string) => void;
    removeSet: (workoutExerciseId: string, setId: string) => void;
    updateSet: (workoutExerciseId: string, setId: string, field: 'weight' | 'reps' | 'rpe' | 'setType', value: string) => void;
    toggleSetComplete: (workoutExerciseId: string, setId: string) => void;
    skipRestTimer: () => void;
    addRestTime: (seconds: number) => void;
    discardWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
    persist(
        (set, get) => ({
            isActive: false,
            workoutName: 'Evening Workout',
            startTime: null,
            restEndTime: null,
            exercises: [],

            startEmptyWorkout: (name = 'Workout Session') =>
                set({
                    isActive: true,
                    workoutName: name,
                    startTime: Date.now(),
                    restEndTime: null,
                    exercises: [],
                }),

            updateWorkoutName: (name) => set({ workoutName: name }),

            addExercise: (exercise) =>
                set((state) => ({
                    exercises: [
                        ...state.exercises,
                        {
                            id: crypto.randomUUID(),
                            exerciseId: exercise.id,
                            name: exercise.name,
                            primaryMuscle: exercise.primaryMuscle,
                            equipment: exercise.equipment,
                            notes: '',
                            restTimerSeconds: 90,
                            sets: [
                                {
                                    id: crypto.randomUUID(),
                                    setNumber: 1,
                                    setType: 'NORMAL',
                                    weight: '',
                                    reps: '',
                                    rpe: '',
                                    isCompleted: false,
                                },
                            ],
                        },
                    ],
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
                                    // Auto-fill weight & reps from the previous set just like Hevy!
                                    weight: prevSet ? prevSet.weight : '',
                                    reps: prevSet ? prevSet.reps : '',
                                    rpe: '',
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
                    restEndTime: state.restEndTime ? state.restEndTime + seconds * 1000 : Date.now() + seconds * 1000,
                })),

            discardWorkout: () =>
                set({
                    isActive: false,
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