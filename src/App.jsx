import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import AuthScreen from './components/AuthScreen'
import Dashboard from './components/Dashboard'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Shield, Globe, Cpu, RefreshCw } from 'lucide-react'
import FallingLeaves from './components/FallingLeaves'

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isBooting, setIsBooting] = useState(true)
  const [bootStep, setBootStep] = useState(0)

  const bootMessages = [
    'INITIATING SECURE AETHER NET...',
    'ESTABLISHING ENCRYPTED DATAPATH...',
    'COMPILING DECENTRALIZED CO2 LEDGER...',
    'AETHER SYNC PROTOCOLS ONLINE'
  ]

  // Boot sequence animation trigger
  useEffect(() => {
    let interval
    if (isBooting) {
      interval = setInterval(() => {
        setBootStep((prev) => {
          if (prev >= bootMessages.length - 1) {
            clearInterval(interval)
            // End boot sequence with slight delay for satisfaction
            setTimeout(() => {
              setIsBooting(false)
            }, 800)
            return prev
          }
          return prev + 1
        })
      }, 500)
    }
    return () => clearInterval(interval)
  }, [isBooting])

  // Monitor Supabase Auth changes
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setSession(null)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="relative min-h-screen select-none overflow-hidden">
      {/* Base Background Gradient Layer */}
      <div className="fixed inset-0 z-[-30] bg-gradient-to-b from-white via-[#f4fbf7] to-[#eaf5ee] pointer-events-none" />

      {/* Green Smoke Animation Overlay */}
      <div className="smoke-container">
        <div className="smoke-particle smoke-particle-1" />
        <div className="smoke-particle smoke-particle-2" />
        <div className="smoke-particle smoke-particle-3" />
        <div className="smoke-particle smoke-particle-4" />
      </div>

      {/* SVG Filter for Organic Smoke Distortion */}
      <svg className="absolute w-0 h-0 pointer-events-none" style={{ visibility: 'hidden' }}>
        <defs>
          <filter id="smoke-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.015 0.01" numOctaves="3" result="noise" seed="5" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="180" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Falling Leaves Background Particle Effect */}
      <FallingLeaves />

      <AnimatePresence mode="wait">
        {isBooting ? (
          /* Cinematic Splash Screen */
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white p-4 relative"
          >
            {/* Dynamic visual grid */}
            <div className="absolute inset-0 scanline opacity-[0.015] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 glow-bg-green rounded-full opacity-35 filter blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center max-w-sm w-full text-center relative z-10">
              {/* Spinning / Glowing Logo Container */}
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    '0 0 20px rgba(34, 197, 94, 0.08)',
                    '0 0 40px rgba(34, 197, 94, 0.25)',
                    '0 0 20px rgba(34, 197, 94, 0.08)'
                  ]
                }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="p-5 bg-green-500/10 rounded-3xl border border-green-500/25 mb-8"
              >
                <Leaf className="w-12 h-12 text-green-600" />
              </motion.div>

              <h1 className="text-4xl font-extrabold text-slate-900 tracking-widest font-title mb-2">
                AETHER
              </h1>
              <p className="text-xs text-green-600 font-mono tracking-[0.25em] font-bold uppercase mb-8">
                Carbon Sync Matrix
              </p>

              {/* Console log outputs */}
              <div className="w-full bg-slate-50/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 font-mono text-[10px] text-left space-y-2 h-32 overflow-hidden shadow-xl relative">
                <div className="absolute top-2 right-4 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
                </div>
                
                <div className="text-slate-400 font-bold mb-1">SYSTEM_BOOT_LOG:</div>
                <div className="space-y-1">
                  {bootMessages.slice(0, bootStep + 1).map((msg, index) => (
                    <div 
                      key={index}
                      className={index === bootStep ? 'text-green-600 font-bold' : 'text-slate-500'}
                    >
                      &gt; {msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : authLoading ? (
          /* Micro spinner while resolving authentication check */
          <div key="loader" className="min-h-screen flex items-center justify-center bg-white">
            <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : !session ? (
          /* Auth screen */
          <motion.div
            key="auth-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AuthScreen onAuthSuccess={(user) => setSession({ user })} />
          </motion.div>
        ) : (
          /* Dashboard */
          <motion.div
            key="dashboard-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Dashboard user={session.user} onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
