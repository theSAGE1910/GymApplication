import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/supabase';

export async function GET(req: Request) {
    try {
        const user = await getAuthenticatedUser(req);
        const routines = await prisma.routine.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                exercises: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        exercise: true,
                        sets: { orderBy: { setNumber: 'asc' } },
                    },
                },
            },
        });
        return NextResponse.json(routines);
    } catch (error) {
        console.error('Error fetching routines:', error);
        return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 });
    }
}

// POST: Create a new Routine template
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, notes, exercises } = body;
        const user = await getAuthenticatedUser(req);

        if (!name || !exercises || exercises.length === 0) {
            return NextResponse.json(
                { error: 'Please provide a routine name and at least one exercise.' },
                { status: 400 }
            );
        }

        const routine = await prisma.routine.create({
            data: {
                userId: user.id,
                name,
                notes: notes || null,
                exercises: {
                    create: exercises.map((ex: any, idx: number) => ({
                        exerciseId: ex.exerciseId,
                        orderIndex: idx,
                        restTimerSeconds: ex.restTimerSeconds || 90,
                        sets: {
                            create: ex.sets.map((s: any, setIdx: number) => ({
                                setNumber: setIdx + 1,
                                setType: s.setType || 'NORMAL',
                                targetWeight: s.weight ? parseFloat(s.weight) : null,
                                targetReps: s.reps ? parseInt(s.reps, 10) : null,
                            })),
                        },
                    })),
                },
            },
        });

        return NextResponse.json(routine);
    } catch (error) {
        console.error('Error creating routine:', error);
        return NextResponse.json({ error: 'Failed to create routine' }, { status: 500 });
    }
}

// DELETE: Remove a routine by ?id=...
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing routine id' }, { status: 400 });

        await prisma.routine.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting routine:', error);
        return NextResponse.json({ error: 'Failed to delete routine' }, { status: 500 });
    }
}