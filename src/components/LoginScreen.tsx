import { useState } from 'react';
import { Github, Code } from 'lucide-react';

interface LoginScreenProps {
  onGoogleSignIn: () => void;
  onGithubSignIn: () => void;
}

export const LoginScreen = ({ onGoogleSignIn, onGithubSignIn }: LoginScreenProps) => {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | null>(null);

  const handleLogin = async (provider: 'google' | 'github') => {
    setLoadingProvider(provider);
    
    try {
      if (provider === 'google') {
        await onGoogleSignIn();
      } else {
        await onGithubSignIn();
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-sans"
      style={{
        backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      
      {/* Decorative Background Elements (ICPC Balloons) */}
      <div className="absolute top-[15%] left-[15%] balloon-float opacity-20 pointer-events-none">
        <div className="text-8xl transform rotate-12 text-yellow-500" style={{ filter: 'drop-shadow(0 0 10px rgba(234, 179, 8, 0.5))' }}>
          📍
        </div>
        <div className="w-0.5 h-24 bg-slate-500 mx-auto -mt-2 opacity-60"></div>
      </div>

      <div className="absolute bottom-[20%] right-[15%] balloon-float-delayed opacity-20 pointer-events-none">
        <div className="text-9xl transform -rotate-12 text-blue-500" style={{ filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' }}>
          📍
        </div>
        <div className="w-0.5 h-32 bg-slate-500 mx-auto -mt-2 opacity-60"></div>
      </div>

      <div className="absolute top-[25%] right-[25%] balloon-float-slow opacity-10 pointer-events-none">
        <div className="text-6xl transform rotate-6 text-red-500" style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))' }}>
          📍
        </div>
        <div className="w-0.5 h-16 bg-slate-500 mx-auto -mt-1 opacity-60"></div>
      </div>

      {/* Main Container */}
      <div className="z-10 w-full max-w-md px-6">
        
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-400 rounded-2xl flex items-center justify-center shadow-lg mb-4 rotate-3 hover:rotate-0 transition-transform duration-500 border border-slate-300">
            <Code className="text-slate-800" size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight mb-2 shimmer-text">Silver</h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide uppercase text-center">
            Competitive Programming<br/>Team Collaboration
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-center mb-6 text-slate-200">Welcome Back</h2>
          
          <div className="space-y-4">
            {/* Google Button */}
            <button 
              onClick={() => handleLogin('google')}
              disabled={loadingProvider !== null}
              className="group relative w-full bg-white hover:bg-slate-100 text-slate-800 font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loadingProvider === 'google' ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                  <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                    →
                  </div>
                </>
              )}
            </button>

            {/* GitHub Button */}
            <button 
              onClick={() => handleLogin('github')}
              disabled={loadingProvider !== null}
              className="group relative w-full bg-[#24292F] hover:bg-[#2b3137] text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-gray-500 outline-none border border-slate-600 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loadingProvider === 'github' ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Github size={20} />
                  <span>Continue with GitHub</span>
                  <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500">
                    →
                  </div>
                </>
              )}
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="h-px bg-slate-700 w-12"></div>
            <span className="text-slate-500 text-xs uppercase tracking-wider">Secure Access</span>
            <div className="h-px bg-slate-700 w-12"></div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-xs">
            By logging in, you agree to Silver's{' '}
            <a href="#" className="text-slate-400 hover:text-white underline decoration-slate-600 hover:decoration-white transition-colors">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-slate-400 hover:text-white underline decoration-slate-600 hover:decoration-white transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
      
      {/* Code decoration in background */}
      <div className="absolute bottom-4 left-6 text-slate-700 font-mono text-xs opacity-50 select-none pointer-events-none hidden md:block">
        <pre>{`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(0);
    cin.tie(0);
    // Silver: Collaborative CP
    solve();
    return 0;
}`}</pre>
      </div>
    </div>
  );
};
