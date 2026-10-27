import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase =
    supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const DEFAULT_USER_EMAIL = 'athlete@hevy-clone.local';

// Helper used by all API routes to get the currently logged-in user's Prisma record
export async function getAuthenticatedUser(req?: Request) {
    let email = DEFAULT_USER_EMAIL;
    let name = 'Student Athlete';

    if (req) {
        const headerEmail = req.headers.get('x-user-email');
        if (headerEmail && headerEmail.includes('@')) {
            email = headerEmail.toLowerCase().trim();
            name = email.split('@')[0];
        }
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({
            data: { email, name },
        });
    }
    return user;
}