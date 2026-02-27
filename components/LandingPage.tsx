import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Key, GitGraph, Zap, MessageSquare, Monitor, Loader } from 'lucide-react';
import { validateApiKey } from '../services/geminiService';

interface LandingPageProps {
  onStart: () => void;
  onError: (message: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onError }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
      const savedKey = localStorage.getItem('GEMINI_API_KEY');
      if (savedKey) {
          setApiKey(savedKey);
      }
  }, []);

  const handleConnect = async () => {
    setLocalError(null);
    
    if (!apiKey.trim()) {
        const msg = "Please enter a valid Gemini API Key.";
        setLocalError(msg);
        onError(msg);
        return;
    }

    setIsValidating(true);
    
    try {
        // Validate API key
        const validation = await validateApiKey(apiKey.trim());
        
        if (!validation.valid) {
            const errorMsg = validation.error || "Invalid API Key";
            setLocalError(errorMsg);
            onError(errorMsg);
            setIsValidating(false);
            return;
        }
        
        // Save to LocalStorage for persistence
        localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
        
        // Attempt to polyfill/set process.env for the service
        // This handles the transition from the strict environment variable requirement to user input
        if (typeof process === 'undefined') {
            (window as any).process = { env: {} };
        }
        if (!process.env) {
            (process as any).env = {};
        }
        process.env.API_KEY = apiKey.trim();

        onStart();
    } catch (e) {
        console.error("Error saving API Key", e);
        const msg = "Failed to validate API Key. Please try again.";
        setLocalError(msg);
        onError(msg);
    } finally {
        setIsValidating(false);
    }
  };

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

                  {/* Auth Card (Manual Input) */}
                  <div className="w-full max-w-md bg-space-900/50 backdrop-blur-xl border border-space-800 rounded-2xl p-6 shadow-2xl mt-4 space-y-6">
                       <div className="space-y-2 text-left">
                            <label className="text-xs font-mono uppercase text-gray-500 ml-1">Gemini API Key</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Key size={16} className="text-gray-500 group-focus-within:text-nebula-400 transition-colors"/>
                                </div>
                                <input 
                                    type="password" 
                                    value={apiKey}
                                    onChange={(e) => {
                                        setApiKey(e.target.value);
                                        setLocalError(null);
                                    }}
                                    placeholder="Enter your API Key..."
                                    className={`w-full bg-space-950 border rounded-xl py-3 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 transition-all ${
                                        localError 
                                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                            : 'border-space-700 focus:border-nebula-500 focus:ring-nebula-500'
                                    }`}
                                />
                            </div>
                            {localError && (
                                <div className="flex items-center gap-2 mt-2 p-3 bg-red-950/40 border border-red-700/50 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
                                    <span className="text-xs text-red-300 font-medium">{localError}</span>
                                </div>
                            )}
                       </div>

                       <button
                          onClick={handleConnect}
                          disabled={isValidating}
                          className="w-full group relative overflow-hidden bg-gradient-to-r from-space-800 to-space-900 hover:from-nebula-900/50 hover:to-cyan-900/50 border border-space-700 hover:border-nebula-500/50 text-white h-12 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-nebula-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                           {isValidating ? (
                               <>
                                   <Loader size={16} className="animate-spin" />
                                   <span className="font-semibold text-sm">Validating...</span>
                               </>
                           ) : (
                               <>
                                   <span className="font-semibold text-sm">Initialize System</span>
                                   <ArrowRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all"/>
                               </>
                           )}
                      </button>

                      <p className="text-[10px] text-center text-gray-600">
                          Your key is stored locally in your browser.
                      </p>
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