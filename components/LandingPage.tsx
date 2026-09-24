import React, { useState } from 'react';
import { Sparkles, ArrowRight, User as UserIcon, Lock, GitGraph, Zap, MessageSquare, Monitor, Loader, LogOut, BadgeCheck } from 'lucide-react';
import { User, login, register } from '../services/apiClient';

interface LandingPageProps {
  user: User | null;
  onAuthenticated: (user: User) => void;
  onStart: () => void;
  onLogout: () => void;
  onError: (message: string) => void;
}

type AuthMode = 'login' | 'register';

export const LandingPage: React.FC<LandingPageProps> = ({ user, onAuthenticated, onStart, onLogout, onError }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username.trim() || !password) {
        const msg = "Please enter your username and password.";
        setLocalError(msg);
        onError(msg);
        return;
    }

    setIsSubmitting(true);
    try {
        const authed = mode === 'login'
            ? await login(username.trim(), password)
            : await register(username.trim(), password, displayName.trim());
        setPassword('');
        onAuthenticated(authed);
    } catch (err: any) {
        const msg = err?.message || "Something went wrong. Please try again.";
        setLocalError(msg);
        onError(msg);
    } finally {
        setIsSubmitting(false);
    }
  };

  const inputClass = `w-full bg-space-950 border rounded-xl py-3 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 transition-all ${
      localError
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
          : 'border-space-700 focus:border-nebula-500 focus:ring-nebula-500'
  }`;

  const submitButtonClass = "w-full group relative overflow-hidden bg-gradient-to-r from-space-800 to-space-900 hover:from-nebula-900/50 hover:to-cyan-900/50 border border-space-700 hover:border-nebula-500/50 text-white h-12 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-nebula-500/10 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="h-[100dvh] w-full bg-space-950 text-gray-200 font-sans selection:bg-nebula-500/30 overflow-y-auto overflow-x-hidden relative flex flex-col">
       
       {/* --- Ambient Background --- */}
       <div className="fixed inset-0 pointer-events-none">
           <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-nebula-600/10 rounded-full blur-[120px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[100px]"></div>
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"></div>
       </div>

       {/* --- Content Container --- */}
       <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full min-h-[800px]">
          
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              
              {/* Left Column: Hero & Auth */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
                  
                  <div className="relative inline-block">
                      <div className="absolute inset-0 bg-nebula-500 blur-2xl opacity-20 rounded-full animate-pulse-slow"></div>
                      <div className="relative bg-space-900/80 border border-space-700 p-4 rounded-2xl shadow-2xl inline-flex items-center justify-center mb-2">
                          <Sparkles size={40} className="text-nebula-400" />
                      </div>
                  </div>

                  <div className="space-y-4 max-w-2xl">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight">
                        <span className="text-white">Conversation</span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-nebula-400 to-cyan-400">Tree</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                        Let your conversations grow outward like the branches of a tree. Engage with AI instances that carry separated memories within a single session, and unlock deeper learning and a wealth of new ideas.
                    </p>
                  </div>

                  {/* Auth Card */}
                  <div className="w-full max-w-md bg-space-900/50 backdrop-blur-xl border border-space-800 rounded-2xl p-6 shadow-2xl mt-4 space-y-6">
                    {user ? (
                      <>
                        <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 rounded-full bg-nebula-600/30 border border-nebula-500/40 flex items-center justify-center font-bold text-nebula-400">
                                {user.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-xs font-mono uppercase text-gray-500 flex items-center gap-1"><BadgeCheck size={12}/> Signed in</div>
                                <div className="text-gray-100 font-medium">{user.displayName} <span className="text-gray-500 text-sm">@{user.username}</span></div>
                            </div>
                        </div>
                        <button onClick={onStart} className={submitButtonClass}>
                            <span className="font-semibold text-sm">Continue</span>
                            <ArrowRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all"/>
                        </button>
                        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-red-300">
                            <LogOut size={12}/> Log out
                        </button>
                      </>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Mode Tabs */}
                        <div className="grid grid-cols-2 gap-1 p-1 bg-space-950 border border-space-800 rounded-xl">
                            {(['login', 'register'] as AuthMode[]).map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => { setMode(m); setLocalError(null); }}
                                    className={`py-2 rounded-lg text-sm transition-colors ${mode === m ? 'bg-space-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    {m === 'login' ? 'Sign in' : 'Create account'}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3 text-left">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon size={16} className="text-gray-500 group-focus-within:text-nebula-400 transition-colors"/>
                                </div>
                                <input
                                    type="text"
                                    name="username"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); setLocalError(null); }}
                                    placeholder="Username"
                                    className={inputClass}
                                />
                            </div>
                            {mode === 'register' && (
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Sparkles size={16} className="text-gray-500 group-focus-within:text-nebula-400 transition-colors"/>
                                    </div>
                                    <input
                                        type="text"
                                        name="displayName"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Display name (optional)"
                                        className={inputClass}
                                    />
                                </div>
                            )}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={16} className="text-gray-500 group-focus-within:text-nebula-400 transition-colors"/>
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
                                    placeholder={mode === 'login' ? 'Password' : 'Password (min. 8 characters)'}
                                    className={inputClass}
                                />
                            </div>
                            {localError && (
                                <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-700/50 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
                                    <span className="text-xs text-red-300 font-medium">{localError}</span>
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={isSubmitting} className={submitButtonClass}>
                            {isSubmitting ? (
                                <>
                                    <Loader size={16} className="animate-spin" />
                                    <span className="font-semibold text-sm">Please wait...</span>
                                </>
                            ) : (
                                <>
                                    <span className="font-semibold text-sm">{mode === 'login' ? 'Sign in' : 'Create account'}</span>
                                    <ArrowRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all"/>
                                </>
                            )}
                        </button>

                        <p className="text-[10px] text-center text-gray-600">
                            Demo account: <span className="font-mono text-gray-400">demo</span> / <span className="font-mono text-gray-400">demo1234</span>
                        </p>
                      </form>
                    )}
                  </div>
              </div>

              {/* Right Column: Features Grid */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-right-8 fade-in duration-1000 delay-200">
                   {/* Card 1 */}
                   <div className="bg-space-900/40 backdrop-blur-md border border-space-800 p-6 rounded-2xl hover:bg-space-800/60 transition-colors group">
                       <div className="w-10 h-10 rounded-lg bg-space-950 border border-space-800 flex items-center justify-center mb-4 group-hover:border-cyan-500/50 transition-colors">
                           <GitGraph className="text-cyan-400" size={20} />
                       </div>
                       <h3 className="font-semibold text-gray-100 text-lg mb-2">Multiverse Branching</h3>
                       <p className="text-sm text-gray-400 leading-relaxed">
                           Fork any message to explore alternate realities. Keep context intact while diverging paths.
                       </p>
                   </div>

                   {/* Card 2 */}
                   <div className="bg-space-900/40 backdrop-blur-md border border-space-800 p-6 rounded-2xl hover:bg-space-800/60 transition-colors group sm:translate-y-8">
                       <div className="w-10 h-10 rounded-lg bg-space-950 border border-space-800 flex items-center justify-center mb-4 group-hover:border-nebula-500/50 transition-colors">
                           <MessageSquare className="text-nebula-400" size={20} />
                       </div>
                       <h3 className="font-semibold text-gray-100 text-lg mb-2">Context Injection</h3>
                       <p className="text-sm text-gray-400 leading-relaxed">
                           Connect disparate nodes to merge memories. Feed history from Track A into Track B.
                       </p>
                   </div>

                   {/* Card 3 */}
                   <div className="bg-space-900/40 backdrop-blur-md border border-space-800 p-6 rounded-2xl hover:bg-space-800/60 transition-colors group">
                       <div className="w-10 h-10 rounded-lg bg-space-950 border border-space-800 flex items-center justify-center mb-4 group-hover:border-amber-500/50 transition-colors">
                           <Zap className="text-amber-400" size={20} />
                       </div>
                       <h3 className="font-semibold text-gray-100 text-lg mb-2">Gemini Model</h3>
                       <p className="text-sm text-gray-400 leading-relaxed">
                           Powered by Google's latest models for ultra-low latency and high-reasoning capabilities.
                       </p>
                   </div>

                   {/* Card 4 */}
                   <div className="bg-space-900/40 backdrop-blur-md border border-space-800 p-6 rounded-2xl hover:bg-space-800/60 transition-colors group sm:translate-y-8">
                       <div className="w-10 h-10 rounded-lg bg-space-950 border border-space-800 flex items-center justify-center mb-4 group-hover:border-emerald-500/50 transition-colors">
                           <Monitor className="text-emerald-400" size={20} />
                       </div>
                       <h3 className="font-semibold text-gray-100 text-lg mb-2">Visual Mapping</h3>
                       <p className="text-sm text-gray-400 leading-relaxed">
                           Explore the conversation with a visual mapping map. Use zoom, pan, and reorganize features.
                       </p>
                   </div>
              </div>
          </div>
       </div>
       
       {/* Footer */}
       <div className="relative z-10 w-full p-6 text-center text-[10px] text-gray-600 font-mono uppercase tracking-widest border-t border-white/5">
           System Status: Ready for Initiation • Secure Environment
       </div>
    </div>
  );
};