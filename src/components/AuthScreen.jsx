import React, { useState } from 'react'
import { supabase, isPlaceholder } from '../supabaseClient'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Leaf, Lock, User, Sparkles, ArrowRight, RefreshCw, AlertCircle, Eye, EyeOff, Database, Terminal } from 'lucide-react'

// Random Eco-ID Generator lists
const prefixes = ['eco', 'terra', 'sage', 'green', 'zero', 'bio', 'solar', 'wind', 'earth', 'pure', 'flora', 'sol']
const nouns = ['guardian', 'scout', 'keeper', 'warrior', 'hero', 'ranger', 'pioneer', 'shifter', 'nexus', 'apex', 'leaf', 'spark']

export default function AuthScreen({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [ecoId, setEcoId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  // Track if we had connection issues and want to offer Sandbox Mode
  const [showSandboxOption, setShowSandboxOption] = useState(isPlaceholder)



  // Generate a random unique-looking Eco-ID
  const handleGenerateEcoId = () => {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(100 + Math.random() * 900)
    setEcoId(`${prefix}-${noun}-${num}`)
    setError('')
  }

  // Map Eco-ID to virtual email
  const getVirtualEmail = (id) => {
    const cleanId = id.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '')
    return `${cleanId}@aether-carbon.com`
  }

  // Handle bypassing to Sandbox Local Mode
  const handleStartSandbox = () => {
    setLoading(true)
    setError('')
    const finalEcoId = ecoId.trim() || 'sandbox-guardian'
    
    // Simulate database profile insertion in local storage
    const mockUser = {
      id: 'mock-sandbox-user-id',
      email: getVirtualEmail(finalEcoId),
      display_name: finalEcoId,
      isSandbox: true
    }

    setSuccessMsg('Launching Local Sandbox Connection...')
    setTimeout(() => {
      onAuthSuccess(mockUser)
      setLoading(false)
    }, 1200)
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')

    if (!ecoId) {
      setError('Eco-ID is required')
      setLoading(false)
      return
    }

    if (ecoId.length < 4) {
      setError('Eco-ID must be at least 4 characters')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    // If placeholder environment is active, direct them to use Sandbox or show error
    if (isPlaceholder) {
      setError('Supabase connection details are missing from your configuration. Please run in Sandbox Mode or configure your .env file.')
      setShowSandboxOption(true)
      setLoading(false)
      return
    }

    const email = getVirtualEmail(ecoId)

    try {
      if (isSignUp) {
        // 1. Sign up user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (authError) throw authError

        const user = authData.user
        if (user) {
          // 2. Create profile in the public.profiles table
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: user.id,
              display_name: ecoId.trim(),
              eco_id: ecoId.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, ''),
              badge_status: 'Seedling',
            },
          ])

          if (profileError) {
            console.error('Error inserting profile:', profileError)
            throw new Error(`Auth succeeded but profile creation failed: ${profileError.message}`)
          }

          setSuccessMsg('Eco-Account created successfully! Logging in...')
          setTimeout(() => {
            onAuthSuccess(user)
          }, 1500)
        }
      } else {
        // Sign In
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) throw authError

        if (authData.user) {
          onAuthSuccess(authData.user)
        }
      }
    } catch (err) {
      console.error(err)
      if (err.message === 'Failed to fetch') {
        setError('Network Connection Error: Could not connect to Supabase. Check your internet connection or verify the URL in your .env file.')
        setShowSandboxOption(true)
      } else if (err.message.includes('Email not confirmed')) {
        setError('Verification required. Email confirmation is enabled on your Supabase dashboard. Please disable "Confirm email" in Supabase Auth settings.')
      } else if (err.message.includes('rate limit')) {
        setError('Supabase Signup Rate Limit Exceeded. Supabase limits free projects to 3 signups per hour. Please wait a few minutes or click the Sandbox Mode button below to test the application locally.')
        setShowSandboxOption(true)
      } else {
        setError(err.message || 'An unexpected authentication error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
    >
      {/* Background glow meshes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 glow-bg-green rounded-full pointer-events-none filter blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 glow-bg-amber rounded-full pointer-events-none filter blur-3xl opacity-40" />

      {/* Futuristic Scanline Effect */}
      <div className="absolute inset-0 scanline opacity-[0.015] pointer-events-none" />



      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-md glass-panel rounded-3xl overflow-hidden border border-green-100/60 relative z-10"
      >
        {/* Luminous Top Accent line */}
        <div className={`h-1.5 w-full bg-gradient-to-r transition-all duration-500 ${isSignUp ? 'from-amber-400 to-green-500' : 'from-green-500 to-emerald-600'}`} />

        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="p-3 bg-green-500/10 rounded-2xl border border-green-500/20 mb-4"
            >
              <Leaf className="w-8 h-8 text-green-600" />
            </motion.div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1 font-title">
              {isSignUp ? 'Generate Eco-ID' : 'AERO CARBON'}
            </h2>
            <p className="text-sm text-slate-500">
              {isSignUp ? 'Join the unified carbon synchronization network' : 'Enter your credentials to synchronize across devices'}
            </p>
          </div>

          {/* Warning Setup Guide Banner */}
          {showSandboxOption && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 bg-amber-50/60 border border-amber-200/50 rounded-2xl space-y-3"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 font-mono">
                <Database className="w-4 h-4 text-amber-700 shrink-0" />
                SUPABASE NOT CONFIGURATION READY
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">
                To connect to your database, create a file named <code className="text-green-700 font-bold font-mono">.env</code> in the project directory:
              </p>
              <pre className="text-[9px] bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-slate-700 font-mono overflow-x-auto select-all">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
              </pre>
              <button
                type="button"
                onClick={handleStartSandbox}
                className="w-full py-2 bg-green-600/10 hover:bg-green-600/20 text-green-800 border border-green-200 rounded-lg text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-green-600" />
                Launch Sandbox Mode (Local Cache)
              </button>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/5 border border-red-500/15 rounded-2xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800 leading-relaxed font-mono">{error}</div>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-500/5 border border-green-500/15 rounded-2xl flex items-start gap-3"
            >
              <Sparkles className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-xs text-green-800 font-medium">{successMsg}</div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-green-800 uppercase tracking-wider font-mono">
                  Eco-ID
                </label>
                {isSignUp && (
                  <button
                    type="button"
                    onClick={handleGenerateEcoId}
                    className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors font-bold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Auto-Generate
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs select-none">
                  ID
                </span>
                <input
                  type="text"
                  placeholder="e.g. vibhath"
                  value={ecoId}
                  onChange={(e) => setEcoId(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 glass-input text-sm"
                />
              </div>
              {isSignUp && (
                <p className="text-[10px] text-green-700/80 font-mono mt-2 leading-normal">
                  * Note: Your Eco-ID serves as your cryptographic display name and will be printed on all returning carbon synchronization certificates, ledger logs, and sync rank badges.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-green-800 uppercase tracking-wider mb-2 font-mono">
                Security Key (Password)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 glass-input text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 mt-6 cursor-pointer
                ${loading 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' 
                  : 'bg-green-600 text-white hover:bg-green-500 active:scale-[0.98] shadow-lg shadow-green-600/10'
                }`}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Generate Account' : 'Establish Connection'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleStartSandbox}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 mt-3 border border-green-200 hover:border-green-400 hover:bg-green-50/60 text-green-700 hover:text-green-800 cursor-pointer active:scale-[0.98]"
            >
              <Terminal className="w-4.5 h-4.5 text-green-600" />
              Launch Sandbox Demo
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center border-t border-slate-200/80 pt-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setSuccessMsg('')
              }}
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              {isSignUp ? (
                <span>Already registered? <strong className="text-green-600 font-bold">Connect Key</strong></span>
              ) : (
                <span>Need a new ID? <strong className="text-green-600 font-bold">Generate Profile</strong></span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
