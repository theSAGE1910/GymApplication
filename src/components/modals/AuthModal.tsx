'use client';

import React, { useState } from 'react';
import { User as UserIcon, LogOut, X } from 'lucide-react';
import { supabase, DEFAULT_USER_EMAIL } from '@/lib/supabase';

interface AuthModalProps {
    isOpen: boolean;
    userEmail: string;
    onUserEmailChange: (email: string) => void;
    onClose: () => void;
}

export default function AuthModal({
                                      isOpen,
                                      userEmail,
                                      onUserEmailChange,
                                      onClose,
                                  }: AuthModalProps) {
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [inputEmail, setInputEmail] = useState('');
    const [inputPassword, setInputPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!supabase) {
            if (inputEmail.includes('@')) {
                onUserEmailChange(inputEmail.toLowerCase().trim());
                onClose();
            } else {
                setError('Please enter a valid email address.');
            }
            return;
        }

        setLoading(true);
        try {
            if (authMode === 'signup') {
                const { error: signUpErr } = await supabase.auth.signUp({
                    email: inputEmail,
                    password: inputPassword,
                });
                if (signUpErr) throw signUpErr;
            } else {
                const { error: signInErr } = await supabase.auth.signInWithPassword({
                    email: inputEmail,
                    password: inputPassword,
                });
                if (signInErr) throw signInErr;
            }
            onClose();
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        onUserEmailChange(DEFAULT_USER_EMAIL);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-emerald-400" />
                        Athlete Account
                    </h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-slate-400">Currently Logged In As</p>
                        <p className="text-sm font-bold text-emerald-400">{userEmail}</p>
                    </div>
                    {userEmail !== DEFAULT_USER_EMAIL && (
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

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-xs text-slate-400 font-semibold">Email Address</label>
                        <input
                            type="email"
                            required
                            placeholder="you@university.edu"
                            value={inputEmail}
                            onChange={(e) => setInputEmail(e.target.value)}
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
                                value={inputPassword}
                                onChange={(e) => setInputPassword(e.target.value)}
                                className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                    >
                        {loading
                            ? 'Please wait...'
                            : authMode === 'signup'
                                ? 'Create Free Account'
                                : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}