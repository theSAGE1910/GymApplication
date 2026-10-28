import { prisma } from '@/lib/prisma';
import { DEFAULT_USER_EMAIL } from '@/lib/supabase';

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