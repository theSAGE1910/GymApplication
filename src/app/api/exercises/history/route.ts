import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_USER_EMAIL = 'athlete@hevy-clone.local';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const exerciseId = searchParams.get('exerciseId');

        if (!exerciseId) {
            return NextResponse.json({ error: 'Missing exerciseId' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: DEFAULT_USER_EMAIL } });
        if (!user) return NextResponse.json([]);

        // Find the most recent completed WorkoutExercise for this user + exerciseId
        const lastWorkoutExercise = await prisma.workoutExercise.findFirst({
            where: {
                exerciseId,
                workout: {
                    userId: user.id,
                    endTime: { not: null },
                },
            },
            orderBy: {
                workout: { startTime: 'desc' },
            },
            include: {
                sets: {
                    where: { isCompleted: true },
                    orderBy: { setNumber: 'asc' },
                },
            },
        });

        return NextResponse.json(lastWorkoutExercise?.sets || []);
    } catch (error) {
        console.error('Error fetching exercise history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}