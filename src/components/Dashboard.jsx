import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { analyzeJournalEntry } from '../utils/carbonAnalyzer'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { 
  LogOut, Plus, Trash2, History, BarChart3, User, Award, 
  Sparkles, RefreshCw, Send, Calendar, ChevronRight, Info, 
  Settings, Database, Leaf, Car, Utensils, Zap, ShoppingBag, 
  Layers, Globe, CheckCircle2, ShieldAlert, Terminal, Flame, Trees
} from 'lucide-react'

// Animated Counter component
function AnimatedCounter({ value, duration = 1.2 }) {
  const [count, setCount] = useState(0)
  const countRef = useRef(count)

  useEffect(() => {
    let start = countRef.current
    const end = parseFloat(value)
    if (start === end) return

    const range = end - start
    let current = start
    const increment = end > start ? 0.5 : -0.5
    const startTime = performance.now()

    const animate = (timestamp) => {
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      
      const val = parseFloat((start + range * easedProgress).toFixed(1))
      setCount(val)
      countRef.current = val

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(end)
        countRef.current = end
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <span>{count.toFixed(1)}</span>
}
// 3D Glassmorphic Tilt Card component
function TiltCard({ children, className = '' }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Map mouse positions to rotations (max 12 degrees tilt)
  const rotateX = useTransform(y, [-0.5, 0.5], [12, -12])
  const rotateY = useTransform(x, [-0.5, 0.5], [-12, 12])

  // Interactive glare background mapping
  const glareBackground = useTransform([x, y], ([latestX, latestY]) => {
    const px = (latestX + 0.5) * 100
    const py = (latestY + 0.5) * 100
    return `radial-gradient(circle at ${px}% ${py}%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 70%)`
  })

  const handleMouseMove = (event) => {
    const el = event.currentTarget
    const rect = el.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = event.clientX - rect.left - width / 2
    const mouseY = event.clientY - rect.top - height / 2
    x.set(mouseX / width)
    y.set(mouseY / height)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
      transformTemplate={({ rotateX, rotateY }) => 
        `perspective(1000px) rotateX(${rotateX}) rotateY(${rotateY}) translateZ(0)`
      }
      transition={{ type: 'spring', stiffness: 250, damping: 25 }}
      className={`glass-panel rounded-3xl p-6 md:p-8 border border-green-100/40 hover:border-green-300 transition-colors duration-300 hover:shadow-2xl hover:shadow-green-500/8 relative overflow-hidden group cursor-pointer ${className}`}
    >
      {/* Dynamic light refraction glare */}
      <motion.div
        style={{
          background: glareBackground,
          pointerEvents: 'none',
        }}
        className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />
      {/* 3D structural container */}
      <div 
        style={{ transform: 'translateZ(25px)', transformStyle: 'preserve-3d' }} 
        className="relative z-20 w-full h-full"
      >
        {children}
      </div>
    </motion.div>
  )
}

export default function Dashboard({ user, onLogout }) {
  // UI Tabs for Mobile layout
  const [activeTab, setActiveTab] = useState('feed') // 'feed', 'new-entry', 'analytics', 'settings'
  const [showMobileEntrySheet, setShowMobileEntrySheet] = useState(false)
  
  // Database States
  const [profile, setProfile] = useState(null)
  const [logs, setLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  
  // Form Input
  const [journalText, setJournalText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [syncSteps, setSyncSteps] = useState([])
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  
  // Settings view toggles
  const [showDevSettings, setShowDevSettings] = useState(false)
  const [dbConfigStatus, setDbConfigStatus] = useState('unknown') // 'connected', 'fallback', 'missing_tables', 'sandbox'



  // Time-based Greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Load user profile and journal logs
  const fetchData = async () => {
    try {
      setLoadingLogs(true)
      
      const emailUser = user.email || 'sandbox@aether-carbon.com'
      const namePart = emailUser.split('@')[0]
      
      if (user.isSandbox) {
        setDbConfigStatus('sandbox')
        const dispName = user.display_name || namePart
        setProfile({ display_name: dispName, eco_id: namePart, badge_status: 'Seedling' })
        
        // Fetch logs from localStorage
        const localLogs = localStorage.getItem(`eco_logs_${user.id}`)
        if (localLogs) {
          setLogs(JSON.parse(localLogs))
        } else {
          // Default mock data seed
          const defaultLogs = [
            {
              log_id: 'mock-1',
              raw_text: 'Commuted by train to the city center and had a vegetarian salad bowl for lunch.',
              calculated_kg: 2.4,
              efficiency_score: 88.0,
              category: 'mixed',
              suggestions: [
                'Great job taking public transport! It is 4x more efficient than driving.',
                'Plant-based lunches represent the lowest dietary footprint. Excellent eco-choice!'
              ],
              created_at: new Date(Date.now() - 3600000 * 24).toISOString()
            },
            {
              log_id: 'mock-2',
              raw_text: 'Drove SUV to grocery shop. Purchased new cotton shirts and plastic packaging items.',
              calculated_kg: 17.5,
              efficiency_score: 12.5,
              category: 'mixed',
              suggestions: [
                'Switch to public transit or carpooling to reduce personal vehicle emissions.',
                'Consumer goods carry hidden supply-chain emissions. Focus on reuse or second-hand items.'
              ],
              created_at: new Date(Date.now() - 3600000 * 48).toISOString()
            }
          ]
          setLogs(defaultLogs)
          localStorage.setItem(`eco_logs_${user.id}`, JSON.stringify(defaultLogs))
        }
        setLoadingLogs(false)
        return
      }

      // Fetch profile
      let { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileErr) {
        console.error('Profile fetch issue:', profileErr)
        // Auto-create profile if missing in public.profiles table (fallback safety)
        const randomId = namePart + '-' + Math.floor(100 + Math.random() * 900)
        
        const { data: newProfile, error: createProfileErr } = await supabase
          .from('profiles')
          .insert([{ id: user.id, display_name: namePart, eco_id: randomId, badge_status: 'Seedling' }])
          .select()
          .single()

        if (!createProfileErr && newProfile) {
          setProfile(newProfile)
          setDbConfigStatus('connected')
        } else {
          // Table likely doesn't exist
          setDbConfigStatus('missing_tables')
          // Set mock profile
          setProfile({ display_name: namePart, eco_id: namePart, badge_status: 'Seedling' })
        }
      } else {
        setProfile(profileData)
        setDbConfigStatus('connected')
      }

      // Fetch logs
      let { data: logsData, error: logsErr } = await supabase
        .from('journal_logs')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (logsErr) {
        console.error('Logs fetch issue:', logsErr)
        setDbConfigStatus('missing_tables')
        // Load mock logs from localStorage for immediate premium demo experience
        const localLogs = localStorage.getItem(`eco_logs_${user.id}`)
        if (localLogs) {
          setLogs(JSON.parse(localLogs))
        } else {
          // Default mock data seed
          const defaultLogs = [
            {
              log_id: 'mock-1',
              raw_text: 'Commuted by train to the city center and had a vegetarian salad bowl for lunch.',
              calculated_kg: 2.4,
              efficiency_score: 88.0,
              category: 'mixed',
              suggestions: [
                'Great job taking public transport! It is 4x more efficient than driving.',
                'Plant-based lunches represent the lowest dietary footprint. Excellent eco-choice!'
              ],
              created_at: new Date(Date.now() - 3600000 * 24).toISOString()
            },
            {
              log_id: 'mock-2',
              raw_text: 'Drove SUV to grocery shop. Purchased new cotton shirts and plastic packaging items.',
              calculated_kg: 17.5,
              efficiency_score: 12.5,
              category: 'mixed',
              suggestions: [
                'Switch to public transit or carpooling to reduce personal vehicle emissions.',
                'Consumer goods carry hidden supply-chain emissions. Focus on reuse or second-hand items.'
              ],
              created_at: new Date(Date.now() - 3600000 * 48).toISOString()
            }
          ]
          setLogs(defaultLogs)
          localStorage.setItem(`eco_logs_${user.id}`, JSON.stringify(defaultLogs))
        }
      } else {
        setLogs(logsData || [])
      }
    } catch (err) {
      console.error('Fetch data error:', err)
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user.id])

  // Compute metrics
  const logsCount = logs.length
  const totalKg = logs.reduce((acc, log) => acc + Number(log.calculated_kg), 0)
  const averageFootprint = logsCount > 0 ? (totalKg / logsCount) : 0
  const averageEfficiency = logsCount > 0 
    ? (logs.reduce((acc, log) => acc + Number(log.efficiency_score), 0) / logsCount) 
    : 100

  // Category breakdown
  const categoryCounts = logs.reduce((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + 1
    return acc
  }, {})

  const categoryEmissions = logs.reduce((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + Number(log.calculated_kg)
    return acc
  }, {})

  const categories = ['transportation', 'diet', 'utilities', 'consumption', 'mixed']
  const categoryColors = {
    transportation: '#0ea5e9', // sky-500
    diet: '#10b981',           // emerald-500
    utilities: '#d97706',      // amber-600
    consumption: '#ec4899',    // pink-500
    mixed: '#8b5cf6'           // violet-500
  }

  // Handle Journal Submission
  const handleLogSubmit = async (e) => {
    e?.preventDefault()
    if (!journalText.trim()) return

    setSubmitting(true)
    setCurrentStepIndex(0)
    
    // Premium loading sequence states
    const steps = [
      'Establishing secure handshake with sync nodes...',
      'Isolating text linguistic carbon vectors...',
      'Calculating molecular CO2 emission coefficients...',
      'Synchronizing logs to Supabase ledger database...'
    ]
    setSyncSteps(steps)

    // Run animation cycles for loading steps
    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i)
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400))
    }

    try {
      // 1. Calculate score client-side (or fetch from edge function if available)
      const calculation = analyzeJournalEntry(journalText)
      
      const newLog = {
        user_id: user.id,
        raw_text: journalText,
        calculated_kg: calculation.calculated_kg,
        efficiency_score: calculation.efficiency_score,
        category: calculation.category,
        suggestions: calculation.suggestions,
        created_at: new Date().toISOString()
      }

      if (dbConfigStatus === 'connected') {
        // Save to real Supabase database
        const { data, error } = await supabase
          .from('journal_logs')
          .insert([newLog])
          .select()
        
        if (error) throw error
        if (data && data[0]) {
          setLogs(prev => [data[0], ...prev])
        }
      } else {
        // Fallback: Save to localStorage
        const finalMockLog = {
          log_id: `mock-${Date.now()}`,
          ...newLog
        }
        const updatedLogs = [finalMockLog, ...logs]
        setLogs(updatedLogs)
        localStorage.setItem(`eco_logs_${user.id}`, JSON.stringify(updatedLogs))
      }

      // Check for badge update based on total logs and average efficiency
      await checkAndUpdateBadge(logsCount + 1, (averageEfficiency + calculation.efficiency_score) / (logsCount + 1))

      setJournalText('')
      setShowMobileEntrySheet(false)
    } catch (err) {
      console.error('Error submitting log:', err)
      alert('Failed to synchronize log: ' + err.message)
    } finally {
      setSubmitting(false)
      setCurrentStepIndex(-1)
    }
  }

  // Handle deleting entry
  const handleDeleteLog = async (logId) => {
    if (!confirm('Are you sure you want to delete this log entry?')) return

    try {
      if (dbConfigStatus === 'connected' && !String(logId).startsWith('mock-')) {
        const { error } = await supabase
          .from('journal_logs')
          .delete()
          .eq('log_id', logId)
        
        if (error) throw error
        setLogs(prev => prev.filter(log => log.log_id !== logId))
      } else {
        const updatedLogs = logs.filter(log => log.log_id !== logId)
        setLogs(updatedLogs)
        localStorage.setItem(`eco_logs_${user.id}`, JSON.stringify(updatedLogs))
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  // Badge Status check
  const checkAndUpdateBadge = async (count, avgEff) => {
    if (!profile) return

    let nextBadge = 'Seedling'
    if (count >= 15 && avgEff >= 85) nextBadge = 'Forest Guardian'
    else if (count >= 8 && avgEff >= 70) nextBadge = 'Sapling'
    else if (count >= 3) nextBadge = 'Sprout'

    if (profile.badge_status !== nextBadge) {
      if (dbConfigStatus === 'connected') {
        const { error } = await supabase
          .from('profiles')
          .update({ badge_status: nextBadge })
          .eq('id', user.id)
        
        if (!error) {
          setProfile(prev => ({ ...prev, badge_status: nextBadge }))
        }
      } else {
        setProfile(prev => ({ ...prev, badge_status: nextBadge }))
      }
    }
  }

  // Get category icon
  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'transportation': return <Car className="w-4 h-4 text-sky-500" />
      case 'diet': return <Utensils className="w-4 h-4 text-emerald-600" />
      case 'utilities': return <Zap className="w-4 h-4 text-amber-600" />
      case 'consumption': return <ShoppingBag className="w-4 h-4 text-pink-500" />
      default: return <Layers className="w-4 h-4 text-violet-500" />
    }
  }

  // Get badge icon / style
  const getBadgeConfig = (badge) => {
    switch (badge) {
      case 'Forest Guardian':
        return { label: 'Forest Guardian', style: 'from-emerald-600 to-green-500 text-white', icon: <Globe className="w-4 h-4" /> }
      case 'Sapling':
        return { label: 'Sapling', style: 'from-green-500 to-teal-600 text-white', icon: <Award className="w-4 h-4" /> }
      case 'Sprout':
        return { label: 'Sprout', style: 'from-amber-500 to-green-500 text-slate-900', icon: <Sparkles className="w-4 h-4" /> }
      default:
        return { label: 'Seedling', style: 'from-slate-200 to-slate-300 text-slate-700 border border-slate-300', icon: <Leaf className="w-4 h-4" /> }
    }
  }

  const badgeConfig = getBadgeConfig(profile?.badge_status || 'Seedling')

  return (
    <div 
      className="min-h-screen relative flex flex-col pb-20 md:pb-6 overflow-x-hidden"
    >
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] glow-bg-green rounded-full pointer-events-none filter blur-3xl opacity-50" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] glow-bg-amber rounded-full pointer-events-none filter blur-3xl opacity-30" />

      {/* Cinematic overlay lines */}
      <div className="absolute inset-0 scanline opacity-[0.01] pointer-events-none" />



      {/* Main Top Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-green-100/50 px-6 py-4 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
            <Leaf className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2 font-title">
              AETHER CARBON
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-700">
                SYNC
              </span>
            </h1>
          </div>
        </div>

        {/* Beautiful Cursive Dialogue in Title Bar */}
        <div className="hidden lg:block text-center max-w-md xl:max-w-lg mx-4">
          <p className="font-cursive text-green-700 text-lg xl:text-xl font-semibold tracking-wide italic leading-snug select-none">
            "To sync with nature is to remember that we are not observers, but the ecosystem itself."
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Sync Status Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-mono">
            <div className={`w-2 h-2 rounded-full ${
              dbConfigStatus === 'connected' 
                ? 'bg-green-500 animate-pulse' 
                : dbConfigStatus === 'sandbox' 
                  ? 'bg-purple-500 animate-pulse' 
                  : 'bg-amber-500'
            }`} />
            <span className="text-slate-600 font-bold">
              {dbConfigStatus === 'connected' 
                ? 'SECURE_CLOUD_SYNC' 
                : dbConfigStatus === 'sandbox' 
                  ? 'SANDBOX_DEMO_MODE' 
                  : 'LOCAL_FALLBACK_MODE'}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 border border-slate-200/50 hover:border-slate-300/60 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
            title="Log Out"
          >
            <LogOut className="w-4 h-4 text-green-600" />
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Desktop Left Sidebar: Profile & Quick Stats */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          {/* Profile Card */}
          <div className="glass-panel rounded-3xl p-5 border border-green-100/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-full filter blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-green-500/20 to-green-400/10 border border-green-500/20 flex items-center justify-center text-green-700 font-bold text-lg font-title">
                {profile?.display_name?.charAt(0).toUpperCase() || 'G'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 truncate max-w-[140px] font-title">
                  {profile?.display_name || 'Eco Guardian'}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-[140px]">
                  ID: {profile?.eco_id || 'calculating...'}
                </p>
              </div>
            </div>

            {/* Badge Indicator */}
            <div className="space-y-2 mb-4">
              <label className="text-[10px] font-bold text-green-800 uppercase tracking-wider font-mono">Sync Rank</label>
              <div className={`p-3 rounded-xl bg-gradient-to-r ${badgeConfig.style} flex items-center justify-between shadow-sm`}>
                <span className="text-xs font-bold font-title flex items-center gap-1.5">
                  {badgeConfig.icon}
                  {badgeConfig.label}
                </span>
                <span className="text-[10px] font-mono opacity-90 uppercase font-bold">Verified</span>
              </div>
            </div>

            {/* Sync connection warning for missing tables */}
            {dbConfigStatus === 'missing_tables' && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-800">
                <div className="flex items-center gap-1.5 font-bold mb-1 font-mono">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  Database Schema Missing
                </div>
                <p className="leading-snug text-[11px] text-slate-600">
                  Tables `profiles` or `journal_logs` are not found. Running in local fallback cache. Click settings to view SQL schema script.
                </p>
              </div>
            )}

            {/* Sandbox mode info card */}
            {dbConfigStatus === 'sandbox' && (
              <div className="mt-4 p-3 rounded-xl bg-purple-500/5 border border-purple-500/15 text-xs text-purple-800">
                <div className="flex items-center gap-1.5 font-bold mb-1 font-mono">
                  <Terminal className="w-4 h-4 text-purple-600 shrink-0" />
                  Running Sandbox Mode
                </div>
                <p className="leading-snug text-[11px] text-slate-600">
                  Previewing without a live connection. To configure database sync, create a `.env` file in the project folder with your Supabase keys.
                </p>
              </div>
            )}
          </div>

          {/* Quick Metrics Dials */}
          <div className="glass-panel rounded-3xl p-5 border border-green-100/50 flex flex-col gap-5">
            <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider font-mono border-b border-green-100/40 pb-2">
              AGGREGATED METRICS
            </h4>

            {/* Circular Dial: Carbon Average */}
            <div className="flex flex-col items-center py-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(0,0,0,0.03)" strokeWidth="6" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="42" 
                    fill="transparent" 
                    stroke="url(#greenGlow)" 
                    strokeWidth="6" 
                    strokeDasharray={263.8} 
                    strokeDashoffset={263.8 - (263.8 * Math.min(100, (averageFootprint / 20) * 100)) / 100}
                    strokeLinecap="round" 
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="greenGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#15803d" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800 font-title tracking-tight">
                    <AnimatedCounter value={averageFootprint} />
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">Avg kg CO2</span>
                </div>
              </div>
            </div>

            {/* Simple Progress Bar: Efficiency Rating */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Ledger Efficiency</span>
                <span className="text-green-700 font-bold font-mono"><AnimatedCounter value={averageEfficiency} />%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${averageEfficiency}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Target is &lt; 10 kg daily average footprint.
              </p>
            </div>
          </div>
        </section>

        {/* Middle Area: Interactive Terminal + Feed Logs */}
        <section className="lg:col-span-6 flex flex-col gap-6">
          
          {/* Greeting Overlay (Header Panel) */}
          <div className="glass-panel rounded-3xl p-6 border border-green-100/50 relative overflow-hidden bg-white/10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full filter blur-2xl" />
            <h2 className="text-3xl font-semibold tracking-wide text-slate-800 font-cursive text-center">
              {getGreeting()}, {profile?.display_name || 'Guardian'}
            </h2>
          </div>

          {/* Form Journal Console */}
          <div className="glass-panel rounded-3xl p-5 border border-green-100/50 relative">
            <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-3 font-mono flex items-center gap-1.5">
              <Database className="w-4 h-4 text-green-600" />
              RECORD JOURNAL FOOTPRINT
            </h3>
            
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div className="relative">
                <textarea
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  placeholder="Describe your activities today... (e.g. 'I rode my bicycle to work and had a vegan salad bowl for lunch')"
                  rows="4"
                  className="w-full p-4 glass-input text-sm leading-relaxed resize-none focus:ring-1 focus:ring-green-500"
                  disabled={submitting}
                />
                
                <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500">
                  {journalText.length} chars
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs text-green-700 font-bold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                  AI parser activated
                </div>

                <button
                  type="submit"
                  disabled={submitting || !journalText.trim()}
                  className={`py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer
                    ${submitting || !journalText.trim()
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      : 'bg-green-600 text-white hover:bg-green-500 active:scale-[0.98]'
                    }`}
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      Sync Log
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Submission Terminal Progress Panel */}
            <AnimatePresence>
              {submitting && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs overflow-hidden"
                >
                  <div className="text-green-700 font-bold mb-2">RUNNING SYNC OPERATIONS:</div>
                  <div className="space-y-1.5">
                    {syncSteps.map((step, idx) => (
                      <div 
                        key={idx} 
                        className={`transition-colors duration-300 flex items-center gap-2 ${
                          idx < currentStepIndex 
                            ? 'text-green-600 font-bold' 
                            : idx === currentStepIndex 
                              ? 'text-emerald-600 font-bold' 
                              : 'text-slate-400'
                        }`}
                      >
                        {idx < currentStepIndex ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        ) : idx === currentStepIndex ? (
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                        )}
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sync History Logs */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-green-100/50 pb-3">
              <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <History className="w-4 h-4 text-green-600" />
                SYNCHRONIZED JOURNAL LOGS ({logsCount})
              </h3>
              
              <button 
                onClick={fetchData}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                title="Refresh Ledger"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingLogs ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
                <span className="text-xs text-slate-500 font-mono font-bold">Loading synchronized logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="glass-panel rounded-3xl p-10 border border-green-100/50 text-center flex flex-col items-center justify-center">
                <div className="p-3 bg-slate-50 rounded-2xl mb-4 border border-slate-200">
                  <Database className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">No Logs Synchronized</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Your carbon database is currently empty. Use the input field above to submit your first activity footprint.
                </p>
                <button 
                  onClick={() => setShowMobileEntrySheet(true)}
                  className="md:hidden mt-4 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-green-600/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Entry
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <motion.div
                      key={log.log_id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="glass-panel rounded-3xl p-5 border border-green-100/40 hover:border-green-300/60 transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Accent line on top based on efficiency */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                        log.efficiency_score >= 80 
                          ? 'from-green-500/45 to-emerald-400/45' 
                          : log.efficiency_score >= 50 
                            ? 'from-amber-500/45 to-orange-400/45' 
                            : 'from-pink-500/45 to-red-400/45'
                      }`} />

                      {/* Header log row */}
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200">
                            {getCategoryIcon(log.category)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 capitalize font-title">
                              {log.category} log
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 ml-2">
                              {new Date(log.created_at).toLocaleDateString(undefined, { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Metrics summary */}
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-800 font-mono block">
                              {log.calculated_kg} kg
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block uppercase">
                              CO2 Equivalent
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteLog(log.log_id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-200/50 mb-3 font-mono">
                        "{log.raw_text}"
                      </p>

                      {/* Suggestions list */}
                      {log.suggestions && log.suggestions.length > 0 && (
                        <div className="space-y-1.5 mt-2.5">
                          <label className="text-[9px] font-bold text-green-800 uppercase tracking-wider font-mono block">
                            SYNC MITIGATION ADVICE
                          </label>
                          <div className="flex flex-col gap-1.5">
                            {log.suggestions.map((suggestion, idx) => (
                              <div key={idx} className="flex gap-2 items-start text-[11px] text-green-800 leading-normal bg-green-500/5 border border-green-500/10 px-3 py-1.5 rounded-xl font-medium">
                                <Sparkles className="w-3 h-3 text-green-600 shrink-0 mt-0.5" />
                                <span>{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>

        {/* Desktop Right Area: SVG Analytics & SQL Schema Manual */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          
          {/* SVG Category Emission breakdown Chart */}
          <div className="glass-panel rounded-3xl p-5 border border-green-100/50">
            <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider font-mono border-b border-green-100/40 pb-2 mb-4">
              EMISSION BREAKDOWN
            </h4>

            {logsCount === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">
                Awaiting carbon entry data...
              </div>
            ) : (
              <div className="space-y-5">
                {/* Category Bars progress */}
                <div className="space-y-3">
                  {categories.map((cat) => {
                    const count = categoryCounts[cat] || 0
                    const emissions = categoryEmissions[cat] || 0
                    const percent = logsCount > 0 ? (count / logsCount) * 100 : 0
                    const emissionPercent = totalKg > 0 ? (emissions / totalKg) * 100 : 0

                    if (count === 0) return null

                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-700 font-bold capitalize flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[cat] }} />
                            {cat}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px] font-bold">
                            {emissions.toFixed(1)} kg ({Math.round(emissionPercent)}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${Math.max(5, emissionPercent)}%`, 
                              backgroundColor: categoryColors[cat] 
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 leading-normal font-mono">
                  <div className="font-bold text-green-800 mb-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-green-600" />
                    EMISSION METRIC
                  </div>
                  Our calculation scales transportation and meat consumption as primary emission catalysts.
                </div>
              </div>
            )}
          </div>

          {/* Dev Settings Panel / DB Helper Info */}
          <div className="glass-panel rounded-3xl p-5 border border-green-100/50">
            <button
              onClick={() => setShowDevSettings(!showDevSettings)}
              className="w-full flex justify-between items-center text-xs font-bold text-green-800 uppercase tracking-wider font-mono cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-green-600" />
                DATABASE & API SETUP
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showDevSettings ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showDevSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-slate-200 space-y-4 text-xs font-mono text-slate-500 overflow-hidden"
                >
                  <p className="leading-snug text-[11px]">
                    To connect to a live database, paste this SQL in the Supabase SQL editor:
                  </p>

                  <div className="relative">
                    <pre className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-[10px] text-slate-700 overflow-x-auto max-h-48 whitespace-pre leading-normal">
{`-- 1. Create Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  eco_id text unique not null,
  badge_status text default 'Seedling',
  created_at timestamp with time zone default now() not null
);

-- 2. Create Journal Logs
create table journal_logs (
  log_id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  raw_text text not null,
  calculated_kg numeric(10, 2) not null,
  efficiency_score numeric(5, 2) not null,
  category text not null,
  suggestions jsonb,
  created_at timestamp with time zone default now() not null
);

-- 3. Enable RLS
alter table profiles enable row level security;
alter table journal_logs enable row level security;

-- 4. Enable Policies
create policy "Users own profile" on profiles for all using (auth.uid() = id);
create policy "Users own logs" on journal_logs for all using (auth.uid() = user_id);`}
                    </pre>
                  </div>

                  <p className="leading-snug text-[11px]">
                    Ensure your <code className="text-green-700 font-semibold font-mono">.env</code> file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY configured.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Carbon Sync Facts & Importance Section */}
        <section className="col-span-1 lg:col-span-12 mt-8 border-t border-green-100/50 pt-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-green-500/10 rounded-lg text-green-600">
              <Leaf className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-800 font-title">
              GLOBAL CARBON LEDGER: ESSENTIAL FACTS
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-6 font-mono">
            Understanding the dynamics of emission vectors, sequestration sinks, and chemical footprints.
          </p>

          <div className="max-h-[680px] overflow-y-auto pr-3 space-y-6 max-w-4xl mx-auto w-full py-4 custom-scrollbar">
            {/* Fact 1 */}
            <TiltCard>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left Column: Image */}
                <div style={{ transform: 'translateZ(35px)' }} className="col-span-1 md:col-span-5 w-full h-44 md:h-48 rounded-2xl overflow-hidden border border-green-100/20 bg-slate-50/50">
                  <img 
                    src="/images/forest_canopy.png" 
                    alt="Forest Sequestration" 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* Right Column: Info */}
                <div className="col-span-1 md:col-span-7 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }} className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-2xl text-green-600">
                        <Trees className="w-5 h-5" />
                      </div>
                      <h4 className="text-base md:text-lg font-bold text-slate-800 font-title">
                        Forest Sequestration
                      </h4>
                    </div>
                    <p style={{ transform: 'translateZ(12px)' }} className="text-xs md:text-sm text-slate-600 leading-relaxed font-mono">
                      Deforestation and land-use changes account for nearly 10% to 15% of all global carbon dioxide emissions.
                    </p>
                  </div>
                  <div style={{ transform: 'translateZ(18px)' }} className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl text-[11px] md:text-xs text-green-700 font-semibold leading-normal font-mono">
                    <span className="font-bold block text-[9px] md:text-[10px] uppercase tracking-wider mb-0.5 text-green-800">Importance:</span>
                    Protecting tropical forest biomes is a vital natural mechanism for carbon capturing.
                  </div>
                </div>
              </div>
            </TiltCard>

            {/* Fact 2 */}
            <TiltCard>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left Column: Image */}
                <div style={{ transform: 'translateZ(35px)' }} className="col-span-1 md:col-span-5 w-full h-44 md:h-48 rounded-2xl overflow-hidden border border-green-100/20 bg-slate-50/50">
                  <img 
                    src="/images/eco_transit.png" 
                    alt="Transit Coefficients" 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* Right Column: Info */}
                <div className="col-span-1 md:col-span-7 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }} className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-2xl text-green-600">
                        <Car className="w-5 h-5" />
                      </div>
                      <h4 className="text-base md:text-lg font-bold text-slate-800 font-title">
                        Transit Coefficients
                      </h4>
                    </div>
                    <p style={{ transform: 'translateZ(12px)' }} className="text-xs md:text-sm text-slate-600 leading-relaxed font-mono">
                      A single passenger vehicle emits an average of 4.6 metric tons of CO2 annually through combustion fuels.
                    </p>
                  </div>
                  <div style={{ transform: 'translateZ(18px)' }} className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl text-[11px] md:text-xs text-green-700 font-semibold leading-normal font-mono">
                    <span className="font-bold block text-[9px] md:text-[10px] uppercase tracking-wider mb-0.5 text-green-800">Importance:</span>
                    Transitioning to active transport (cycling/walking) directly reduces commuting footprints to zero.
                  </div>
                </div>
              </div>
            </TiltCard>

            {/* Fact 3 */}
            <TiltCard>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left Column: Image */}
                <div style={{ transform: 'translateZ(35px)' }} className="col-span-1 md:col-span-5 w-full h-44 md:h-48 rounded-2xl overflow-hidden border border-green-100/20 bg-slate-50/50">
                  <img 
                    src="/images/green_diet.png" 
                    alt="Methane Sequestration" 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* Right Column: Info */}
                <div className="col-span-1 md:col-span-7 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }} className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-2xl text-green-600">
                        <Flame className="w-5 h-5" />
                      </div>
                      <h4 className="text-base md:text-lg font-bold text-slate-800 font-title">
                        Methane Sequestration
                      </h4>
                    </div>
                    <p style={{ transform: 'translateZ(12px)' }} className="text-xs md:text-sm text-slate-600 leading-relaxed font-mono">
                      Methane is over 25 times more potent than carbon dioxide at trapping heat over a 100-year cycle.
                    </p>
                  </div>
                  <div style={{ transform: 'translateZ(18px)' }} className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl text-[11px] md:text-xs text-green-700 font-semibold leading-normal font-mono">
                    <span className="font-bold block text-[9px] md:text-[10px] uppercase tracking-wider mb-0.5 text-green-800">Importance:</span>
                    Reducing red meat consumption helps minimize industrial livestock methane releases.
                  </div>
                </div>
              </div>
            </TiltCard>

            {/* Fact 4 */}
            <TiltCard>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left Column: Image */}
                <div style={{ transform: 'translateZ(35px)' }} className="col-span-1 md:col-span-5 w-full h-44 md:h-48 rounded-2xl overflow-hidden border border-green-100/20 bg-slate-50/50">
                  <img 
                    src="/images/ocean_sink.png" 
                    alt="Ocean Buffer Sinks" 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* Right Column: Info */}
                <div className="col-span-1 md:col-span-7 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }} className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-2xl text-green-600">
                        <Globe className="w-5 h-5" />
                      </div>
                      <h4 className="text-base md:text-lg font-bold text-slate-800 font-title">
                        Ocean Buffer Sinks
                      </h4>
                    </div>
                    <p style={{ transform: 'translateZ(12px)' }} className="text-xs md:text-sm text-slate-600 leading-relaxed font-mono">
                      Oceans absorb roughly 30% of human carbon dioxide, cushioning the speed of thermal greenhouse rises.
                    </p>
                  </div>
                  <div style={{ transform: 'translateZ(18px)' }} className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl text-[11px] md:text-xs text-green-700 font-semibold leading-normal font-mono">
                    <span className="font-bold block text-[9px] md:text-[10px] uppercase tracking-wider mb-0.5 text-green-800">Importance:</span>
                    Excessive carbon absorption causes ocean acidification, endangering marine calcium structures.
                  </div>
                </div>
              </div>
            </TiltCard>

            {/* Fact 5 */}
            <TiltCard>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left Column: Image */}
                <div style={{ transform: 'translateZ(35px)' }} className="col-span-1 md:col-span-5 w-full h-44 md:h-48 rounded-2xl overflow-hidden border border-green-100/20 bg-slate-50/50">
                  <img 
                    src="/images/renewable_grid.png" 
                    alt="Clean Utility Grid" 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* Right Column: Info */}
                <div className="col-span-1 md:col-span-7 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }} className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-2xl text-green-600">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h4 className="text-base md:text-lg font-bold text-slate-800 font-title">
                        Clean Utility Grid
                      </h4>
                    </div>
                    <p style={{ transform: 'translateZ(12px)' }} className="text-xs md:text-sm text-slate-600 leading-relaxed font-mono">
                      Wind and solar grids generate over 90% fewer carbon emissions across their lifecycle than fossil fuels.
                    </p>
                  </div>
                  <div style={{ transform: 'translateZ(18px)' }} className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl text-[11px] md:text-xs text-green-700 font-semibold leading-normal font-mono">
                    <span className="font-bold block text-[9px] md:text-[10px] uppercase tracking-wider mb-0.5 text-green-800">Importance:</span>
                    Transitioning utility billing to renewable programs cuts building emission factors.
                  </div>
                </div>
              </div>
            </TiltCard>

            {/* Fact 6 */}
            <TiltCard>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left Column: Image */}
                <div style={{ transform: 'translateZ(35px)' }} className="col-span-1 md:col-span-5 w-full h-44 md:h-48 rounded-2xl overflow-hidden border border-green-100/20 bg-slate-50/50">
                  <img 
                    src="/images/soil_growth.png" 
                    alt="Soil Sequestration" 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* Right Column: Info */}
                <div className="col-span-1 md:col-span-7 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }} className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-2xl text-green-600">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h4 className="text-base md:text-lg font-bold text-slate-800 font-title">
                        Soil Sequestration
                      </h4>
                    </div>
                    <p style={{ transform: 'translateZ(12px)' }} className="text-xs md:text-sm text-slate-600 leading-relaxed font-mono">
                      Earth's soil layers hold more carbon than the atmosphere and organic plant matter combined.
                    </p>
                  </div>
                  <div style={{ transform: 'translateZ(18px)' }} className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl text-[11px] md:text-xs text-green-700 font-semibold leading-normal font-mono">
                    <span className="font-bold block text-[9px] md:text-[10px] uppercase tracking-wider mb-0.5 text-green-800">Importance:</span>
                    Regenerative farming and composting lock carbon into ground minerals rather than venting it.
                  </div>
                </div>
              </div>
            </TiltCard>

            {/* Fact 7 */}
            <TiltCard>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left Column: Image */}
                <div style={{ transform: 'translateZ(35px)' }} className="col-span-1 md:col-span-5 w-full h-44 md:h-48 rounded-2xl overflow-hidden border border-green-100/20 bg-slate-50/50">
                  <img 
                    src="/images/eco_hardware.png" 
                    alt="Supply-Chain Loads" 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* Right Column: Info */}
                <div className="col-span-1 md:col-span-7 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }} className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-2xl text-green-600">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <h4 className="text-base md:text-lg font-bold text-slate-800 font-title">
                        Supply-Chain Loads
                      </h4>
                    </div>
                    <p style={{ transform: 'translateZ(12px)' }} className="text-xs md:text-sm text-slate-600 leading-relaxed font-mono">
                      Manufacturing new consumer hardware accounts for 80% of their total lifecycle carbon footprint.
                    </p>
                  </div>
                  <div style={{ transform: 'translateZ(18px)' }} className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl text-[11px] md:text-xs text-green-700 font-semibold leading-normal font-mono">
                    <span className="font-bold block text-[9px] md:text-[10px] uppercase tracking-wider mb-0.5 text-green-800">Importance:</span>
                    Reusing devices, repairs, and second-hand purchases bypasses manufacturing emissions.
                  </div>
                </div>
              </div>
            </TiltCard>

            {/* Fact 8 */}
            <TiltCard>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left Column: Image */}
                <div style={{ transform: 'translateZ(35px)' }} className="col-span-1 md:col-span-5 w-full h-44 md:h-48 rounded-2xl overflow-hidden border border-green-100/20 bg-slate-50/50">
                  <img 
                    src="/images/climate_globe.png" 
                    alt="Greenhouse Budgets" 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* Right Column: Info */}
                <div className="col-span-1 md:col-span-7 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }} className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-2xl text-green-600">
                        <Info className="w-5 h-5" />
                      </div>
                      <h4 className="text-base md:text-lg font-bold text-slate-800 font-title">
                        Greenhouse Budgets
                      </h4>
                    </div>
                    <p style={{ transform: 'translateZ(12px)' }} className="text-xs md:text-sm text-slate-600 leading-relaxed font-mono">
                      Average surface temperatures have already risen by 1.1°C since industrial carbon expansion.
                    </p>
                  </div>
                  <div style={{ transform: 'translateZ(18px)' }} className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl text-[11px] md:text-xs text-green-700 font-semibold leading-normal font-mono">
                    <span className="font-bold block text-[9px] md:text-[10px] uppercase tracking-wider mb-0.5 text-green-800">Importance:</span>
                    Keeping warming below the 1.5°C threshold requires a global carbon emission cut of 45% by 2030.
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </section>

      </main>

      {/* Mobile-Only Navigation Sticky Bottom Menu */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-green-100/50 px-6 py-2 flex justify-around items-center bg-white/30 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'feed' ? 'text-green-600 font-bold' : 'text-slate-400'}`}
        >
          <History className="w-5 h-5" />
          <span className="text-[9px] font-medium">Ledger Feed</span>
        </button>

        {/* Center Floating Plus trigger */}
        <button
          onClick={() => setShowMobileEntrySheet(true)}
          className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center -translate-y-4 shadow-lg shadow-green-600/20 border border-white active:scale-[0.95] transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'analytics' ? 'text-green-600 font-bold' : 'text-slate-400'}`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[9px] font-medium">Analytics</span>
        </button>
      </footer>

      {/* Mobile-Only Dashboard Subsections depending on Tab state */}
      <div className="md:hidden px-4 py-2 relative z-20 flex-1 flex flex-col gap-6">
        {activeTab === 'analytics' && (
          <div className="glass-panel rounded-3xl p-5 border border-green-100/50 mb-8 mt-2">
            <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider font-mono border-b border-green-100/40 pb-2 mb-4">
              EMISSION BREAKDOWN
            </h4>
            {logsCount === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">
                Awaiting carbon entry data...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-around items-center mb-6 py-2">
                  <div className="text-center">
                    <span className="text-2xl font-black text-slate-800 block"><AnimatedCounter value={averageFootprint} /></span>
                    <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider font-bold">Avg kg CO2</span>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-black text-green-600 block"><AnimatedCounter value={averageEfficiency} />%</span>
                    <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider font-bold">Ledger Efficiency</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {categories.map((cat) => {
                    const count = categoryCounts[cat] || 0
                    const emissions = categoryEmissions[cat] || 0
                    const emissionPercent = totalKg > 0 ? (emissions / totalKg) * 100 : 0

                    if (count === 0) return null

                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-700 font-bold capitalize flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[cat] }} />
                            {cat}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px] font-bold">
                            {emissions.toFixed(1)} kg ({Math.round(emissionPercent)}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${Math.max(5, emissionPercent)}%`, 
                              backgroundColor: categoryColors[cat] 
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile-Only Slide-Up Bottom Sheet for New Journal Entry */}
      <AnimatePresence>
        {showMobileEntrySheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileEntrySheet(false)}
              className="md:hidden fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel rounded-t-[32px] border-t border-green-100 p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2" />
              
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Database className="w-4 h-4 text-green-600" />
                RECORD JOURNAL FOOTPRINT
              </h3>

              <form onSubmit={handleLogSubmit} className="space-y-4">
                <textarea
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  placeholder="Describe your activities today... (e.g. 'I rode the train to work, ate a vegetarian salad, and didn't use any heating')"
                  rows="4"
                  className="w-full p-4 glass-input text-sm leading-relaxed resize-none focus:ring-1 focus:ring-green-500"
                  disabled={submitting}
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {journalText.length} chars
                  </span>
                  
                  <button
                    type="submit"
                    disabled={submitting || !journalText.trim()}
                    className={`py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all
                      ${submitting || !journalText.trim()
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                        : 'bg-green-600 text-white hover:bg-green-500 active:scale-[0.98]'
                      }`}
                  >
                    {submitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        Sync Log
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Progress log in bottom sheet */}
              {submitting && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px]">
                  <div className="text-green-700 font-bold mb-2">RUNNING SYNC OPERATIONS:</div>
                  <div className="space-y-1.5">
                    {syncSteps.map((step, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-2 ${
                          idx < currentStepIndex 
                            ? 'text-green-600 font-bold' 
                            : idx === currentStepIndex 
                              ? 'text-emerald-600 font-bold' 
                              : 'text-slate-400'
                        }`}
                      >
                        {idx < currentStepIndex ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        ) : idx === currentStepIndex ? (
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                        )}
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
