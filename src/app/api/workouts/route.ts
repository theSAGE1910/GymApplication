import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_USER_EMAIL = 'athlete@hevy-clone.local';

async function getOrCreateDefaultUser() {
    let user = await prisma.user.findUnique({ where: { email: DEFAULT_USER_EMAIL } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: DEFAULT_USER_EMAIL,
                name: 'Student Athlete',
            },
        });
    }
    return user;
}

// GET: Fetch past completed workouts
export async function GET() {
    try {
        const user = await getOrCreateDefaultUser();
        const workouts = await prisma.workout.findMany({
            where: { userId: user.id },
            orderBy: { startTime: 'desc' },
            include: {
                exercises: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        exercise: true,
                        sets: { orderBy: { setNumber: 'asc' } },
                    },
                },
            },
            take: 20,
        });
        return NextResponse.json(workouts);
    } catch (error) {
        console.error('Error fetching workouts:', error);
        return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
    }
}

// POST: Save a finished workout to Supabase
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { workoutName, startTime, exercises } = body;
        const user = await getOrCreateDefaultUser();

        let totalVolume = 0;
        let totalSets = 0;

        const formattedExercises = exercises
            .map((ex: any, index: number) => {
                const completedSets = ex.sets.filter((s: any) => s.isCompleted);

                const setsData = completedSets.map((s: any, setIdx: number) => {
                    const weight = parseFloat(s.weight) || 0;
                    const reps = parseInt(s.reps, 10) || 0;
                    const rpe = s.rpe ? parseFloat(s.rpe) : null;

                    totalVolume += weight * reps;
                    totalSets += 1;

                    // Epley 1RM Formula: Weight * (1 + Reps / 30)
                    const estimated1Rm =
                        weight > 0 && reps > 0 ? Number((weight * (1 + reps / 30)).toFixed(2)) : null;

                    return {
                        setNumber: setIdx + 1,
                        setType: s.setType,
                        weight,
                        reps,
                        rpe,
                        isCompleted: true,
                        estimated1Rm,
                    };
                });

                return {
                    exerciseId: ex.exerciseId,
                    orderIndex: index,
                    notes: ex.notes || null,
                    restTimerSeconds: ex.restTimerSeconds || 90,
                    sets: { create: setsData },
                };
            })
            .filter((ex: any) => ex.sets.create.length > 0);

        if (formattedExercises.length === 0) {
            return NextResponse.json(
                { error: 'Complete at least one set before finishing the workout.' },
                { status: 400 }
            );
        }

        const savedWorkout = await prisma.workout.create({
            data: {
                userId: user.id,
                name: workoutName || 'Workout Session',
                startTime: new Date(startTime || Date.now()),
                endTime: new Date(),
                totalVolume,
                totalSets,
                exercises: {
                    create: formattedExercises,
                },
            },
        });

        return NextResponse.json(savedWorkout);
    } catch (error) {
        console.error('Error saving workout:', error);
        return NextResponse.json({ error: 'Failed to save workout' }, { status: 500 });
    }
}