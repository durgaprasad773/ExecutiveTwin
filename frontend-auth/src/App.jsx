import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/monday-briefing';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStep, setAuthStep] = useState('landing'); // landing, permissions, processing
  const [agreed, setAgreed] = useState(false);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState(null);
  const [error, setError] = useState(null);

  // Check for existing session
  useEffect(() => {
    const savedAuth = localStorage.getItem('et_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (selectedProvider) => {
    if (!agreed) return;
    setProvider(selectedProvider);
    setAuthStep('permissions');
  };

  const handleGrantPermissions = async () => {
    setAuthStep('processing');
    try {
      const response = await axios.post('http://localhost:8000/api/authenticate');
      if (response.data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('et_auth', 'true');
      } else {
        setError('Authentication failed. Please try again.');
        setAuthStep('permissions');
      }
    } catch (err) {
      setError('Authentication error: ' + (err.response?.data?.detail || err.message));
      setAuthStep('permissions');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setBriefing(null);
    setAuthStep('landing');
    setAgreed(false);
    setProvider(null);
    localStorage.removeItem('et_auth');
  };

  const generateBriefing = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(API_URL);
      
      if (response.data.success) {
        // Transform the data to match the expected format
        const data = response.data.data;
        const formattedBriefing = {
          strategicBriefing: data.strategic_briefing
            .map((item, i) => `${i + 1}. ${item.emoji || '📌'} ${item.task} - ${item.time_estimate}\n   ${item.reasoning}`)
            .join('\n\n'),
          noiseFiltered: data.noise_filtered.join('\n')
        };
        setBriefing(formattedBriefing);
      } else {
        setError(response.data.message || 'Shield breach: Failed to generate briefing');
      }
    } catch (err) {
      setError('Shield breach: The twin failed to process the morning feed. Check API status.');
    } finally {
      setLoading(false);
    }
  };

  // Layout wrapper
  const Layout = ({ children }) => (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 selection:bg-cyan-500/30">
      <nav className="h-16 border-b border-zinc-900 px-6 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">ET</span>
          </div>
          <span className="text-sm font-semibold tracking-widest uppercase text-zinc-100">Executive Twin</span>
        </div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-tighter">Module 01: Monday Prioritizer</div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        {children}
      </main>
      <footer className="py-12 border-t border-zinc-900 text-center">
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">NeuraScaleX Clinical Operations © 2024</p>
      </footer>
    </div>
  );

  // Auth Processing Screen
  if (!isAuthenticated && authStep === 'processing') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in duration-700">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-2 border-zinc-800 rounded-full"></div>
            <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-zinc-400 text-[10px] uppercase tracking-[0.4em] font-bold">Securing Channel</p>
            <p className="text-zinc-600 text-xs font-light italic">Establishing encrypted link to {provider} services...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Permissions Screen
  if (!isAuthenticated && authStep === 'permissions') {
    return (
      <Layout>
        <div className="max-w-md mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-zinc-900 rounded-2xl mx-auto flex items-center justify-center border border-zinc-800">
              <div className="w-6 h-6 bg-cyan-500 rounded-full blur-[8px] opacity-20"></div>
              <div className="absolute w-2 h-2 bg-cyan-500 rounded-full"></div>
            </div>
            <h2 className="text-2xl font-light text-white tracking-tight">Access Authorization</h2>
            <p className="text-zinc-500 text-sm font-light">The Executive Twin requires access to synthesize your morning briefing.</p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-6">
            <div className="space-y-4">
              <PermissionItem 
                title="Inbox Access" 
                description="Read and filter administrative noise from your email threads."
              />
              <PermissionItem 
                title="Calendar Synthesis" 
                description="Review scheduled commitments to determine strategic priority."
              />
              <PermissionItem 
                title="Identity Verification" 
                description="Securely identify your profile for session continuity."
              />
            </div>

            <div className="pt-4 space-y-4">
              <button
                onClick={handleGrantPermissions}
                className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-colors active:scale-[0.98]"
              >
                Grant Secure Access
              </button>
              <p className="text-center text-[9px] text-zinc-600 uppercase tracking-tighter">
                Encrypted via OAuth 2.0 • End-to-end Privacy Guaranteed
              </p>
              {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg text-red-400 text-xs font-mono">
                  [ERROR] {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Login Landing Screen
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-md mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-cyan-900/20">
              <span className="text-white font-bold text-xl tracking-tighter">ET</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-light text-white tracking-tight">Executive Twin</h1>
              <p className="text-zinc-500 text-sm font-light tracking-wide italic">Deploying the operational shield for Dr. Arokia.</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleLogin('Google')}
              disabled={!agreed}
              className={`w-full group relative flex items-center justify-between px-8 py-5 border rounded-2xl transition-all duration-300 ${
                agreed ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900' : 'opacity-40 cursor-not-allowed border-zinc-900'
              }`}
            >
              <div className="flex items-center space-x-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-zinc-200 text-sm font-medium">Continue with Google Workspace</span>
              </div>
              <svg className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => handleLogin('Microsoft')}
              disabled={!agreed}
              className={`w-full group relative flex items-center justify-between px-8 py-5 border rounded-2xl transition-all duration-300 ${
                agreed ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900' : 'opacity-40 cursor-not-allowed border-zinc-900'
              }`}
            >
              <div className="flex items-center space-x-4">
                <svg className="w-5 h-5" viewBox="0 0 23 23">
                  <path fill="#f3f3f3" d="M1 1h10v10H1zM12 1h10v10H12zM1 12h10v10H1zM12 12h10v10H12z" />
                </svg>
                <span className="text-zinc-200 text-sm font-medium">Continue with Microsoft 365</span>
              </div>
              <svg className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="pt-6 space-y-6">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <div className="relative flex items-center pt-1">
                <input 
                  type="checkbox" 
                  checked={agreed} 
                  onChange={(e) => setAgreed(e.target.checked)} 
                  className="peer sr-only"
                />
                <div className="w-5 h-5 border border-zinc-700 rounded bg-zinc-900 peer-checked:bg-cyan-600 peer-checked:border-cyan-600 transition-all duration-200"></div>
                <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity left-[3px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs text-zinc-500 font-light leading-relaxed group-hover:text-zinc-400 transition-colors">
                I acknowledge and accept the <span className="underline decoration-zinc-800 underline-offset-2">Terms of Strategic Deployment</span> and <span className="underline decoration-zinc-800 underline-offset-2">Clinical Data Privacy Policy</span>.
              </span>
            </label>
            
            <div className="flex justify-center space-x-6">
              <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest cursor-help hover:text-zinc-500">Security</span>
              <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest cursor-help hover:text-zinc-500">Compliance</span>
              <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest cursor-help hover:text-zinc-500">HIPAA</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Dashboard - No Briefing Yet
  if (!briefing && !loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
              <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-500 uppercase">Secure Link Established</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extralight text-white tracking-tight leading-[1.1]">
              The Monday <br /> <span className="font-semibold">Prioritizer.</span>
            </h1>
            <p className="text-zinc-500 text-lg max-w-lg mx-auto font-light leading-relaxed">
              Authentication verified. Access to Outlook granted. Ready to synthesize your operational shield.
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={generateBriefing}
              className="group relative flex items-center space-x-4 px-10 py-5 font-semibold tracking-wider text-black transition-all duration-500 bg-white rounded-full hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-95 overflow-hidden"
            >
              <span className="relative z-10">Initialize Monday Briefing</span>
              <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            <button 
              onClick={handleLogout}
              className="text-[10px] text-zinc-700 uppercase tracking-widest hover:text-zinc-500 transition-colors"
            >
              Sign Out of Session
            </button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg text-red-400 text-xs font-mono">
              [ERROR] {error}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Loading State
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-10">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-2 border-zinc-800 rounded-full"></div>
            <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
            <div className="absolute inset-4 border border-zinc-900 rounded-full animate-pulse"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-zinc-200 text-xs uppercase tracking-[0.3em] font-medium animate-pulse">Scanning Data Streams</p>
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-light">Filtering administrative noise...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Briefing Display
  return (
    <Layout>
      <div className="space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Main Strategic Section */}
        <section className="space-y-12">
          <header className="flex items-end justify-between border-b border-zinc-900 pb-8">
            <div className="space-y-1">
              <div className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase">Live Synthesis</div>
              <h2 className="text-3xl font-light text-white tracking-tight">Strategic Briefing</h2>
            </div>
            <div className="flex items-center space-x-6 pb-1">
              <button 
                onClick={() => setBriefing(null)}
                className="text-[10px] text-zinc-600 uppercase tracking-widest hover:text-white transition-colors"
              >
                Refresh Scan
              </button>
              <button 
                onClick={handleLogout}
                className="text-[10px] text-red-900/60 uppercase tracking-widest hover:text-red-500 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </header>
          
          <div className="grid gap-6">
            {briefing.strategicBriefing.split('\n').filter(line => line.trim()).map((line, i) => {
              const isTask = line.startsWith('-') || line.match(/^\d\./) || line.includes(' - ');
              return (
                <div key={i} className={`group relative transition-all duration-500 ${isTask ? 'p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 hover:border-cyan-500/30 hover:bg-zinc-900/60' : 'mb-4'}`}>
                  {isTask && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-1/2 bg-cyan-500 transition-all duration-500 rounded-r"></div>
                  )}
                  <p className={`leading-relaxed ${isTask ? 'text-zinc-100 font-medium text-lg' : 'text-zinc-400 font-light text-sm italic'}`}>
                    {line.replace(/^-\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Noise Filtered Section */}
        <section className="pt-16 border-t border-zinc-900/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
              <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Layer 01: Noise Filtered</h3>
            </div>
            <div className="text-[9px] text-zinc-700 font-mono italic">BYPASSING LOW-VALUE INPUTS</div>
          </div>
          
          <div className="bg-zinc-900/5 rounded-2xl p-8 border border-zinc-900/20">
            <div className="text-zinc-600 text-sm font-light italic leading-relaxed space-y-4">
              {briefing.noiseFiltered.split('\n').map((para, i) => (
                <p key={i} className="opacity-40 hover:opacity-100 transition-opacity duration-700 cursor-default">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <div className="flex flex-col items-center space-y-6 pt-12">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-zinc-800"></div>
          <button 
            onClick={() => alert("Execution path confirmed. Operational shield reinforced.")}
            className="px-12 py-4 rounded-full border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300"
          >
            Confirm Deployment
          </button>
        </div>
      </div>
    </Layout>
  );
}

// Permission Item Component
const PermissionItem = ({ title, description }) => (
  <div className="flex items-start space-x-4">
    <div className="pt-1">
      <div className="w-4 h-4 rounded-full border border-cyan-500/50 flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
      </div>
    </div>
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
      <p className="text-xs text-zinc-500 font-light leading-relaxed">{description}</p>
    </div>
  </div>
);

export default App;
