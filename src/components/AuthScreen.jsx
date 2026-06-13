import React, { useState, useRef } from 'react'
import { supabase, isPlaceholder } from '../supabaseClient'
import { motion } from 'framer-motion'
import { Leaf, Lock, Sparkles, ArrowRight, RefreshCw, AlertCircle, Eye, EyeOff, Shield, ShieldCheck, FolderOpen } from 'lucide-react'

// Random Eco-ID Generator lists
const prefixes = ['eco', 'terra', 'sage', 'green', 'zero', 'bio', 'solar', 'wind', 'earth', 'pure', 'flora', 'sol']
const nouns = ['guardian', 'scout', 'keeper', 'warrior', 'hero', 'ranger', 'pioneer', 'shifter', 'nexus', 'apex', 'leaf', 'spark']

export default function AuthScreen({ onAuthSuccess, onAdminLogin, onAdminConfigFile }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [ecoId, setEcoId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminSuccess, setAdminSuccess] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAdminLoading(true)
    setAdminError('')
    try {
      await onAdminConfigFile(file)
      setAdminSuccess(true)
    } catch (err) {
      setAdminError(err.message || 'Failed to load config file.')
    } finally {
      setAdminLoading(false)
      // Reset so same file can be re-selected
      e.target.value = ''
    }
  }

  // Generate a random unique-looking Eco-ID
  const handleGenerateEcoId = () => {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(100 + Math.random() * 900)
    setEcoId(`${prefix}-${noun}-${num}`)
    setError('')
  }

  // Map Eco-ID to virtual email, or use raw email directly if it contains an '@'
  const getVirtualEmail = (id) => {
    const trimmed = id.trim()
    if (trimmed.includes('@')) {
      return trimmed.toLowerCase()
    }
    const cleanId = trimmed.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '')
    return `${cleanId}@gmail.com`
  }

  const handleAdminLoginClick = async () => {
    setAdminLoading(true)
    setAdminError('')
    setAdminSuccess(false)
    try {
      await onAdminLogin()
      setAdminSuccess(true)
    } catch (err) {
      setAdminError(err.message || 'Not an admin device.')
    } finally {
      setAdminLoading(false)
    }
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

    if (isPlaceholder) {
      setError('Supabase connection details are missing. Please configure your .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      setLoading(false)
      return
    }

    const email = getVirtualEmail(ecoId)

    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: ecoId.trim(),
              eco_id: ecoId.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '')
            }
          }
        })

        if (authError) throw authError

        const user = authData.user
        const session = authData.session

        if (user) {
          if (!session) {
            throw new Error(
              "Account registered! However, 'Confirm email' is enabled in your Supabase Auth settings. " +
              "Since you are using a virtual Eco-ID email, you must disable 'Confirm email' under Authentication → Providers → Email in your Supabase Dashboard."
            )
          }

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
            if (profileError.message.includes('row-level security') || profileError.message.includes('violates row-level security')) {
              throw new Error(
                "Profile insertion failed due to Row-Level Security (RLS). " +
                "Please ensure you ran the database schema setup in the Supabase SQL editor."
              )
            }
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

        const loggedInUser = authData.user || authData.session?.user
        if (loggedInUser) {
          onAuthSuccess(loggedInUser)
        } else {
          throw new Error('Login succeeded but no user data was returned. Please try again.')
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      const msg = err.message || ''
      if (msg === 'Failed to fetch') {
        setError('Network Error: Could not connect to Supabase. Check your internet connection or verify the URL in your .env file.')
      } else if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('not confirmed')) {
        setError(
          '🔒 Email not confirmed. In your Supabase Dashboard go to: Authentication → Providers → Email → and turn OFF "Confirm email". ' +
          'This app uses virtual Eco-IDs so real email verification is not possible.'
        )
      } else if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid credentials') || msg.toLowerCase().includes('wrong password')) {
        setError(
          `❌ Incorrect Eco-ID or password. Make sure you type your Eco-ID exactly as registered. ` +
          `Your login key is: ${getVirtualEmail(ecoId)}`
        )
      } else if (msg.toLowerCase().includes('user already registered') || msg.toLowerCase().includes('already been registered')) {
        setError('This Eco-ID is already taken. Switch to "Connect Key" (login) mode below to sign in.')
      } else if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many requests')) {
        setError('Supabase Rate Limit: Max 3 signups per hour on free tier. Please wait a few minutes and try again.')
      } else {
        setError(msg || 'An unexpected authentication error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background glow meshes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 glow-bg-green rounded-full pointer-events-none filter blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 glow-bg-amber rounded-full pointer-events-none filter blur-3xl opacity-40" />

      {/* Futuristic Scanline Effect */}
      <div className="absolute inset-0 scanline opacity-[0.015] pointer-events-none" />

      <div className="w-full max-w-md flex flex-col gap-3 relative z-10">

        {/* ── Admin Device Login Banner (OUTSIDE + ABOVE the card) ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg transition-colors duration-300 ${adminSuccess ? 'bg-green-100' : 'bg-slate-100'}`}>
                {adminSuccess
                  ? <ShieldCheck className="w-4 h-4 text-green-600" />
                  : <Shield className="w-4 h-4 text-slate-500" />
                }
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-700 font-mono tracking-wide leading-none">ADMIN DEVICE ACCESS</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">Verified via admin_config.json</p>
              </div>
            </div>
            <button
              type="button"
              id="admin-login-btn"
              disabled={adminLoading || adminSuccess}
              onClick={handleAdminLoginClick}
              className={
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono transition-all duration-200 ` +
                (adminSuccess
                  ? 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed'
                  : adminLoading
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-slate-700 active:scale-95 shadow-sm cursor-pointer'
                )
              }
            >
              {adminLoading
                ? <RefreshCw className="w-3 h-3 animate-spin" />
                : adminSuccess
                  ? <ShieldCheck className="w-3 h-3" />
                  : <Shield className="w-3 h-3" />
              }
              {adminSuccess ? 'Logged in!' : adminLoading ? 'Verifying...' : 'Admin Login'}
            </button>
          </div>
          {adminError && (
            <div className="px-4 pb-3 flex flex-col gap-2">
              <p className="text-[10px] text-red-600 font-mono bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                ⚠ {adminError}
              </p>
              {adminError.includes('not found') && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold font-mono bg-slate-800 text-green-400 hover:bg-slate-700 border border-slate-600 transition-all active:scale-95 cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Load Config File from this Device
                  </button>
                  <p className="text-[9px] text-slate-400 font-mono leading-relaxed">
                    📁 Select your local <span className="text-slate-600 font-bold">admin_config.json</span>. Once loaded it is saved in this browser permanently — works on any URL.
                  </p>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Main Auth Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full glass-panel rounded-3xl overflow-hidden border border-green-100/60"
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
                {isSignUp ? (
                  <p className="text-[10px] text-green-700/80 font-mono mt-2 leading-normal">
                    * Your Eco-ID is your cryptographic display name printed on all carbon certificates, ledger logs, and sync rank badges.
                  </p>
                ) : ecoId.trim().length >= 4 ? (
                  <p className="text-[10px] text-slate-400 font-mono mt-1.5 leading-normal">
                    🔑 Login key: <span className="text-green-700 font-bold">{getVirtualEmail(ecoId)}</span>
                  </p>
                ) : null}
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
                id="auth-submit-btn"
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
    </div>
  )
}
