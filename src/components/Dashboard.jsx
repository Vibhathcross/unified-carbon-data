import React, { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { analyzeJournalEntry, analyzeJournalEntryAsync, defaultSettings, OLD_DEFAULT_SYSTEM_PROMPT } from '../utils/carbonAnalyzer'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { 
  LogOut, Plus, Trash2, History, BarChart3, User, Award, Download, Printer, X,
  Sparkles, RefreshCw, Send, Calendar, ChevronRight, Info, 
  Settings, Database, Leaf, Car, Utensils, Zap, ShoppingBag, 
  Layers, Globe, CheckCircle2, ShieldAlert, Terminal, Flame, Trees,
  XCircle, AlertTriangle, Compass, BookOpen, HelpCircle, Check,
  ArrowRight, Activity, Menu
} from 'lucide-react'
import { toPng } from 'html-to-image'


// Popular models catalog for each supported LLM provider
const providerModels = {
  groq: [
    { value: 'llama-3.3-70b-specdec', label: 'Llama 3.3 70B SpecDec' },
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Versatile)' },
    { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Instant)' },
    { value: 'llama3-70b-8192', label: 'Llama 3 70B' },
    { value: 'llama3-8b-8192', label: 'Llama 3 8B' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    { value: 'gemma2-9b-it', label: 'Gemma 2 9B' }
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'o1-mini', label: 'o1 Mini' },
    { value: 'o1-preview', label: 'o1 Preview' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ],
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }
  ],
  openrouter: [
    { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
    { value: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B' },
    { value: 'meta-llama/llama-3-8b-instruct:free', label: 'Llama 3 8B (Free)' },
    { value: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (Free)' },
    { value: 'google/gemini-flash-1.5', label: 'Gemini 1.5 Flash' },
    { value: 'google/gemini-pro-1.5', label: 'Gemini 1.5 Pro' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku' },
    { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat V3 / R1' },
    { value: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (Free)' }
  ],
  claude: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
  ],
  ollama: [
    { value: 'llama3.3', label: 'Llama 3.3' },
    { value: 'llama3.2', label: 'Llama 3.2' },
    { value: 'llama3.1', label: 'Llama 3.1' },
    { value: 'llama3', label: 'Llama 3' },
    { value: 'deepseek-r1', label: 'DeepSeek R1' },
    { value: 'qwen2.5', label: 'Qwen 2.5' },
    { value: 'gemma2', label: 'Gemma 2' },
    { value: 'mistral', label: 'Mistral' },
    { value: 'phi3', label: 'Phi 3' }
  ]
}

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

const getThemeProps = (score) => {
  if (score === null || score === undefined || isNaN(score)) {
    return {
      accent: 'slate',
      label: '⚪ No Carbon Data',
      bgGrad: 'from-slate-500/[0.03] to-slate-500/[0.01]',
      border: 'border-slate-300/20 hover:border-slate-300/40',
      text: 'text-slate-600',
      badge: 'bg-slate-100 text-slate-600 border-slate-200/50',
      glow: 'shadow-slate-500/5',
      glowColor: 'bg-slate-400',
      barColor: 'bg-slate-400',
      motivationBg: 'from-slate-800 to-slate-900',
      accentLight: '#94a3b8'
    }
  }
  const normScore = score <= 10 ? score * 10 : score;
  if (normScore >= 80) {
    return {
      accent: 'emerald',
      label: '🌿 Pristine Leaf',
      bgGrad: 'from-emerald-500/[0.04] to-emerald-500/[0.01]',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      text: 'text-emerald-700',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
      glow: 'shadow-emerald-500/5',
      glowColor: 'bg-emerald-500',
      barColor: 'bg-emerald-500',
      motivationBg: 'from-slate-800 to-emerald-950',
      accentLight: '#10b981'
    }
  } else if (score >= 50) {
    return {
      accent: 'amber',
      label: '⚡ Moderate Impact',
      bgGrad: 'from-amber-500/[0.04] to-amber-500/[0.01]',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      text: 'text-amber-700',
      badge: 'bg-amber-50 text-amber-700 border-amber-200/50',
      glow: 'shadow-amber-500/5',
      glowColor: 'bg-amber-500',
      barColor: 'bg-amber-500',
      motivationBg: 'from-slate-800 to-amber-950',
      accentLight: '#f59e0b'
    }
  } else {
    return {
      accent: 'rose',
      label: '🔥 Carbon Alert',
      bgGrad: 'from-rose-500/[0.04] to-rose-500/[0.01]',
      border: 'border-rose-500/20 hover:border-rose-500/40',
      text: 'text-rose-700',
      badge: 'bg-rose-50 text-rose-700 border-rose-200/50',
      glow: 'shadow-rose-500/5',
      glowColor: 'bg-rose-500',
      barColor: 'bg-rose-500',
      motivationBg: 'from-slate-800 to-rose-950',
      accentLight: '#f43f5e'
    }
  }
}

export default function Dashboard({ 
  user, 
  onLogout, 
  adminConfig = null, 
  appSettings = null, 
  onSettingsUpdate = null,
  onSettingsApplied = null
}) {
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
  const [dbConfigStatus, setDbConfigStatus] = useState('unknown') // 'connected', 'fallback', 'missing_tables', 'sandbox'

  // Admin Config Panel States
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const profileDropdownRef = useRef(null)
  const [showMobileMenuDropdown, setShowMobileMenuDropdown] = useState(false)
  const mobileMenuDropdownRef = useRef(null)
  const [avatarImg, setAvatarImg] = useState('')
  const [modelsError, setModelsError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [llmProvider, setLlmProvider] = useState('openrouter')
  const [llmApiKey, setLlmApiKey] = useState('')
  const [llmBaseUrl, setLlmBaseUrl] = useState('')
  const [llmModel, setLlmModel] = useState('llama-3.1-8b-instant')
  const [llmSystemPrompt, setLlmSystemPrompt] = useState('')
  const [showProfileTooltip, setShowProfileTooltip] = useState(false)
  const [showAnalyticsTooltip, setShowAnalyticsTooltip] = useState(false)
  const [showLogTooltip, setShowLogTooltip] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)

  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsStatus, setSettingsStatus] = useState('')
  const [dynamicModels, setDynamicModels] = useState([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testingKey, setTestingKey] = useState(false)
  const [keyTestResult, setKeyTestResult] = useState(null) // null | 'ok' | 'fail'

  // Submitting Q&A Answers state
  const [submittingAnswers, setSubmittingAnswers] = useState({})

  // Active in-progress conversation state for new entries
  const [activeConversation, setActiveConversation] = useState(null)
  const [activeAnswerText, setActiveAnswerText] = useState('')
  const [submittingConversation, setSubmittingConversation] = useState(false)

  // Profile & Mobile Menu dropdown click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
      if (mobileMenuDropdownRef.current && !mobileMenuDropdownRef.current.contains(event.target)) {
        setShowMobileMenuDropdown(false)
      }
      if (!event.target.closest('.info-tooltip-trigger')) {
        setShowProfileTooltip(false)
        setShowAnalyticsTooltip(false)
        setShowLogTooltip(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Avatar is loaded from profile.avatar_url when fetchData sets the profile
  // (no localStorage needed — Supabase Storage is the source of truth)

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Please choose an image under 2MB.')
      return
    }

    setAvatarUploading(true)
    try {
      // Upload to Supabase Storage: avatars/<user_id>/avatar.<ext>
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadErr) throw uploadErr

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      // Cache-bust the URL so the browser re-fetches the new image
      const urlWithBust = `${publicUrl}?t=${Date.now()}`
      setAvatarImg(urlWithBust)

      // Save avatar_url back to the profiles table
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
    } catch (err) {
      console.error('Avatar upload failed:', err)
      alert('Failed to upload avatar. Please try again.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const triggerFileInput = () => {
    const input = document.getElementById('avatar-file-input')
    if (input) input.click()
  }

  // Collapsible breakdowns state
  const [expandedBreakdowns, setExpandedBreakdowns] = useState({})
  
  const toggleBreakdown = (logId) => {
    setExpandedBreakdowns(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }))
  }

  // Sync state values with global config props
  useEffect(() => {
    if (appSettings) {
      let provider = appSettings.llm_provider || 'openrouter'
      if (provider === 'local') provider = 'openrouter'
      setLlmProvider(provider)
      setLlmApiKey(appSettings.llm_api_key || '')
      setLlmBaseUrl(appSettings.llm_base_url || '')
      let model = appSettings.llm_model || 'meta-llama/llama-3.3-70b-instruct'
      if (appSettings.llm_provider === 'local') model = 'meta-llama/llama-3.3-70b-instruct'
      setLlmModel(model)
      let sysPrompt = appSettings.llm_system_prompt || ''
      if (!sysPrompt || sysPrompt.trim() === '' || !sysPrompt.includes('clarifying_questions')) {
        sysPrompt = defaultSettings.llm_system_prompt
      }
      setLlmSystemPrompt(sysPrompt)

      // Seed initial models list with current model
      const staticList = providerModels[provider] || []
      const hasModel = staticList.some(m => m.value === model)
      const list = hasModel ? staticList : [{ value: model, label: model }, ...staticList]
      setDynamicModels(list)
    }
  }, [appSettings])

  // Fetch models dynamically when admin panel opens or provider changes
  useEffect(() => {
    if (showAdminPanel) {
      fetchProviderModels(llmProvider, llmApiKey, llmBaseUrl)
    }
  }, [showAdminPanel, llmProvider])

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSavingSettings(true)
    setSettingsStatus('')

    const updated = {
      id: 'global',
      llm_provider: llmProvider,
      llm_api_key: llmApiKey,
      llm_base_url: llmBaseUrl,
      llm_model: llmModel,
      llm_system_prompt: llmSystemPrompt,
      updated_at: new Date().toISOString()
    }

    // Apply to App state immediately (optimistic update — UI stays responsive)
    if (onSettingsApplied) onSettingsApplied(updated)

    // Save to Supabase — single source of truth, no local fallback
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert([updated])

      if (error) {
        console.error('Supabase settings upsert failed:', error)
        setSettingsStatus('✗ Failed to save — check DB connection')
      } else {
        setSettingsStatus('✓ Saved & synced to all users!')
      }
    } catch (err) {
      console.error('Supabase unreachable:', err)
      setSettingsStatus('✗ Failed to save — Supabase unreachable')
    } finally {
      setSavingSettings(false)
      setTimeout(() => setSettingsStatus(''), 4000)
    }
  }
  // Fetch models dynamically from selected provider API (with proxy fallback to bypass browser CORS)
  const fetchProviderModels = async (provider, apiKey, baseUrl) => {
    if (provider === 'local') {
      setDynamicModels([])
      return
    }
    
    const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    setLoadingModels(true)
    setModelsError('')
    try {
      if (provider === 'openrouter') {
        const res = await fetch('https://openrouter.ai/api/v1/models')
        if (!res.ok) throw new Error('Failed to fetch OpenRouter models')
        const data = await res.json()
        if (data && Array.isArray(data.data)) {
          const models = data.data.map(m => ({
            value: m.id,
            label: m.name || m.id
          }))
          models.sort((a, b) => a.label.localeCompare(b.label))
          if (llmModel && !models.some(m => m.value === llmModel)) {
            models.unshift({ value: llmModel, label: llmModel })
          }
          setDynamicModels(models)
          return
        }
      } else if (provider === 'ollama') {
        const url = baseUrl || 'http://localhost:11434'
        const res = await fetch(`${url}/api/tags`)
        if (!res.ok) throw new Error('Failed to fetch Ollama models')
        const data = await res.json()
        if (data && Array.isArray(data.models)) {
          const models = data.models.map(m => ({
            value: m.name,
            label: m.name
          }))
          if (llmModel && !models.some(m => m.value === llmModel)) {
            models.unshift({ value: llmModel, label: llmModel })
          }
          setDynamicModels(models)
          return
        }
      } else if (provider === 'groq') {
        // 1. Direct fetch attempt
        try {
          if (apiKey) {
            const url = baseUrl || (isDev ? '/api-proxy/groq/openai/v1/models' : 'https://api.groq.com/openai/v1/models')
            const res = await fetch(url, {
              headers: { 'Authorization': `Bearer ${apiKey}` }
            })
            if (res.ok) {
              const data = await res.json()
              if (data && Array.isArray(data.data)) {
                const models = data.data.map(m => ({ value: m.id, label: m.id }))
                if (llmModel && !models.some(m => m.value === llmModel)) {
                  models.unshift({ value: llmModel, label: llmModel })
                }
                setDynamicModels(models)
                return
              }
            }
          }
        } catch (e) {
          console.warn('Groq direct fetch failed (likely CORS), trying OpenRouter fallback...', e)
        }

        // 2. OpenRouter cross-reference proxy fallback
        try {
          const res = await fetch('https://openrouter.ai/api/v1/models')
          if (res.ok) {
            const data = await res.json()
            if (data && Array.isArray(data.data)) {
              const groqSuffixes = [
                'llama-3.3-70b-specdec',
                'llama-3.3-70b-versatile',
                'llama-3.1-70b-versatile',
                'llama-3.1-8b-instant',
                'llama3-70b-8192',
                'llama3-8b-8192',
                'mixtral-8x7b-32768',
                'gemma2-9b-it',
                'deepseek-r1-distill-llama-70b',
                'deepseek-r1-distill-qwen-32b',
                'llama-3.2-1b-preview',
                'llama-3.2-3b-preview',
                'llama-3.2-11b-vision-preview',
                'llama-3.2-90b-vision-preview'
              ]
              const models = data.data
                .map(m => {
                  const cleanId = m.id.replace(/^~/, '')
                  const parts = cleanId.split('/')
                  const suffix = parts[parts.length - 1]
                  return { value: suffix, label: m.name || suffix }
                })
                .filter(m => groqSuffixes.includes(m.value))
              
              if (models.length > 0) {
                const unique = Array.from(new Map(models.map(item => [item.value, item])).values())
                unique.sort((a, b) => a.label.localeCompare(b.label))
                if (llmModel && !unique.some(m => m.value === llmModel)) {
                  unique.unshift({ value: llmModel, label: llmModel })
                }
                setDynamicModels(unique)
                return
              }
            }
          }
        } catch (e) {
          console.warn('OpenRouter fallback failed for Groq:', e)
        }
      } else if (provider === 'openai') {
        // 1. Direct fetch attempt
        try {
          if (apiKey) {
            const url = baseUrl || (isDev ? '/api-proxy/openai/v1/models' : 'https://api.openai.com/v1/models')
            const res = await fetch(url, {
              headers: { 'Authorization': `Bearer ${apiKey}` }
            })
            if (res.ok) {
              const data = await res.json()
              if (data && Array.isArray(data.data)) {
                const models = data.data
                  .filter(m => m.id.startsWith('gpt') || m.id.startsWith('o1') || m.id.startsWith('o3'))
                  .map(m => ({ value: m.id, label: m.id }))
                if (models.length > 0) {
                  if (llmModel && !models.some(m => m.value === llmModel)) {
                    models.unshift({ value: llmModel, label: llmModel })
                  }
                  setDynamicModels(models)
                  return
                }
              }
            }
          }
        } catch (e) {
          console.warn('OpenAI direct fetch failed (likely CORS), trying OpenRouter fallback...', e)
        }

        // 2. OpenRouter cross-reference proxy fallback
        try {
          const res = await fetch('https://openrouter.ai/api/v1/models')
          if (res.ok) {
            const data = await res.json()
            if (data && Array.isArray(data.data)) {
              const models = data.data
                .filter(m => {
                  const cleanId = m.id.replace(/^~/, '')
                  return cleanId.startsWith('openai/')
                })
                .map(m => {
                  const cleanId = m.id.replace(/^~/, '')
                  const rawId = cleanId.replace('openai/', '')
                  return { value: rawId, label: m.name ? m.name.replace('OpenAI: ', '') : rawId }
                })
              if (models.length > 0) {
                models.sort((a, b) => a.label.localeCompare(b.label))
                if (llmModel && !models.some(m => m.value === llmModel)) {
                  models.unshift({ value: llmModel, label: llmModel })
                }
                setDynamicModels(models)
                return
              }
            }
          }
        } catch (e) {
          console.warn('OpenRouter fallback failed for OpenAI:', e)
        }
      } else if (provider === 'gemini') {
        // 1. Direct fetch attempt
        try {
          if (apiKey) {
            const geminiBase = baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models'
            const url = geminiBase.includes('?') ? `${geminiBase}&key=${apiKey}` : `${geminiBase}?key=${apiKey}`
            const res = await fetch(url)
            if (res.ok) {
              const data = await res.json()
              if (data && Array.isArray(data.models)) {
                const models = data.models
                  .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
                  .map(m => {
                    const name = m.name.startsWith('models/') ? m.name.replace('models/', '') : m.name
                    return { value: name, label: m.displayName || name }
                  })
                if (models.length > 0) {
                  if (llmModel && !models.some(m => m.value === llmModel)) {
                    models.unshift({ value: llmModel, label: llmModel })
                  }
                  setDynamicModels(models)
                  return
                }
              }
            }
          }
        } catch (e) {
          console.warn('Gemini direct fetch failed, trying OpenRouter fallback...', e)
        }

        // 2. OpenRouter cross-reference proxy fallback
        try {
          const res = await fetch('https://openrouter.ai/api/v1/models')
          if (res.ok) {
            const data = await res.json()
            if (data && Array.isArray(data.data)) {
              const models = data.data
                .filter(m => {
                  const cleanId = m.id.replace(/^~/, '')
                  return cleanId.startsWith('google/') && cleanId.includes('gemini')
                })
                .map(m => {
                  const cleanId = m.id.replace(/^~/, '')
                  const rawId = cleanId.replace('google/', '')
                  return { value: rawId, label: m.name ? m.name.replace('Google: ', '') : rawId }
                })
              if (models.length > 0) {
                models.sort((a, b) => a.label.localeCompare(b.label))
                if (llmModel && !models.some(m => m.value === llmModel)) {
                  models.unshift({ value: llmModel, label: llmModel })
                }
                setDynamicModels(models)
                return
              }
            }
          }
        } catch (e) {
          console.warn('OpenRouter fallback failed for Gemini:', e)
        }
      } else if (provider === 'claude') {
        // 1. Direct fetch attempt
        try {
          if (apiKey) {
            const url = baseUrl || (isDev ? '/api-proxy/anthropic/v1/models' : 'https://api.anthropic.com/v1/models')
            const res = await fetch(url, {
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'dangerouslyAllowBrowser': 'true'
              }
            })
            if (res.ok) {
              const data = await res.json()
              if (data && Array.isArray(data.data)) {
                const models = data.data.map(m => ({ value: m.id, label: m.display_name || m.id }))
                if (models.length > 0) {
                  if (llmModel && !models.some(m => m.value === llmModel)) {
                    models.unshift({ value: llmModel, label: llmModel })
                  }
                  setDynamicModels(models)
                  return
                }
              }
            }
          }
        } catch (e) {
          console.warn('Claude direct fetch failed (likely CORS), trying OpenRouter fallback...', e)
        }

        // 2. OpenRouter cross-reference proxy fallback
        try {
          const res = await fetch('https://openrouter.ai/api/v1/models')
          if (res.ok) {
            const data = await res.json()
            if (data && Array.isArray(data.data)) {
              const models = data.data
                .filter(m => {
                  const cleanId = m.id.replace(/^~/, '')
                  return cleanId.startsWith('anthropic/')
                })
                .map(m => {
                  const cleanId = m.id.replace(/^~/, '')
                  const rawId = cleanId.replace('anthropic/', '')
                  // Map OpenRouter specific Claude names to official Anthropic model IDs (dashes instead of dots)
                  let officialId = rawId.replace(/\./g, '-')
                  if (officialId === 'claude-3-5-sonnet') officialId = 'claude-3-5-sonnet-latest'
                  if (officialId === 'claude-3-5-haiku') officialId = 'claude-3-5-haiku-latest'
                  if (officialId === 'claude-3-opus') officialId = 'claude-3-opus-latest'
                  return { value: officialId, label: m.name ? m.name.replace('Anthropic: ', '') : officialId }
                })
              if (models.length > 0) {
                models.sort((a, b) => a.label.localeCompare(b.label))
                if (llmModel && !models.some(m => m.value === llmModel)) {
                  models.unshift({ value: llmModel, label: llmModel })
                }
                setDynamicModels(models)
                return
              }
            }
          }
        } catch (e) {
          console.warn('OpenRouter fallback failed for Claude:', e)
        }
      }
      
      // Fallback
      setDynamicModels(providerModels[provider] || [])
    } catch (err) {
      console.warn(`Dynamic models fetch failed for ${provider}, using static fallback:`, err)
      setModelsError(`Live API Fetch Failed: ${err.message || err}. Preset static fallbacks loaded.`)
      setDynamicModels(providerModels[provider] || [])
    } finally {
      setLoadingModels(false)
    }
  }

  const handleProviderChange = (provider) => {
    setLlmProvider(provider)
    let defaultModel = ''
    if (provider === 'groq') defaultModel = 'llama-3.3-70b-specdec'
    else if (provider === 'openai') defaultModel = 'gpt-4o-mini'
    else if (provider === 'gemini') defaultModel = 'gemini-2.5-flash'
    else if (provider === 'openrouter') defaultModel = 'meta-llama/llama-3.3-70b-instruct'
    else if (provider === 'claude') defaultModel = 'claude-3-5-sonnet-20241022'
    else if (provider === 'ollama') defaultModel = 'llama3.3'
    
    setLlmModel(defaultModel)

    // Prepopulate with static fallback models list immediately
    const staticList = providerModels[provider] || []
    const hasModel = staticList.some(m => m.value === defaultModel)
    const list = hasModel ? staticList : [{ value: defaultModel, label: defaultModel }, ...staticList]
    setDynamicModels(list)

    // Trigger background fetch
    fetchProviderModels(provider, llmApiKey, llmBaseUrl)
  }




  // Time-based Greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 16) return 'Good afternoon'
    if (hour < 19) return 'Good evening'
    return 'Good night'
  }

  // Load user profile and journal logs
  const fetchData = async () => {
    try {
      setLoadingLogs(true)
      
      const emailUser = user.email || 'sandbox@gmail.com'
      const namePart = emailUser.split('@')[0]
      
      if (user.isSandbox) {
        setDbConfigStatus('sandbox')
        const dispName = user.display_name || namePart
        setProfile({ display_name: dispName, eco_id: namePart, badge_status: 'Carbon Beginner' })
        
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
              narrative: 'Your transit and diet choices today kept emissions remarkably low. Choosing public rail instead of driving saved approximately 5.2 kg of CO2, while a plant-based lunch represents a nearly zero-carbon footprint.',
              causes: [
                { activity: 'Rail transit commute', label: 'Eco transport', kg: 0.8, impact: 'low' },
                { activity: 'Vegetarian lunch', label: 'Low-impact diet', kg: 0.6, impact: 'low' },
                { activity: 'Base home energy', label: 'Household baseline', kg: 1.0, impact: 'low' }
              ],
              suggestions: [
                {
                  title: 'Maintain active travel habits',
                  detail: 'Consistently using rail transit instead of single-passenger driving keeps your transit footprint 80% below average.',
                  steps: ['Consider walking to local errands', 'Verify tire pressures for weekend drives', 'Advocate for company transit benefits']
                },
                {
                  title: 'Explore local seasonal produce',
                  detail: 'Sourcing food locally can shave off another 5% in shipping emissions.',
                  steps: ['Visit a local farmers market', 'Check labels for country of origin', 'Try one new seasonal vegetable']
                }
              ],
              motivation: 'Sustainable choices aren\'t always the most convenient, but your commitment to taking the train and eating green shows that small daily updates aggregate to global impact. Keep up the amazing work!',
              created_at: new Date(Date.now() - 3600000 * 24).toISOString()
            },
            {
              log_id: 'mock-2',
              raw_text: 'Drove SUV to grocery shop. Purchased new cotton shirts and plastic packaging items.',
              calculated_kg: 17.5,
              efficiency_score: 12.5,
              category: 'mixed',
              narrative: 'A high-impact transit option combined with consumer goods shopping elevated your emissions today. Driving an SUV produces significant tailpipe emissions, and new garments carry heavy supply-chain footprints.',
              causes: [
                { activity: 'Driving SUV to shop', label: 'Fossil transport', kg: 9.5, impact: 'high' },
                { activity: 'New cotton shirts', label: 'Consumer goods', kg: 6.0, impact: 'high' },
                { activity: 'Plastic packaged items', label: 'Landfill waste', kg: 2.0, impact: 'medium' }
              ],
              suggestions: [
                {
                  title: 'Consolidate vehicle trips',
                  detail: 'Combining multiple errands into a single trip reduces cold-start engine inefficiencies and saves gasoline.',
                  steps: ['Plan errands along a single route', 'Carpool with family or neighbors', 'Check if items can be delivered together']
                },
                {
                  title: 'Consider circular fashion options',
                  detail: 'Extending the life of garments or buying thrifted items directly offsets energy-intensive cotton manufacturing.',
                  steps: ['Check neighborhood thrift stores', 'Donate unused clothes instead of throwing them out', 'Wash garments in cold water to preserve fiber life']
                }
              ],
              motivation: 'Every day is a fresh opportunity to reset. Acknowledging our footprint is the first step toward carbon consciousness, and building simple transit and consumption habits over time makes sustainability feel natural and empowering.',
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
        // Detect if the profiles table is actually missing or if it's just that the profile row doesn't exist
        const isTableMissing = profileErr.code === '42P01' || profileErr.message?.includes('relation "profiles" does not exist')

        if (isTableMissing) {
          setDbConfigStatus('missing_tables')
          // Set mock profile
          setProfile({ display_name: user.display_name || namePart, eco_id: namePart, badge_status: 'Carbon Beginner' })
        } else {
          // Auto-create profile if missing in public.profiles table (fallback safety)
          const randomId = namePart + '-' + Math.floor(100 + Math.random() * 900)
          const { data: newProfile, error: createProfileErr } = await supabase
            .from('profiles')
            .insert([{ id: user.id, display_name: user.display_name || namePart, eco_id: randomId, badge_status: 'Carbon Beginner' }])
            .select()
            .single()

          if (!createProfileErr && newProfile) {
            setProfile(newProfile)
            setDbConfigStatus('connected')
          } else {
            setDbConfigStatus('missing_tables')
            setProfile({ display_name: user.display_name || namePart, eco_id: namePart, badge_status: 'Carbon Beginner' })
          }
        }
      } else {
        setProfile(profileData)
        setDbConfigStatus('connected')
        // Load avatar from Supabase Storage URL stored in profile
        if (profileData.avatar_url) {
          setAvatarImg(`${profileData.avatar_url}?t=${profileData.updated_at || Date.now()}`)
        }
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
              narrative: 'Your transit and diet choices today kept emissions remarkably low. Choosing public rail instead of driving saved approximately 5.2 kg of CO2, while a plant-based lunch represents a nearly zero-carbon footprint.',
              causes: [
                { activity: 'Rail transit commute', label: 'Eco transport', kg: 0.8, impact: 'low' },
                { activity: 'Vegetarian lunch', label: 'Low-impact diet', kg: 0.6, impact: 'low' },
                { activity: 'Base home energy', label: 'Household baseline', kg: 1.0, impact: 'low' }
              ],
              suggestions: [
                {
                  title: 'Maintain active travel habits',
                  detail: 'Consistently using rail transit instead of single-passenger driving keeps your transit footprint 80% below average.',
                  steps: ['Consider walking to local errands', 'Verify tire pressures for weekend drives', 'Advocate for company transit benefits']
                },
                {
                  title: 'Explore local seasonal produce',
                  detail: 'Sourcing food locally can shave off another 5% in shipping emissions.',
                  steps: ['Visit a local farmers market', 'Check labels for country of origin', 'Try one new seasonal vegetable']
                }
              ],
              motivation: "Sustainable choices aren't always the most convenient, but your commitment to taking the train and eating green shows that small daily updates aggregate to global impact. Keep up the amazing work!",
              created_at: new Date(Date.now() - 3600000 * 24).toISOString()
            },
            {
              log_id: 'mock-2',
              raw_text: 'Drove SUV to grocery shop. Purchased new cotton shirts and plastic packaging items.',
              calculated_kg: 17.5,
              efficiency_score: 12.5,
              category: 'mixed',
              narrative: 'A high-impact transit option combined with consumer goods shopping elevated your emissions today. Driving an SUV produces significant tailpipe emissions, and new garments carry heavy supply-chain footprints.',
              causes: [
                { activity: 'Driving SUV to shop', label: 'Fossil transport', kg: 9.5, impact: 'high' },
                { activity: 'New cotton shirts', label: 'Consumer goods', kg: 6.0, impact: 'high' },
                { activity: 'Plastic packaged items', label: 'Landfill waste', kg: 2.0, impact: 'medium' }
              ],
              suggestions: [
                {
                  title: 'Consolidate vehicle trips',
                  detail: 'Combining multiple errands into a single trip reduces cold-start engine inefficiencies and saves gasoline.',
                  steps: ['Plan errands along a single route', 'Carpool with family or neighbors', 'Check if items can be delivered together']
                },
                {
                  title: 'Consider circular fashion options',
                  detail: 'Extending the life of garments or buying thrifted items directly offsets energy-intensive cotton manufacturing.',
                  steps: ['Check neighborhood thrift stores', 'Donate unused clothes instead of throwing them out', 'Wash garments in cold water to preserve fiber life']
                }
              ],
              motivation: 'Every day is a fresh opportunity to reset. Acknowledging our footprint is the first step toward carbon consciousness, and building simple transit and consumption habits over time makes sustainability feel natural and empowering.',
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

  // Helper to determine rank based on rolling average score (1.0 to 10.0)
  const getRankFromAverage = (avg) => {
    if (avg >= 9.0) return 'Eco Vanguard'
    if (avg >= 7.0) return 'Earth Guardian'
    if (avg >= 4.0) return 'Sustainability Seeker'
    return 'Carbon Beginner'
  }

  // Intraday Aggregation & Sliding Window Pre-processor
  const rollingMetrics = useMemo(() => {
    if (logs.length === 0) {
      return {
        rollingAverage: 0,
        uniqueDaysCount: 0,
        dailyLogs: [],
        averageFootprint: 0
      }
    }

    const dateBuckets = {} // { 'YYYY-MM-DD': { scoreSum: 0, scoreCount: 0, carbonSum: 0 } }
    
    logs.forEach(log => {
      if (log.calculated_kg === null || log.calculated_kg === undefined || log.efficiency_score === null || log.efficiency_score === undefined) {
        return
      }
      const dateStr = new Date(log.created_at).toISOString().split('T')[0]
      let rawScore = Number(log.efficiency_score)
      if (isNaN(rawScore)) rawScore = 5.0
      // Normalize: if score is > 10, it's out of 100. Convert to 1-10 range.
      const score = rawScore > 10 ? rawScore / 10 : rawScore
      
      const carbon = Number(log.calculated_kg || log.carbon_mass_kg || 0)
      
      if (!dateBuckets[dateStr]) {
        dateBuckets[dateStr] = { scoreSum: 0, scoreCount: 0, carbonSum: 0 }
      }
      dateBuckets[dateStr].scoreSum += score
      dateBuckets[dateStr].scoreCount += 1
      dateBuckets[dateStr].carbonSum += carbon
    })

    const dailyData = Object.keys(dateBuckets).map(dateStr => {
      const bucket = dateBuckets[dateStr]
      return {
        date: dateStr,
        avgEfficiency: bucket.scoreSum / bucket.scoreCount,
        totalCarbon: bucket.carbonSum
      }
    })

    // Sort: newest date to oldest date (descending)
    dailyData.sort((a, b) => b.date.localeCompare(a.date))

    // Sliding window cut: maximum length of 5 days
    const windowDays = dailyData.slice(0, 5)
    const uniqueDaysCount = windowDays.length

    let rollingAverage = 0
    let avgFootprint = 0

    if (uniqueDaysCount > 0) {
      const totalScore = windowDays.reduce((acc, curr) => acc + curr.avgEfficiency, 0)
      rollingAverage = totalScore / uniqueDaysCount

      const totalCarbon = windowDays.reduce((acc, curr) => acc + curr.totalCarbon, 0)
      avgFootprint = totalCarbon / uniqueDaysCount
    }

    return {
      rollingAverage: parseFloat(rollingAverage.toFixed(2)),
      uniqueDaysCount,
      dailyLogs: windowDays,
      averageFootprint: parseFloat(avgFootprint.toFixed(2))
    }
  }, [logs])

  const rollingAverage = rollingMetrics.rollingAverage
  const uniqueDaysCount = rollingMetrics.uniqueDaysCount

  // Compute metrics
  const logsCount = logs.length
  const carbonLogsCount = logs.filter(log => log.calculated_kg !== null && log.calculated_kg !== undefined).length
  const totalKg = logs.reduce((acc, log) => acc + (log.calculated_kg !== null && log.calculated_kg !== undefined ? Number(log.calculated_kg) : 0), 0)
  const averageFootprint = carbonLogsCount > 0 ? (totalKg / carbonLogsCount) : 0
  const averageEfficiency = rollingAverage * 10 // scale to 0-100% for progress rings and percentages



  // Category breakdown
  const categoryCounts = logs.reduce((acc, log) => {
    if (log.calculated_kg === null || log.calculated_kg === undefined) return acc
    acc[log.category] = (acc[log.category] || 0) + 1
    return acc
  }, {})

  const categoryEmissions = logs.reduce((acc, log) => {
    if (log.calculated_kg === null || log.calculated_kg === undefined) return acc
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

  const formatDatabaseError = (err) => {
    const msg = err?.message || String(err)
    if (msg.includes('violates not-null constraint') && (msg.includes('calculated_kg') || msg.includes('efficiency_score') || msg.includes('category'))) {
      return (
        <div className="space-y-2 text-left font-sans">
          <div className="font-bold text-rose-950">Database Schema Mismatch detected!</div>
          <div className="text-[11px] leading-relaxed text-rose-800">
            Your Supabase table columns have a <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[10px]">NOT NULL</code> constraint, which prevents logging non-carbon/irrelevant logs like "hello" (which resolve to null emissions).
          </div>
          <div className="text-[11px] font-semibold text-rose-950 mt-1">
            To resolve this, please run the following SQL statements in your Supabase SQL Editor:
          </div>
          <pre className="bg-rose-950/90 text-rose-100/90 p-3 rounded-xl text-[10.5px] font-mono select-all overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
{`alter table journal_logs alter column calculated_kg drop not null;
alter table journal_logs alter column efficiency_score drop not null;
alter table journal_logs alter column category drop not null;`}
          </pre>
        </div>
      )
    }
    return msg
  }

  // Handle Journal Submission
  const handleLogSubmit = async (e) => {
    e?.preventDefault()
    if (!journalText.trim()) return

    setSubmitting(true)
    setSubmitError('')
    
    const providerName = appSettings?.llm_provider || 'local'
    const providerLabel = providerName === 'local' ? 'Local Parser' : `${providerName.toUpperCase()} Engine`

    const steps = [
      'Establishing secure handshake with sync nodes...',
      'Analyzing activity vectors via Neural Carbon Engine...',
      'Synchronizing logs to Supabase ledger database...'
    ]
    setSyncSteps(steps)

    // Step 1: Handshake
    setCurrentStepIndex(0)
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 200))

    // Step 2: Live LLM Analysis
    setCurrentStepIndex(1)
    
    let calculation
    try {
      // appSettings is always fresh from Supabase (loaded on boot) — use it directly
      calculation = await analyzeJournalEntryAsync(journalText, appSettings)
    } catch (err) {
      console.error('Linguistic calculation exception:', err)
      setSubmitError(err.message || 'LLM connection error. Sync aborted.')
      setSubmitting(false)
      setCurrentStepIndex(-1)
      return
    }

    const hasQuestions = calculation.clarifying_questions && calculation.clarifying_questions.length > 0;

    if (hasQuestions) {
      setActiveConversation({
        originalText: journalText,
        questions: [],
        answers: [],
        turn: 1,
        currentQuestions: calculation.clarifying_questions,
        latestCalculation: calculation
      })
      setJournalText('')
      setSubmitting(false)
      setCurrentStepIndex(-1)
      return
    }

    // Step 3: Database ledger synchronization
    setCurrentStepIndex(2)
    await new Promise(resolve => setTimeout(resolve, 400))

    try {
      const conversation = {
        questions: [],
        answers: [],
        turn: 0
      };
      const serializedRawText = journalText + "\n---\n" + JSON.stringify(conversation);

      const newLog = {
        user_id: user.id,
        raw_text: serializedRawText,
        calculated_kg: calculation.calculated_kg,
        efficiency_score: calculation.efficiency_score,
        category: calculation.category || null,
        narrative: calculation.narrative || '',
        causes: calculation.causes || [],
        suggestions: calculation.suggestions || [],
        motivation: calculation.motivation || '',
        created_at: new Date().toISOString()
      }

      if (dbConfigStatus === 'connected') {
        // Save to real Supabase database — errors surface directly to the user
        const { data, error } = await supabase
          .from('journal_logs')
          .insert([newLog])
          .select()

        if (error) throw error
        if (data && data[0]) {
          setLogs(prev => [data[0], ...prev])
        }
      } else {
        // Fallback: Save to localStorage (sandbox / no-DB mode)
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
      setSubmitError(formatDatabaseError(err))
    } finally {
      setSubmitting(false)
      setCurrentStepIndex(-1)
    }
  }

  const saveFinalizedLog = async (originalText, conversationObj, calculation) => {
    const serializedRawText = originalText + "\n---\n" + JSON.stringify(conversationObj);

    const newLog = {
      user_id: user.id,
      raw_text: serializedRawText,
      calculated_kg: calculation.calculated_kg,
      efficiency_score: calculation.efficiency_score,
      category: calculation.category || null,
      narrative: calculation.narrative || '',
      causes: calculation.causes || [],
      suggestions: calculation.suggestions || [],
      motivation: calculation.motivation || '',
      created_at: new Date().toISOString()
    }

    if (dbConfigStatus === 'connected') {
      const { data, error } = await supabase
        .from('journal_logs')
        .insert([newLog])
        .select()

      if (error) throw error
      if (data && data[0]) {
        setLogs(prev => [data[0], ...prev])
      }
    } else {
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
  }

  const handleConversationSubmit = async (e) => {
    e?.preventDefault()
    if (!activeAnswerText.trim() || !activeConversation) return

    setSubmittingConversation(true)
    setSubmitError('')

    try {
      // 1. Construct conversation history text for the LLM prompt
      let historyText = ''
      for (let i = 0; i < activeConversation.questions.length; i++) {
        const q = activeConversation.questions[i] || ''
        const a = activeConversation.answers[i] || ''
        historyText += `\nAI Question ${i + 1}: ${q}\nUser Answer ${i + 1}: ${a}\n`
      }
      
      const currentQText = activeConversation.currentQuestions.join('\n')
      historyText += `\nAI Question ${activeConversation.questions.length + 1}: ${currentQText}\nUser Answer ${activeConversation.questions.length + 1}: ${activeAnswerText}\n`

      const compositePrompt = `${activeConversation.originalText}

[Conversation History]
${historyText}

Current Turn: ${activeConversation.turn + 1} of 3 (Max 3 turns. If turn is 3, you MUST set "clarifying_questions" to null or an empty array and output your final calculation.)`

      // 2. Call LLM to recalculate
      const calculation = await analyzeJournalEntryAsync(compositePrompt, appSettings)

      const hasNewQuestions = calculation.clarifying_questions && calculation.clarifying_questions.length > 0
      const isTurnLimit = activeConversation.turn >= 3

      const updatedQuestions = [...activeConversation.questions, currentQText]
      const updatedAnswers = [...activeConversation.answers, activeAnswerText]

      if (hasNewQuestions && !isTurnLimit) {
        setActiveConversation({
          originalText: activeConversation.originalText,
          questions: updatedQuestions,
          answers: updatedAnswers,
          turn: activeConversation.turn + 1,
          currentQuestions: calculation.clarifying_questions,
          latestCalculation: calculation
        })
        setActiveAnswerText('')
      } else {
        const finalConversation = {
          questions: updatedQuestions,
          answers: updatedAnswers,
          turn: activeConversation.turn
        }
        await saveFinalizedLog(activeConversation.originalText, finalConversation, calculation)
        setActiveConversation(null)
        setActiveAnswerText('')
        setShowMobileEntrySheet(false)
      }
    } catch (err) {
      console.error('Conversation recalculation failure:', err)
      setSubmitError(formatDatabaseError(err))
    } finally {
      setSubmittingConversation(false)
    }
  }

  const handleConversationSkip = async () => {
    if (!activeConversation) return
    setSubmittingConversation(true)
    setSubmitError('')

    try {
      const finalConversation = {
        questions: activeConversation.questions,
        answers: activeConversation.answers,
        turn: activeConversation.turn
      }
      await saveFinalizedLog(activeConversation.originalText, finalConversation, activeConversation.latestCalculation)
      setActiveConversation(null)
      setActiveAnswerText('')
      setShowMobileEntrySheet(false)
    } catch (err) {
      console.error('Conversation skip failure:', err)
      setSubmitError(formatDatabaseError(err))
    } finally {
      setSubmittingConversation(false)
    }
  }

  const handleConversationCancel = () => {
    if (confirm('Are you sure you want to discard this log and cancel the handshake?')) {
      setActiveConversation(null)
      setActiveAnswerText('')
      setSubmitError('')
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

  // Handle Answer Q&A clarification
  const handleAnswerClarification = async (logId, answerText) => {
    if (submittingAnswers[logId]) return

    setSubmittingAnswers(prev => ({ ...prev, [logId]: true }))

    try {
      // 1. Find the log
      const log = logs.find(l => l.log_id === logId)
      if (!log) throw new Error('Log not found')

      // 2. Parse the conversation
      let originalText = log.raw_text || ''
      let conversation = { questions: [], answers: [], turn: 0 }
      if (log.raw_text && log.raw_text.includes('\n---\n')) {
        const parts = log.raw_text.split('\n---\n')
        originalText = parts[0]
        try {
          conversation = JSON.parse(parts[1])
        } catch (e) {
          console.error('Failed to parse conversation json', e)
        }
      }

      // 3. Add the answer to conversation
      conversation.answers.push(answerText)

      // 4. Construct conversation history text for the LLM prompt
      let historyText = ''
      for (let i = 0; i < conversation.questions.length; i++) {
        const q = conversation.questions[i] || ''
        const a = conversation.answers[i] || ''
        historyText += `\nAI Question ${i + 1}: ${q}\nUser Answer ${i + 1}: ${a}\n`
      }

      const compositePrompt = `${originalText}

[Conversation History]
${historyText}

Current Turn: ${conversation.turn} of 3 (Max 3 turns. If turn is 3, you MUST set "clarifying_questions" to null or an empty array and output your final calculation.)`

      // 5. Call LLM to recalculate
      const calculation = await analyzeJournalEntryAsync(compositePrompt, appSettings)

      // 6. Check if there are new questions and if turn is < 3
      const hasNewQuestions = calculation.clarifying_questions && calculation.clarifying_questions.length > 0
      if (hasNewQuestions && conversation.turn < 3) {
        conversation.questions.push(calculation.clarifying_questions.join('\n'))
        conversation.turn += 1
      } else {
        // Conversation finalized
      }

      const updatedRawText = originalText + "\n---\n" + JSON.stringify(conversation)

      // 7. Save updated calculations back to Supabase/localStorage
      const updatedFields = {
        raw_text: updatedRawText,
        calculated_kg: calculation.calculated_kg,
        efficiency_score: calculation.efficiency_score,
        category: calculation.category || null,
        narrative: calculation.narrative || '',
        causes: calculation.causes || [],
        suggestions: calculation.suggestions || [],
        motivation: calculation.motivation || ''
      }

      let updatedRow = null
      if (dbConfigStatus === 'connected' && !String(logId).startsWith('mock-')) {
        const { data, error } = await supabase
          .from('journal_logs')
          .update(updatedFields)
          .eq('log_id', logId)
          .select()

        if (error) throw error
        if (data && data[0]) {
          updatedRow = data[0]
        }
      } else {
        // LocalStorage fallback
        updatedRow = {
          ...log,
          ...updatedFields
        }
        
        // Update local logs in localStorage
        const nextLogs = logs.map(item => item.log_id === logId ? updatedRow : item)
        localStorage.setItem(`eco_logs_${user.id}`, JSON.stringify(nextLogs))
      }

      if (updatedRow) {
        // Update local logs state
        setLogs(prev => prev.map(item => item.log_id === logId ? updatedRow : item))
      }

    } catch (err) {
      console.error('Q&A Recalculation failure:', err)
      alert(err.message || 'Failed to recalculate footprint points.')
    } finally {
      setSubmittingAnswers(prev => ({ ...prev, [logId]: false }))
    }
  }

  // Reactive Badge Status Check & Sync Hook
  useEffect(() => {
    if (!profile || logs.length === 0) return

    const nextBadge = getRankFromAverage(rollingAverage)
    if (profile.badge_status !== nextBadge) {
      const syncBadge = async () => {
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
      syncBadge()
    }
  }, [rollingAverage, profile?.id, dbConfigStatus, user.id, logs.length])

  // Deprecated: updates are handled reactively by useEffect above
  const checkAndUpdateBadge = async () => {}

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

  // Helper to generate SVG path for a starburst (used for the certificate seal)
  const getStarburstPath = (points = 36, outerRadius = 50, innerRadius = 42) => {
    let path = ''
    for (let i = 0; i < points * 2; i++) {
      const angle = (Math.PI * i) / points
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const x = 50 + Math.cos(angle) * radius
      const y = 50 + Math.sin(angle) * radius
      if (i === 0) {
        path += `M ${x} ${y}`
      } else {
        path += ` L ${x} ${y}`
      }
    }
    path += ' Z'
    return path
  }

  // Get badge icon / style
  const getBadgeConfig = (badge) => {
    switch (badge) {
      case 'Eco Vanguard':
        return { label: 'Eco Vanguard', class: 'badge-eco-vanguard text-white', icon: <Award className="w-4.5 h-4.5" /> }
      case 'Earth Guardian':
        return { label: 'Earth Guardian', class: 'badge-earth-guardian text-white', icon: <Trees className="w-4.5 h-4.5" /> }
      case 'Sustainability Seeker':
        return { label: 'Sustainability Seeker', class: 'badge-sustainability-seeker text-white', icon: <Globe className="w-4.5 h-4.5" /> }
      case 'Carbon Beginner':
      default:
        return { label: 'Carbon Beginner', class: 'badge-carbon-beginner text-yellow-950', icon: <Flame className="w-4.5 h-4.5" /> }
    }
  }

  const downloadCertificate = () => {
    const node = document.getElementById('certificate-preview-card')
    if (!node) return

    const recipientName = profile?.display_name || user?.display_name || 'Eco Guardian'

    // Capture at the card's actual rendered size — no width/height override.
    // This keeps all clamp() and vw units consistent with the card dimensions,
    // so borders, decorations and ribbon stay perfectly aligned on any device.
    // pixelRatio: 4 ensures a crisp high-resolution PNG regardless of screen size.
    toPng(node, {
      cacheBust: true,
      pixelRatio: 4,
    })
      .then((dataUrl) => {
        const link = document.createElement('a')
        link.download = `Aether_Card_${recipientName.replace(/\s+/g, '_')}.png`
        link.href = dataUrl
        link.click()
      })
      .catch((err) => {
        console.error('Error generating certificate image:', err)
      })
  }


  const rank = profile?.badge_status || getRankFromAverage(rollingAverage)
  const badgeConfig = getBadgeConfig(rank)

  const rankStyles = {
    'Eco Vanguard': {
      border: 'border-blue-400/30 bg-gradient-to-br from-blue-500/[0.04] to-blue-400/[0.01]',
      glow: 'from-blue-500/10 to-transparent',
      avatarBg: 'from-blue-500/15 to-blue-400/5 border-blue-500/20 text-blue-700',
      labelColor: 'text-blue-800',
      shadow: 'shadow-blue-500/[0.03]'
    },
    'Earth Guardian': {
      border: 'border-green-400/30 bg-gradient-to-br from-green-500/[0.04] to-green-400/[0.01]',
      glow: 'from-green-500/10 to-transparent',
      avatarBg: 'from-green-500/15 to-green-400/5 border-green-500/20 text-green-700',
      labelColor: 'text-green-800',
      shadow: 'shadow-green-500/[0.03]'
    },
    'Sustainability Seeker': {
      border: 'border-orange-400/30 bg-gradient-to-br from-orange-500/[0.04] to-orange-400/[0.01]',
      glow: 'from-orange-500/10 to-transparent',
      avatarBg: 'from-orange-500/15 to-orange-400/5 border-orange-500/20 text-orange-700',
      labelColor: 'text-orange-800',
      shadow: 'shadow-orange-500/[0.03]'
    },
    'Carbon Beginner': {
      border: 'border-yellow-400/30 bg-gradient-to-br from-yellow-500/[0.04] to-yellow-400/[0.01]',
      glow: 'from-yellow-500/10 to-transparent',
      avatarBg: 'from-yellow-500/15 to-yellow-400/5 border-yellow-500/20 text-yellow-700',
      labelColor: 'text-yellow-800',
      shadow: 'shadow-yellow-500/[0.03]'
    }
  }

  const activeRankStyle = rankStyles[rank] || rankStyles['Carbon Beginner']

  const getCertificateDescription = (badge) => {
    if (badge === 'Eco Vanguard') {
      return "for successfully demonstrating the highest order of ecological stewardship, maintaining a certified Eco Vanguard Rank, and serving as a beacon of sustainability in continuous carbon logging and sequestration."
    }
    if (badge === 'Earth Guardian') {
      return "for outstanding commitment to environmental preservation, maintaining a certified Earth Guardian Rank, and actively synchronizing daily activities to foster carbon neutrality."
    }
    if (badge === 'Sustainability Seeker') {
      return "for successfully demonstrating commitment to environmental sustainability, maintaining a certified Sustainability Seeker Rank, and continuously logging and offsetting daily carbon activity footprints."
    }
    return "for initiating their journey into carbon consciousness, maintaining a certified Carbon Beginner Rank, and taking consistent early steps towards active climate action."
  }

  const certColors = {
    'Eco Vanguard': {
      border: '#2563eb',
      doubleBorder: '#1e40af',
      text: '#1d4ed8',
      leafOpacity: 'text-blue-600/10',
      sealBg: '#1d4ed8',
      sealText: '#dbeafe',
      bgGrad: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
      goldBorder: '#3b82f6'
    },
    'Earth Guardian': {
      border: '#16a34a',
      doubleBorder: '#166534',
      text: '#15803d',
      leafOpacity: 'text-emerald-600/10',
      sealBg: '#15803d',
      sealText: '#ecfdf5',
      bgGrad: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
      goldBorder: '#16a34a'
    },
    'Sustainability Seeker': {
      border: '#ea580c',
      doubleBorder: '#7c2d12',
      text: '#c2410c',
      leafOpacity: 'text-orange-600/10',
      sealBg: '#c2410c',
      sealText: '#ffedd5',
      bgGrad: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
      goldBorder: '#f97316'
    },
    'Carbon Beginner': {
      border: '#eab308',
      doubleBorder: '#854d0e',
      text: '#ca8a04',
      leafOpacity: 'text-yellow-600/10',
      sealBg: '#ca8a04',
      sealText: '#fef9c3',
      bgGrad: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 50%, #fef08a 100%)',
      goldBorder: '#eab308'
    }
  }

  const activeCertColors = certColors[rank] || certColors['Carbon Beginner']

  return (
    <div 
      className="min-h-screen relative flex flex-col pb-20 md:pb-6 overflow-x-hidden"
    >
      {/* Floating Guide Button */}
      <button
        onClick={() => setShowGuideModal(true)}
        className="fixed top-24 left-6 z-[80] w-12 h-12 rounded-full glass-panel-interactive flex items-center justify-center border border-emerald-500/30 text-emerald-700 hover:text-emerald-800 shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
        title="Open User Guide"
      >
        <BookOpen className="w-5 h-5 animate-pulse" />
      </button>

      {/* Complete User Guide Modal */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-950/60 backdrop-blur-md">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setShowGuideModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative max-w-4xl w-full bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-2xl flex flex-col max-h-[88vh] z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 px-6 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                    <Compass className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">Aether Carbon Sync Matrix Guide</h2>
                    <p className="text-[11px] text-emerald-400/80 font-mono mt-0.5">Explore features · Learn layout · Maximize efficiency</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 font-sans">
                
                {/* Introduction */}
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100/50 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">Platform Manual</span>
                  <h3 className="text-xl font-bold text-slate-800">Welcome to Aether Carbon</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Aether Carbon is a decentralized matrix designed to log, compute, and synchronize ecological footprint metrics. It turns daily activity tracking into a gamified progression ledger backed by AI and real-time database synchronization.
                  </p>
                </div>

                {/* Grid of Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Card 1: Daily Journaling */}
                  <div className="glass-panel p-5 rounded-2xl border border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-500/10 rounded-lg">
                        <Database className="w-4 h-4 text-green-600" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Daily Journal Console</h4>
                    </div>
                    <p className="text-[11.5px] text-slate-500 leading-relaxed">
                      Describe your day in natural text. Mention commute details, dietary choices, and home utility consumption (like AC, laundry, recycling). 
                    </p>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10.5px] font-mono text-slate-500">
                      <strong className="text-slate-700 block mb-0.5">Example Entry:</strong>
                      "I rode my bicycle 5 km, ate a beef burger for lunch, and ran the AC at 24°C for 2 hours."
                    </div>
                  </div>



                  {/* Card 3: Rank & Badges */}
                  <div className="glass-panel p-5 rounded-2xl border border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-500/10 rounded-lg">
                        <Award className="w-4 h-4 text-green-600" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Progression & Certificate</h4>
                    </div>
                    <p className="text-[11.5px] text-slate-500 leading-relaxed">
                      Earn rank titles based on your 5-day efficiency averages. Unlock digital certificates of stewardship that can be generated and printed instantly.
                    </p>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10.5px]">
                      <strong className="text-slate-700 block mb-0.5">Ranks:</strong>
                      Carbon Beginner → Sustainability Seeker → Earth Guardian → Eco Vanguard.
                    </div>
                  </div>

                  {/* Card 4: Admin Config */}
                  <div className="glass-panel p-5 rounded-2xl border border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-500/10 rounded-lg">
                        <Settings className="w-4 h-4 text-green-600" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Admin Config Panel</h4>
                    </div>
                    <p className="text-[11.5px] text-slate-500 leading-relaxed">
                      Configure AI engine parameters. Switch LLM providers (Groq, OpenAI, Gemini, Claude, OpenRouter, Ollama), verify API keys, change model settings, and edit system prompt overrides.
                    </p>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10.5px] font-mono text-slate-500">
                      <strong className="text-slate-700 block mb-0.5">System Prompt Override:</strong>
                      Admins can directly edit the prompt used to analyze daily logs.
                    </div>
                  </div>

                </div>


              </div>

              {/* Footer */}
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between shrink-0 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono">Aether Carbon Matrix v1.2.0</span>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Close Guide
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] glow-bg-green rounded-full pointer-events-none filter blur-3xl opacity-50" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] glow-bg-amber rounded-full pointer-events-none filter blur-3xl opacity-30" />

      {/* Cinematic overlay lines */}
      <div className="absolute inset-0 scanline opacity-[0.01] pointer-events-none" />



      {/* Main Top Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-green-100/50 px-6 py-4 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Dropdown — ONLY visible on mobile and for admin users */}
          {adminConfig && user?.isAdmin && (
            <div className="relative md:hidden" ref={mobileMenuDropdownRef}>
              <button
                onClick={() => setShowMobileMenuDropdown(!showMobileMenuDropdown)}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border border-green-200/60 flex items-center justify-center text-green-700 cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-all select-none"
                title="Admin Menu"
              >
                <Menu className="w-5 h-5 text-green-600" />
              </button>
              
              {showMobileMenuDropdown && (
                <div className="absolute left-0 mt-3 w-48 bg-white/95 backdrop-blur-md border border-green-100/50 shadow-2xl rounded-2xl p-2.5 z-50 flex flex-col gap-1.5">
                  <button
                    onClick={() => {
                      setShowAdminPanel(true)
                      setShowMobileMenuDropdown(false)
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold font-mono text-green-700 hover:bg-green-50 flex items-center gap-2 transition-all text-left cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-green-600" />
                    <span>Admin Configs</span>
                  </button>
                  <button
                    onClick={() => {
                      onLogout()
                      setShowMobileMenuDropdown(false)
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold font-mono text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-all text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-green-600" />
                    <span>Disconnect</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Profile Dropdown Menu trigger */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border border-green-200/60 flex items-center justify-center font-black text-green-700 font-title text-base cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-all select-none overflow-hidden"
              title="View Profile & Aggregated Metrics"
            >
              {avatarImg ? (
                <img src={avatarImg} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.display_name?.charAt(0).toUpperCase() || 'G'
              )}
            </button>
            
            {showProfileDropdown && (
              <div className="absolute left-0 mt-3 w-80 bg-white/95 backdrop-blur-md border border-green-100/50 shadow-2xl rounded-3xl p-5 z-50 flex flex-col gap-5">
                {/* Profile Info */}
                <div className="flex items-center gap-4">

                  <div
                    onClick={avatarUploading ? null : triggerFileInput}
                    className={`relative group cursor-pointer w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-green-100 shadow-inner flex items-center justify-center ${avatarUploading ? 'opacity-70 cursor-wait' : ''}`}
                    title="Click to change profile picture"
                  >
                    {avatarImg ? (
                      <img src={avatarImg} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-tr ${activeRankStyle.avatarBg} flex items-center justify-center font-bold text-lg font-title`}>
                        {profile?.display_name?.charAt(0).toUpperCase() || 'G'}
                      </div>
                    )}
                    {avatarUploading ? (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-white animate-spin" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[8px] font-bold text-white select-none">
                        <Plus className="w-3.5 h-3.5" />
                        <span>EDIT</span>
                      </div>
                    )}
                  </div>
                  
                  <input 
                    type="file" 
                    id="avatar-file-input" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-800 truncate font-title">
                      {profile?.display_name || 'Eco Guardian'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                      ID: {profile?.eco_id || 'calculating...'}
                    </p>
                  </div>
                </div>

                {/* Sync Rank */}
                <div className="space-y-1.5">
                  <label className={`text-[9px] font-bold ${activeRankStyle.labelColor} uppercase tracking-wider font-mono`}>Sync Rank</label>
                  <div className={`metallic-badge ${badgeConfig.class} p-2.5 rounded-xl flex items-center justify-between shadow-md hover:scale-[1.01] transition-all duration-300`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center relative border border-white/30 shadow-inner">
                        <div className="relative z-10 scale-95 flex items-center">
                          {badgeConfig.icon}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase tracking-wider opacity-75 font-mono leading-none">Rank Status</span>
                        <span className="text-[10px] font-black tracking-tight leading-none mt-1 font-title">{badgeConfig.label}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono uppercase font-bold bg-white/25 px-1.5 py-0.5 rounded-full border border-white/25">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Aether Card button */}
                {uniqueDaysCount >= 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCertificate(true)
                      setShowProfileDropdown(false)
                    }}
                    className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-mono font-bold text-[9px] tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-100" />
                    CLAIM AETHER CARD
                  </button>
                ) : (
                  <div className="relative group">
                    <div className="w-full p-2.5 rounded-xl bg-slate-200/80 text-slate-400 font-mono font-bold text-[9px] tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-300/60 select-none">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.5a4.5 4.5 0 00-9 0v3m-1.5 0h12a1.5 1.5 0 011.5 1.5v7a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 19v-7A1.5 1.5 0 016 10.5z" />
                      </svg>
                      AETHER CARD LOCKED
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-900/95 backdrop-blur text-white text-[10px] rounded-xl px-3 py-2.5 shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 leading-relaxed text-center font-sans">
                      <div className="font-bold text-emerald-400 mb-1 font-mono text-[9px] uppercase tracking-wider">Certificate Locked</div>
                      Log your footprint for <span className="font-bold text-white">{5 - uniqueDaysCount} more day{5 - uniqueDaysCount !== 1 ? 's' : ''}</span> to unlock your Aether Card.
                      <div className="text-slate-400 mt-1 text-[9px]">({uniqueDaysCount}/5 days logged)</div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900/95" />
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 my-1" />

                {/* Aggregated Metrics */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-green-800 uppercase tracking-wider font-mono">
                    AGGREGATED METRICS
                  </h4>
                  
                  {/* Circular Dial: Carbon Average */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(0,0,0,0.03)" strokeWidth="6" />

                        <circle 
                          cx="50" 
                          cy="50" 
                          r="42" 
                          fill="transparent" 
                          stroke="url(#dropdownGreenGlow)" 
                          strokeWidth="6" 
                          strokeDasharray={263.8} 
                          strokeDashoffset={263.8 - (263.8 * Math.min(100, (averageFootprint / 20) * 100)) / 100}
                          strokeLinecap="round" 
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="dropdownGreenGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="100%" stopColor="#15803d" />
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      <div className="absolute flex flex-col items-center">
                        <span className="text-lg font-black text-slate-800 font-title tracking-tight">
                          <AnimatedCounter value={averageFootprint} />
                        </span>
                        <span className="text-[8px] text-slate-400 uppercase font-mono tracking-wider font-bold leading-none">Avg kg CO2</span>
                      </div>
                    </div>
                  </div>

                  {/* 5-Day Rolling Efficiency Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] items-center">
                      <div className="flex items-center gap-1 relative group">
                        <span className="text-slate-500">5-Day Efficiency</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowProfileTooltip(!showProfileTooltip)
                          }}
                          onMouseEnter={() => setShowProfileTooltip(true)}
                          onMouseLeave={() => setShowProfileTooltip(false)}
                          className="info-tooltip-trigger p-1 -m-1 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer focus:outline-none flex items-center justify-center shrink-0"
                          title="View Guide"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Tooltip Content */}
                        <div className={`absolute left-0 bottom-6 w-72 bg-emerald-950/95 backdrop-blur border border-emerald-500/20 text-emerald-100 rounded-2xl p-4 shadow-2xl transition-all duration-300 z-50 pointer-events-none text-xs leading-relaxed text-left ${
                          showProfileTooltip 
                            ? 'opacity-100 visible' 
                            : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                        }`}>
                          <div className="font-bold text-emerald-400 mb-1.5 font-mono tracking-wider uppercase text-[10px]">
                            5-Day Efficiency Guide
                          </div>
                          <div className="space-y-2 text-slate-300 text-[10.5px]">
                            <div>
                              <span className="font-bold text-white block mb-0.5">Calculation Method:</span>
                              <p className="leading-normal">
                                Your daily efficiency score (1.0 to 10.0) is assigned by AI based on carbon intensity. We compute the rolling average of your last 5 active days, scaled to 0-100%.
                              </p>
                            </div>
                            <div>
                              <span className="font-bold text-white block mb-0.5">Excluded Logs:</span>
                              <p className="leading-normal">
                                If a log contains no carbon-calculable activities, it is marked as non-calculable (no points/footprint) and is omitted from all averages (rather than being counted as zero).
                              </p>
                            </div>
                            <div>
                              <span className="font-bold text-white block mb-0.5">Rank Brackets:</span>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-0.5 text-[10px] font-mono">
                                <span className="text-sky-400">9.0+ : Eco Vanguard</span>
                                <span className="text-emerald-400">7.0+ : Earth Guardian</span>
                                <span className="text-orange-400">4.0+ : Sustainability Seeker</span>
                                <span className="text-yellow-400">1.0+ : Carbon Beginner</span>
                              </div>
                            </div>
                            <div>
                              <span className="font-bold text-white block mb-0.5">Strategies to Improve:</span>
                              <ul className="list-disc pl-3.5 space-y-0.5 leading-normal">
                                <li>Prefer rail, bus, or active transit over driving.</li>
                                <li>Incorporate more plant-based meals into your diet.</li>
                                <li>Lower thermostat usage & switch to LED bulbs.</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
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
                    <p className="text-[9px] text-slate-400 leading-normal text-center">
                      Target is &lt; 10 kg daily average footprint.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
            <Leaf className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 font-title">
              AETHER CARBON
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

           {/* Admin Config Dropdown Button — ONLY visible to admin device users on desktop */}
          {adminConfig && user?.isAdmin && (
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold font-mono cursor-pointer
                  ${showAdminPanel 
                    ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/10' 
                    : 'text-green-700 hover:text-green-800 bg-green-500/10 hover:bg-green-500/20 border-green-200/60'
                  }`}
              >
                <Settings className={`w-4 h-4 ${showAdminPanel ? 'animate-spin-slow' : ''}`} />
                <span>Admin Configs</span>
              </button>
            </div>
          )}

          {/* Exit Button — visible on desktop, or on mobile only for normal users */}
          <button
            onClick={onLogout}
            className={`p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 border border-slate-200/50 hover:border-slate-300/60 rounded-xl transition-all flex items-center gap-2 text-xs font-bold
              ${adminConfig && user?.isAdmin ? 'hidden md:flex' : 'flex'}`}
            title="Log Out"
          >
            <LogOut className="w-4 h-4 text-green-600" />
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 gap-6 relative z-10 grid grid-cols-1 lg:grid-cols-12">
        
        {/* Middle Area: Interactive Terminal + Feed Logs */}
        <section className="lg:col-span-12 flex flex-col gap-6">
          
          {/* Greeting Overlay (Header Panel) */}
          <div className="glass-panel rounded-3xl p-6 border border-green-100/50 relative overflow-hidden bg-white/10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full filter blur-2xl" />
            <h2 className="text-3xl font-semibold tracking-wide text-slate-800 font-cursive text-center">
              {getGreeting()}, {profile?.display_name || 'Guardian'}
            </h2>
          </div>

          {/* Form Journal Console */}
          <div className="glass-panel rounded-3xl p-5 border border-green-100/50 relative">
            <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-3 font-mono flex items-center gap-1.5 relative group">
              <Database className="w-4 h-4 text-green-600" />
              <span>RECORD JOURNAL FOOTPRINT</span>
              
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowLogTooltip(!showLogTooltip)
                  }}
                  onMouseEnter={() => setShowLogTooltip(true)}
                  onMouseLeave={() => setShowLogTooltip(false)}
                  className="info-tooltip-trigger p-1 -m-1 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer focus:outline-none flex items-center justify-center shrink-0"
                  title="View Logging Guide"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                
                {/* Tooltip Content */}
                <div className={`absolute left-0 bottom-6 w-80 bg-emerald-950/95 backdrop-blur border border-emerald-500/20 text-emerald-100 rounded-2xl p-4 shadow-2xl transition-all duration-300 z-50 pointer-events-none text-xs leading-relaxed text-left ${
                  showLogTooltip 
                    ? 'opacity-100 visible' 
                    : 'opacity-0 invisible'
                }`}>
                  <div className="font-bold text-emerald-400 mb-1.5 font-mono tracking-wider uppercase text-[10px]">
                    How to log your activities
                  </div>
                  <div className="space-y-2 text-slate-300 text-[10.5px]">
                    <div>
                      <span className="font-bold text-white block mb-0.5">What to describe:</span>
                      <p className="leading-normal">
                        Share any actions from your day that impact your carbon footprint. Mention:
                      </p>
                      <ul className="list-disc pl-3.5 mt-1 space-y-0.5 leading-normal">
                        <li><strong className="text-emerald-400">Transport:</strong> Mode (car, bus, flight, bike) and distance.</li>
                        <li><strong className="text-emerald-400">Diet:</strong> Meal types (beef, chicken, dairy, vegetarian).</li>
                        <li><strong className="text-emerald-400">Home Energy:</strong> AC use, heating, laundry.</li>
                        <li><strong className="text-emerald-400">Shopping & Waste:</strong> Major purchases, recycling.</li>
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-white block mb-0.5">Examples:</span>
                      <p className="leading-normal italic text-slate-400">
                        "I commuted 10 km by train, ate a vegetarian curry, and ran a quick laundry load."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </h3>
            
            {activeConversation ? (
              <form onSubmit={handleConversationSubmit} className="space-y-4">
                {/* Handshake Header */}
                <div className="flex items-center justify-between border-b border-green-100/50 pb-2 mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-green-800 font-mono">
                    <Activity className="w-4 h-4 text-green-600 animate-pulse" />
                    <span>AETHER HANDSHAKE — Turn {activeConversation.turn}/3</span>
                  </div>
                  <div className="text-[10px] font-bold bg-green-55 px-2 py-0.5 rounded-full text-green-700 font-mono">
                    Active Session
                  </div>
                </div>

                {/* Original Entry Display */}
                <div className="bg-slate-50/50 border border-slate-200/40 rounded-2xl p-3.5 shadow-sm">
                  <span className="font-bold text-slate-500 block text-[9px] uppercase font-mono tracking-wider mb-1">Your Journal Entry:</span>
                  <p className="text-slate-700 text-xs italic font-medium">“{activeConversation.originalText}”</p>
                </div>

                {/* Conversation History */}
                {activeConversation.answers.length > 0 && (
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {activeConversation.answers.map((ansText, qIdx) => {
                      const qText = activeConversation.questions[qIdx];
                      return (
                        <div key={qIdx} className="space-y-1 text-xs">
                          <div className="bg-white/60 border border-slate-100 p-2.5 rounded-xl">
                            <span className="font-bold text-slate-500 block text-[9px] uppercase font-mono tracking-wider mb-0.5">AI Question:</span>
                            <p className="text-slate-800 whitespace-pre-line leading-relaxed">{qText}</p>
                          </div>
                          <div className="bg-emerald-500/[0.04] border border-emerald-500/10 p-2.5 rounded-xl ml-4">
                            <span className="font-bold text-emerald-600 block text-[9px] uppercase font-mono tracking-wider mb-0.5">Your Response:</span>
                            <p className="text-slate-700 leading-relaxed">{ansText}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Current Active Clarifying Question */}
                <div className="space-y-2">
                  {activeConversation.currentQuestions.map((qText, qIdx) => (
                    <div 
                      key={qIdx} 
                      className="bg-emerald-500/[0.06] backdrop-blur-md border border-emerald-500/15 rounded-2xl p-4 transition-all duration-300 hover:bg-emerald-500/[0.1] hover:border-emerald-500/25 hover:scale-[1.005] hover:shadow-sm"
                    >
                      <span className="font-black text-emerald-700 block text-[10px] uppercase font-mono tracking-wider mb-1.5 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        AI CLARIFYING QUESTION
                      </span>
                      <p className="text-slate-800 text-[13.5px] leading-relaxed font-semibold">{qText}</p>
                    </div>
                  ))}
                </div>

                {/* Answer input */}
                <div className="relative">
                  <textarea
                    value={activeAnswerText}
                    onChange={(e) => setActiveAnswerText(e.target.value)}
                    placeholder="Provide details (e.g. vehicle type, mileage, diet specifics, energy levels) to refine calculations..."
                    rows="3"
                    className="w-full p-4 glass-input text-sm leading-relaxed resize-none focus:ring-1 focus:ring-green-500"
                    disabled={submittingConversation}
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500">
                    {activeAnswerText.length} chars
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={handleConversationCancel}
                    disabled={submittingConversation}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Cancel Sync
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConversationSkip}
                      disabled={submittingConversation}
                      className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Skip & Save
                    </button>

                    <button
                      type="submit"
                      disabled={submittingConversation || !activeAnswerText.trim()}
                      className={`py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer
                        ${submittingConversation || !activeAnswerText.trim()
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98]'
                        }`}
                    >
                      {submittingConversation ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Continue Handshake
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
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
            )}

            {/* Submission Terminal Progress Panel */}
            <AnimatePresence>
              {submitting && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 py-8 flex items-center justify-center overflow-hidden"
                >
                  <div className="mover"></div>
                </motion.div>
              )}
              {submitError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 font-mono text-xs overflow-hidden text-rose-800"
                >
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <div className="font-bold text-rose-950 uppercase tracking-wide mb-1">
                        SYNCHRONIZATION FAILURE
                      </div>
                      <div className="text-[11px] leading-relaxed">
                        {submitError}
                      </div>
                      <div className="mt-2 text-[10px] text-rose-600/70 border-t border-rose-200/50 pt-1.5">
                        Please verify your LLM provider API credentials in the settings panel. Local fallback is disabled.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile-Only Emission Analytics Breakdown (replaces tab switching) */}
          <div className="block md:hidden glass-panel rounded-3xl p-5 border border-green-100/50 relative">
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
                  <div className="text-center flex flex-col items-center">
                    <span className="text-2xl font-black text-green-600 block"><AnimatedCounter value={averageEfficiency} />%</span>
                    <div className="flex items-center gap-1.5 justify-center relative group">
                      <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider font-bold">5-Day Rolling Efficiency</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowAnalyticsTooltip(!showAnalyticsTooltip)
                        }}
                        onMouseEnter={() => setShowAnalyticsTooltip(true)}
                        onMouseLeave={() => setShowAnalyticsTooltip(false)}
                        className="info-tooltip-trigger p-1 -m-1 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer focus:outline-none flex items-center justify-center shrink-0"
                        title="View Guide"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Tooltip Content */}
                      <div className={`absolute left-1/2 transform -translate-x-1/2 bottom-7 w-72 bg-emerald-950/95 backdrop-blur border border-emerald-500/20 text-emerald-100 rounded-2xl p-4 shadow-2xl transition-all duration-300 z-[60] pointer-events-none text-xs leading-relaxed text-left opacity-0 invisible group-hover:opacity-100 group-hover:visible`}>
                        <div className="font-bold text-emerald-400 mb-1.5 font-mono tracking-wider uppercase text-[10px]">
                          5-Day Efficiency Guide
                        </div>
                        <div className="space-y-2 text-slate-300 text-[10.5px]">
                          <div>
                            <span className="font-bold text-white block mb-0.5">Calculation Method:</span>
                            <p className="leading-normal">
                              Your daily efficiency score (1.0 to 10.0) is assigned by AI based on carbon intensity. We compute the rolling average of your last 5 active days, scaled to 0-100%.
                            </p>
                          </div>
                          <div>
                            <span className="font-bold text-white block mb-0.5">Excluded Logs:</span>
                            <p className="leading-normal">
                              If a log contains no carbon-calculable activities, it is marked as non-calculable (no points/footprint) and is omitted from all averages (rather than being counted as zero).
                            </p>
                          </div>
                          <div>
                            <span className="font-bold text-white block mb-0.5">Rank Brackets:</span>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-0.5 text-[10px] font-mono">
                              <span className="text-sky-400">9.0+ : Eco Vanguard</span>
                              <span className="text-emerald-400">7.0+ : Earth Guardian</span>
                              <span className="text-orange-400">4.0+ : Sustainability Seeker</span>
                              <span className="text-yellow-400">1.0+ : Carbon Beginner</span>
                            </div>
                          </div>
                          <div>
                            <span className="font-bold text-white block mb-0.5">Strategies to Improve:</span>
                            <ul className="list-disc pl-3.5 space-y-0.5 leading-normal">
                              <li>Prefer public or active transit over single-passenger cars.</li>
                              <li>Adopt a plant-based diet (less meat & dairy).</li>
                              <li>Reduce home energy & switch off idle appliances.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
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
                  {logs.map((log) => {
                    const rawScore = log.efficiency_score !== null && log.efficiency_score !== undefined ? Number(log.efficiency_score) : null
                    const isNewScore = rawScore !== null ? rawScore <= 10 : false
                    const scoreOutOf10 = rawScore !== null ? (isNewScore ? rawScore : rawScore / 10) : 0
                    const scorePercentage = rawScore !== null ? (isNewScore ? rawScore * 10 : rawScore) : 0
                    const theme = getThemeProps(rawScore)

                    let originalText = log.raw_text || ''
                    let conversation = { questions: [], answers: [], turn: 0 }
                    if (log.raw_text && log.raw_text.includes('\n---\n')) {
                      const parts = log.raw_text.split('\n---\n')
                      originalText = parts[0]
                      try {
                        conversation = JSON.parse(parts[1])
                      } catch (e) {
                        console.error('Failed to parse conversation JSON', e)
                      }
                    }

                    return (
                      <motion.div
                        key={log.log_id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className={`glass-panel rounded-3xl border ${theme.border} ${theme.glow} transition-all duration-300 relative overflow-hidden bg-gradient-to-b ${theme.bgGrad}`}
                      >
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                          rawScore === null
                            ? 'from-slate-400/40 to-slate-300/40'
                            : scorePercentage >= 80
                              ? 'from-emerald-500/60 to-teal-400/60'
                              : scorePercentage >= 50
                                ? 'from-amber-500/60 to-orange-400/60'
                                : 'from-rose-500/60 to-pink-400/60'
                        }`} />

                        <div className="p-5 space-y-4">
                          {/* Top Row: Date & Status & Delete */}
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wide">
                                {new Date(log.created_at).toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider font-mono ${theme.badge}`}>
                                  {theme.label}
                                </span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleDeleteLog(log.log_id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Delete log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Hero Carbon Display Section */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 border border-slate-100/60 p-4 rounded-2xl shadow-sm">
                            <div className="flex flex-col">
                              <span className={`text-3xl md:text-4xl font-black font-mono tracking-tight ${theme.text}`}>
                                {log.calculated_kg !== null && log.calculated_kg !== undefined ? (
                                  <>
                                    {log.calculated_kg.toFixed(1)} <span className="text-sm md:text-base font-bold text-slate-500 font-sans">kg CO₂e</span>
                                  </>
                                ) : (
                                  <span className="text-sm md:text-base font-bold text-slate-400 font-sans">No Carbon Data</span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Absolute Footprint</span>
                            </div>
                            
                            {/* Score Gauge out of 10 */}
                            {log.efficiency_score !== null && log.efficiency_score !== undefined ? (
                              <div className="flex items-center gap-3 bg-white/60 p-2.5 rounded-xl border border-slate-200/20">
                                <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="2.5" />
                                    <circle 
                                      cx="18" 
                                      cy="18" 
                                      r="16" 
                                      fill="none" 
                                      stroke={theme.accentLight} 
                                      strokeWidth="3.5" 
                                      strokeDasharray="100" 
                                      strokeDashoffset={100 - scorePercentage}
                                      strokeLinecap="round"
                                      className="transition-all duration-1000 ease-out"
                                    />
                                  </svg>
                                  <span className="absolute text-[12px] font-black text-slate-800 font-mono">
                                    {scoreOutOf10.toFixed(0)}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[12px] font-black text-slate-700 leading-none">
                                    {scoreOutOf10.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">/ 10</span>
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wide mt-0.5">Efficiency Score</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center px-4 py-2.5 bg-white/60 rounded-xl border border-slate-200/20 text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                                Non-Calculable
                              </div>
                            )}
                          </div>

                          {/* User raw text input */}
                          <p className="text-[13.5px] text-slate-600 leading-relaxed bg-slate-50/50 px-4 py-2.5 rounded-xl border border-slate-200/30 font-mono italic">
                            “{originalText}”
                          </p>

                          {/* AI Warm Narrative */}
                          {log.narrative && (
                            <div className="bg-white/45 border border-slate-100 rounded-2xl p-4 shadow-sm">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Sparkles className={`w-3.5 h-3.5 ${theme.text}`} />
                                <span className={`text-[11.5px] font-bold uppercase tracking-widest font-mono ${theme.text}`}>AI Footprint Analysis</span>
                              </div>
                              <p className="text-[14.5px] md:text-[15.5px] text-slate-700 leading-relaxed font-medium">
                                {log.narrative}
                              </p>
                            </div>
                          )}

                          {/* Q&A Clarifying conversation block */}
                          {((conversation.questions && conversation.questions.length > 0) || (conversation.answers && conversation.answers.length > 0)) && (
                            <div className="bg-emerald-500/[0.04] backdrop-blur-md border border-emerald-500/15 rounded-2xl p-4 space-y-3 shadow-sm transition-all duration-300">
                              <div className="flex items-center gap-1.5 mb-1">
                                <HelpCircle className={`w-3.5 h-3.5 ${theme.text}`} />
                                <span className={`text-[11.5px] font-bold uppercase tracking-widest font-mono ${theme.text}`}>AI Follow-up Conversation ({conversation.turn}/3)</span>
                              </div>
                              
                              {/* Conversation History */}
                              <div className="space-y-3">
                                {conversation.questions.map((qText, qIdx) => {
                                  const ansText = conversation.answers[qIdx];
                                  return (
                                    <div key={qIdx} className="space-y-2 text-[13px] leading-relaxed">
                                      <div className="bg-white/60 border border-slate-100 p-2.5 rounded-xl">
                                        <span className="font-bold text-slate-500 block text-[10px] uppercase font-mono tracking-wider mb-0.5">AI Question:</span>
                                        <p className="text-slate-800 whitespace-pre-line">{qText}</p>
                                      </div>
                                      {ansText && (
                                        <div className="bg-emerald-500/[0.06] border border-emerald-500/10 p-2.5 rounded-xl ml-4">
                                          <span className="font-bold text-emerald-600 block text-[10px] uppercase font-mono tracking-wider mb-0.5">Your Response:</span>
                                          <p className="text-slate-700">{ansText}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>


                            </div>
                          )}

                          {/* Expandable Breakdown Layer */}
                          {log.causes && log.causes.length > 0 && (
                            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white/20">
                              <button
                                onClick={() => toggleBreakdown(log.log_id)}
                                className="w-full flex items-center justify-between p-3 hover:bg-white/30 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Layers className={`w-3.5 h-3.5 ${theme.text}`} />
                                  <span className="text-[12px] font-bold text-slate-700 font-mono uppercase tracking-wider">
                                    Emissions Trace Breakdown
                                  </span>
                                  <span className="text-[10.5px] font-bold bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500 font-mono">
                                    {log.causes.length} sources
                                  </span>
                                </div>
                                <motion.div
                                  animate={{ rotate: expandedBreakdowns[log.log_id] ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                </motion.div>
                              </button>

                              <AnimatePresence initial={false}>
                                {expandedBreakdowns[log.log_id] && (
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    className="overflow-hidden border-t border-slate-100"
                                  >
                                    <div className="p-3.5 space-y-3 bg-white/40">
                                      {log.causes.map((cause, idx) => {
                                        const totalCausesKg = log.causes.reduce((sum, c) => sum + (c.kg || 0), 0)
                                        const proportion = totalCausesKg > 0 ? ((cause.kg || 0) / totalCausesKg) * 100 : 0;
                                        
                                        return (
                                          <div key={idx} className="space-y-1.5">
                                            <div className="flex items-start justify-between gap-3 text-[12.5px]">
                                              <div className="flex-1 min-w-0">
                                                {cause.label && (
                                                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 font-mono block mb-0.5">
                                                    {cause.label}
                                                  </span>
                                                )}
                                                <span className="text-[12.5px] text-slate-700 font-medium leading-snug block">
                                                  {cause.activity}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="font-mono font-bold text-slate-800">{cause.kg.toFixed(1)} kg</span>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full font-mono ${
                                                  cause.impact === 'high' ? 'bg-rose-100 text-rose-700'
                                                  : cause.impact === 'medium' ? 'bg-amber-100 text-amber-700'
                                                  : 'bg-emerald-100 text-emerald-755'
                                                }`}>
                                                  {cause.impact}
                                                </span>
                                              </div>
                                            </div>
                                            {/* Proportional visual bar */}
                                            <div className="h-1 w-full bg-slate-200/50 rounded-full overflow-hidden">
                                              <div 
                                                className={`h-full rounded-full ${
                                                  cause.impact === 'high' ? 'bg-rose-400'
                                                  : cause.impact === 'medium' ? 'bg-amber-400'
                                                  : 'bg-emerald-400'
                                                }`}
                                                style={{ width: `${proportion}%` }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* Eco Recommendations */}
                          {log.suggestions && log.suggestions.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Trees className={`w-4.5 h-4.5 ${theme.text}`} />
                                <span className={`text-[13px] font-bold uppercase tracking-widest font-mono ${theme.text}`}>Eco Recommendations</span>
                              </div>
                              
                              <div className="flex flex-col gap-3">
                                {log.suggestions.map((s, idx) => {
                                  const title = typeof s === 'string' ? s : (s.title || '')
                                  const detail = typeof s === 'object' ? (s.detail || '') : ''
                                  const steps = typeof s === 'object' && Array.isArray(s.steps) ? s.steps : []
                                  
                                  return (
                                    <div 
                                      key={idx} 
                                      className="bg-emerald-500/[0.06] backdrop-blur-md border border-emerald-500/15 rounded-2xl p-4 transition-all duration-300 hover:bg-emerald-500/[0.12] hover:border-emerald-500/30 hover:scale-[1.01] hover:shadow-lg hover:shadow-emerald-500/[0.03]"
                                    >
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2.5 mb-1.5">
                                            <span className="w-6 h-6 rounded-full text-[12px] font-black flex items-center justify-center shrink-0 bg-emerald-600 text-white shadow-sm shadow-emerald-600/10">
                                              {idx + 1}
                                            </span>
                                            <span className="text-[15.5px] md:text-[16px] font-bold leading-snug text-emerald-900">
                                              {title}
                                            </span>
                                          </div>
                                          {detail && (
                                            <p className="text-[13.5px] md:text-[14px] text-slate-700 leading-relaxed mb-2 pl-8 font-medium">
                                              {detail}
                                            </p>
                                          )}
                                          {steps.length > 0 && (
                                            <div className="flex flex-col gap-1.5 pl-8 mt-2.5">
                                              {steps.map((step, si) => (
                                                <div 
                                                  key={si} 
                                                  className="flex items-start gap-2.5 text-[12.5px] md:text-[13px] text-slate-700 bg-white/70 hover:bg-emerald-50/70 border border-emerald-500/10 hover:border-emerald-500/20 px-3 py-1.5 rounded-xl transition-all duration-200 hover:translate-x-0.5"
                                                >
                                                  <span className="font-black mt-0.5 shrink-0 text-emerald-500">›</span>
                                                  <span className="leading-snug">{step}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Motivational message */}
                          {(log.motivation || log.eco_advice) && (
                            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.motivationBg} px-5 py-4.5 mt-2.5 border border-white/5`}>
                              <div className="absolute top-1 right-4 text-white/5 text-8xl font-serif leading-none select-none pointer-events-none">"</div>
                              <div className="flex items-start gap-3.5 relative z-10">
                                <Leaf className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
                                <p className="text-[14.5px] md:text-[15.5px] text-slate-100 leading-relaxed font-medium italic">
                                  {log.motivation || log.eco_advice}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
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
                    src={`${import.meta.env.BASE_URL}images/forest_canopy.png`} 
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
                    src={`${import.meta.env.BASE_URL}images/eco_transit.png`} 
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
                    src={`${import.meta.env.BASE_URL}images/green_diet.png`} 
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
                    src={`${import.meta.env.BASE_URL}images/ocean_sink.png`} 
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
                    src={`${import.meta.env.BASE_URL}images/renewable_grid.png`} 
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
                    src={`${import.meta.env.BASE_URL}images/soil_growth.png`} 
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
                    src={`${import.meta.env.BASE_URL}images/eco_hardware.png`} 
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
                    src={`${import.meta.env.BASE_URL}images/climate_globe.png`} 
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
                      Average surface temperatures have already risen by 1.1Â°C since industrial carbon expansion.
                    </p>
                  </div>
                  <div style={{ transform: 'translateZ(18px)' }} className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl text-[11px] md:text-xs text-green-700 font-semibold leading-normal font-mono">
                    <span className="font-bold block text-[9px] md:text-[10px] uppercase tracking-wider mb-0.5 text-green-800">Importance:</span>
                    Keeping warming below the 1.5Â°C threshold requires a global carbon emission cut of 45% by 2030.
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </section>

      </main>

      {/* Mobile-Only Navigation Sticky Bottom Menu */}
      <footer 
        style={{ 
          zIndex: 45, 
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom))', 
          paddingTop: '8px' 
        }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-auto border-t border-green-100/50 px-6 flex justify-center items-center overflow-hidden"
      >
        {/* Sibling glassmorphic background layer to avoid iOS Safari/Chrome backdrop-filter event-swallowing bugs */}
        <div className="absolute inset-0 z-0 bg-white/50 backdrop-blur-xl" style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }} />

        {/* Center Floating Plus trigger */}
        <button
          type="button"
          onClick={() => setShowMobileEntrySheet(true)}
          style={{ zIndex: 10 }}
          className="relative w-12 h-12 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center -translate-y-4 shadow-lg shadow-green-600/20 border border-white active:scale-[0.95] transition-transform cursor-pointer touch-manipulation"
        >
          <Plus className="w-6 h-6" />
        </button>
      </footer>

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

              {activeConversation ? (
                <form onSubmit={handleConversationSubmit} className="space-y-4">
                  {/* Handshake Header */}
                  <div className="flex items-center justify-between border-b border-green-100/50 pb-2 mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-green-800 font-mono">
                      <Activity className="w-4 h-4 text-green-600 animate-pulse" />
                      <span>AETHER HANDSHAKE — Turn {activeConversation.turn}/3</span>
                    </div>
                  </div>

                  {/* Original Entry Display */}
                  <div className="bg-slate-50/50 border border-slate-200/40 rounded-xl p-3 shadow-sm">
                    <span className="font-bold text-slate-500 block text-[9px] uppercase font-mono tracking-wider mb-1">Your Journal Entry:</span>
                    <p className="text-slate-700 text-xs italic font-medium">“{activeConversation.originalText}”</p>
                  </div>

                  {/* Conversation History */}
                  {activeConversation.answers.length > 0 && (
                    <div className="space-y-3 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      {activeConversation.answers.map((ansText, qIdx) => {
                        const qText = activeConversation.questions[qIdx];
                        return (
                          <div key={qIdx} className="space-y-1 text-xs">
                            <div className="bg-white/60 border border-slate-100 p-2 rounded-xl">
                              <span className="font-bold text-slate-500 block text-[8px] uppercase font-mono tracking-wider mb-0.5">AI Question:</span>
                              <p className="text-slate-800 leading-normal">{qText}</p>
                            </div>
                            <div className="bg-emerald-500/[0.04] border border-emerald-500/10 p-2 rounded-xl ml-3">
                              <span className="font-bold text-emerald-600 block text-[8px] uppercase font-mono tracking-wider mb-0.5">Your Response:</span>
                              <p className="text-slate-700 leading-normal">{ansText}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Current Active Clarifying Question */}
                  <div className="space-y-2">
                    {activeConversation.currentQuestions.map((qText, qIdx) => (
                      <div 
                        key={qIdx} 
                        className="bg-emerald-500/[0.06] backdrop-blur-md border border-emerald-500/15 rounded-xl p-3"
                      >
                        <span className="font-black text-emerald-700 block text-[9px] uppercase font-mono tracking-wider mb-1 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" />
                          AI CLARIFYING QUESTION
                        </span>
                        <p className="text-slate-800 text-xs leading-relaxed font-semibold">{qText}</p>
                      </div>
                    ))}
                  </div>

                  {/* Answer input */}
                  <div className="relative">
                    <textarea
                      value={activeAnswerText}
                      onChange={(e) => setActiveAnswerText(e.target.value)}
                      placeholder="Provide details..."
                      rows="3"
                      className="w-full p-3 glass-input text-xs leading-relaxed resize-none focus:ring-1 focus:ring-green-500"
                      disabled={submittingConversation}
                    />
                    <div className="absolute bottom-2.5 right-2.5 text-[9px] font-mono text-slate-500">
                      {activeAnswerText.length} chars
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleConversationCancel}
                        disabled={submittingConversation}
                        className="py-2 px-3 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleConversationSkip}
                        disabled={submittingConversation}
                        className="py-2 px-3 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <ArrowRight className="w-3 h-3" />
                        Skip & Save
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingConversation || !activeAnswerText.trim()}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer
                        ${submittingConversation || !activeAnswerText.trim()
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98]'
                        }`}
                    >
                      {submittingConversation ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Continue Handshake
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
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
              )}

              {/* Progress log in bottom sheet */}
              {submitting && (
                <div className="py-8 flex items-center justify-center">
                  <div className="mover"></div>
                </div>
              )}
              {submitError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 font-mono text-[11px] text-rose-800">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <div className="font-bold text-rose-950 uppercase tracking-wide mb-1">
                        SYNCHRONIZATION FAILURE
                      </div>
                      <div className="leading-relaxed">
                        {submitError}
                      </div>
                      <div className="mt-2 text-[10px] text-rose-600/70 border-t border-rose-200/50 pt-1.5">
                        Please verify your LLM provider API credentials in settings. Local fallback is disabled.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Centered Large Admin Config Modal */}
      <AnimatePresence>
        {adminConfig && user?.isAdmin && showAdminPanel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setShowAdminPanel(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 200 }}
              className="relative max-w-2xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] z-10 overflow-hidden"
            >
              {/* Gradient header bar */}
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 px-6 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">AI Engine Configuration</h2>
                    <p className="text-[11px] text-emerald-400/80 font-mono mt-0.5">Connect your LLM source Â· Set API key Â· Pick model</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSaveSettings} className="p-6 space-y-6">

                  {/* â”€â”€ Provider cards â”€â”€ */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-3">
                      Select AI Provider
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'openrouter', name: 'OpenRouter', sub: 'Multi-model gateway', color: 'violet', free: true },
                        { id: 'groq',       name: 'Groq',       sub: 'Ultra-fast inference', color: 'orange', free: true },
                        { id: 'openai',     name: 'OpenAI',     sub: 'GPT-4o Â· o1 series',  color: 'green',  free: false },
                        { id: 'gemini',     name: 'Gemini',     sub: 'Google DeepMind',      color: 'blue',   free: true },
                        { id: 'claude',     name: 'Claude',     sub: 'Anthropic Â· Sonnet',   color: 'amber',  free: false },
                        { id: 'ollama',     name: 'Ollama',     sub: 'Run locally Â· Free',   color: 'slate',  free: true },
                      ].map(p => {
                        const isActive = llmProvider === p.id
                        const colorMap = {
                          violet: isActive ? 'border-violet-500 bg-violet-50 shadow-violet-100' : 'border-slate-200 hover:border-violet-300',
                          orange: isActive ? 'border-orange-500 bg-orange-50 shadow-orange-100' : 'border-slate-200 hover:border-orange-300',
                          green:  isActive ? 'border-green-500  bg-green-50  shadow-green-100'  : 'border-slate-200 hover:border-green-300',
                          blue:   isActive ? 'border-blue-500   bg-blue-50   shadow-blue-100'   : 'border-slate-200 hover:border-blue-300',
                          amber:  isActive ? 'border-amber-500  bg-amber-50  shadow-amber-100'  : 'border-slate-200 hover:border-amber-300',
                          slate:  isActive ? 'border-slate-600  bg-slate-50  shadow-slate-100'  : 'border-slate-200 hover:border-slate-400',
                        }
                        const dotMap = {
                          violet:'bg-violet-500', orange:'bg-orange-500', green:'bg-green-500',
                          blue:'bg-blue-500', amber:'bg-amber-500', slate:'bg-slate-500'
                        }
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleProviderChange(p.id)}
                            className={`relative text-left p-3 rounded-2xl border-2 transition-all duration-200 shadow-sm cursor-pointer ${colorMap[p.color]}`}
                          >
                            {isActive && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              </div>
                            )}
                            <div className={`w-2 h-2 rounded-full ${dotMap[p.color]} mb-2`} />
                            <div className="text-[12px] font-bold text-slate-800">{p.name}</div>
                            <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{p.sub}</div>
                            {p.free && (
                              <span className="inline-block mt-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono">Free tier</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* â”€â”€ API Key â”€â”€ */}
                  {llmProvider !== 'ollama' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                          API Key
                        </label>
                        {llmProvider === 'openrouter' && (
                          <a
                            href="https://openrouter.ai/keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-violet-600 hover:text-violet-700 font-mono font-bold underline underline-offset-2"
                          >
                            Get free key â†—
                          </a>
                        )}
                        {llmProvider === 'groq' && (
                          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-orange-600 hover:text-orange-700 font-mono font-bold underline underline-offset-2">
                            Get free key â†—
                          </a>
                        )}
                        {llmProvider === 'gemini' && (
                          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 hover:text-blue-700 font-mono font-bold underline underline-offset-2">
                            Get free key â†—
                          </a>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          id="llm-api-key-input"
                          type={showApiKey ? 'text' : 'password'}
                          placeholder={
                            llmProvider === 'gemini'     ? 'AIzaSy...' :
                            llmProvider === 'openrouter' ? 'sk-or-v1-...' :
                            llmProvider === 'claude'     ? 'sk-ant-api-...' :
                            llmProvider === 'groq'       ? 'gsk_...' :
                            'sk-...'
                          }
                          value={llmApiKey}
                          onChange={(e) => setLlmApiKey(e.target.value)}
                          className="w-full p-3 pr-28 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder-slate-400"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowApiKey(v => !v)}
                            className="px-2 py-1 text-[10px] font-mono font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            {showApiKey ? 'Hide' : 'Show'}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!llmApiKey) return
                              setTestingKey(true)
                              setKeyTestResult(null)
                              try {
                                let testUrl = ''
                                let testHeaders = { 'Content-Type': 'application/json' }
                                let testBody = {}
                                if (llmProvider === 'openrouter') {
                                  testUrl = 'https://openrouter.ai/api/v1/chat/completions'
                                  testHeaders['Authorization'] = `Bearer ${llmApiKey}`
                                  testHeaders['HTTP-Referer'] = 'http://localhost:5173'
                                  testHeaders['X-Title'] = 'Aether Carbon'
                                  testBody = { model: llmModel || 'nvidia/nemotron-3-nano-30b-a3b:free', messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 }
                                } else if (llmProvider === 'groq') {
                                  testUrl = 'https://api.groq.com/openai/v1/chat/completions'
                                  testHeaders['Authorization'] = `Bearer ${llmApiKey}`
                                  testBody = { model: llmModel || 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 }
                                } else if (llmProvider === 'openai') {
                                  testUrl = 'https://api.openai.com/v1/chat/completions'
                                  testHeaders['Authorization'] = `Bearer ${llmApiKey}`
                                  testBody = { model: llmModel || 'gpt-4o-mini', messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 }
                                } else if (llmProvider === 'gemini') {
                                  testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${llmModel || 'gemini-2.0-flash'}:generateContent?key=${llmApiKey}`
                                  testBody = { contents: [{ parts: [{ text: 'ping' }] }] }
                                } else if (llmProvider === 'claude') {
                                  testUrl = 'https://api.anthropic.com/v1/messages'
                                  testHeaders['x-api-key'] = llmApiKey
                                  testHeaders['anthropic-version'] = '2023-06-01'
                                  testBody = { model: llmModel || 'claude-3-haiku-20240307', max_tokens: 5, messages: [{ role: 'user', content: 'ping' }] }
                                }
                                const res = await fetch(testUrl, { method: 'POST', headers: testHeaders, body: JSON.stringify(testBody), signal: AbortSignal.timeout(10000) })
                                setKeyTestResult(res.ok || res.status === 400 ? 'ok' : 'fail')
                              } catch {
                                setKeyTestResult('fail')
                              } finally {
                                setTestingKey(false)
                              }
                            }}
                            disabled={!llmApiKey || testingKey}
                            className="px-2 py-1 text-[10px] font-mono font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1"
                          >
                            {testingKey ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                            Test
                          </button>
                        </div>
                      </div>
                      {keyTestResult === 'ok' && (
                        <p className="text-[11px] text-emerald-600 font-mono font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> API key verified âœ“
                        </p>
                      )}
                      {keyTestResult === 'fail' && (
                        <p className="text-[11px] text-rose-600 font-mono font-bold flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" /> Key invalid or unreachable
                        </p>
                      )}
                    </div>
                  )}

                  {/* â”€â”€ Ollama Base URL â”€â”€ */}
                  {llmProvider === 'ollama' && (
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                        Ollama Server URL
                      </label>
                      <input
                        type="text"
                        placeholder="http://localhost:11434"
                        value={llmBaseUrl}
                        onChange={(e) => setLlmBaseUrl(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
                      />
                      <p className="text-[10px] text-slate-400 font-mono">Default: http://localhost:11434 â€” make sure Ollama is running</p>
                    </div>
                  )}

                  {/* â”€â”€ Model selector â”€â”€ */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Model</label>
                      <button
                        type="button"
                        onClick={() => fetchProviderModels(llmProvider, llmApiKey, llmBaseUrl)}
                        disabled={loadingModels}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-mono font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingModels ? 'animate-spin' : ''}`} />
                        {loadingModels ? 'Fetching...' : 'Fetch live models'}
                      </button>
                    </div>
                    <div className="relative">
                      <select
                        value={llmModel}
                        onChange={(e) => setLlmModel(e.target.value)}
                        className="w-full p-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                      >
                        {(dynamicModels || []).map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 rotate-90 pointer-events-none" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">Current: <span className="text-slate-600 font-bold">{llmModel}</span></p>
                  </div>

                  {/* â”€â”€ Base URL override (non-ollama) â”€â”€ */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                      Custom API Endpoint <span className="normal-case text-slate-400 font-normal">(optional override)</span>
                    </label>
                    <input
                      type="text"
                      placeholder={
                        llmProvider === 'groq'       ? 'https://api.groq.com/openai/v1/chat/completions' :
                        llmProvider === 'openai'     ? 'https://api.openai.com/v1/chat/completions' :
                        llmProvider === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' :
                        'Leave blank to use provider default'
                      }
                      value={llmBaseUrl}
                      onChange={(e) => setLlmBaseUrl(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* ── System Prompt override ── */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                        System Prompt <span className="normal-case text-slate-400 font-normal">(instruction override)</span>
                      </label>
                      {llmSystemPrompt !== defaultSettings.llm_system_prompt && (
                        <button
                          type="button"
                          onClick={() => setLlmSystemPrompt(defaultSettings.llm_system_prompt)}
                          className="text-[10px] text-emerald-700 hover:text-emerald-800 font-mono font-bold flex items-center gap-1 cursor-pointer"
                        >
                          Reset to Default
                        </button>
                      )}
                    </div>
                    <textarea
                      placeholder="Enter custom LLM instructions..."
                      value={llmSystemPrompt}
                      onChange={(e) => setLlmSystemPrompt(e.target.value)}
                      rows={12}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 resize-y min-h-[240px]"
                    />
                    <p className="text-[10px] text-slate-400 font-mono">
                      Directly edit the instructions used by the system to analyze journal entries.
                    </p>
                  </div>

                  {/* ── Current config summary ── */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">Active Configuration</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-mono">Provider</span>
                        <span className="font-bold text-slate-800 font-mono capitalize">{llmProvider}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-mono">Model</span>
                        <span className="font-bold text-slate-800 font-mono text-right max-w-[55%] truncate">{llmModel}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-mono">API Key</span>
                        <span className={`font-bold font-mono ${llmApiKey ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {llmApiKey ? `${llmApiKey.slice(0, 8)}••••••••` : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-mono">Sys Prompt</span>
                        <span className={`font-bold font-mono text-right max-w-[55%] truncate ${(llmSystemPrompt && llmSystemPrompt !== defaultSettings.llm_system_prompt) ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {(llmSystemPrompt && llmSystemPrompt !== defaultSettings.llm_system_prompt) ? 'Custom prompt configured' : 'Default prompt'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* â”€â”€ Save bar â”€â”€ */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      {settingsStatus && (() => {
                        const isError = settingsStatus.startsWith('✗');
                        const isWarning = settingsStatus.startsWith('⚠');
                        const cleanMsg = settingsStatus.replace(/^[✗✓⚠]\s*/, '');
                        
                        let textColor = 'text-emerald-600';
                        let IconComponent = CheckCircle2;
                        
                        if (isError) {
                          textColor = 'text-rose-600';
                          IconComponent = XCircle;
                        } else if (isWarning) {
                          textColor = 'text-amber-600';
                          IconComponent = AlertTriangle;
                        }
                        
                        return (
                          <p className={`text-[11px] ${textColor} font-mono font-bold flex items-center gap-1.5`}>
                            <IconComponent className="w-3.5 h-3.5 shrink-0" /> {cleanMsg}
                          </p>
                        );
                      })()}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAdminPanel(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                      >
                        {savingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Save & Apply
                      </button>
                    </div>
                  </div>

                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Aether Card Modal */}
      <AnimatePresence>
        {showCertificate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-md overflow-y-auto">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setShowCertificate(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 28, stiffness: 190 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col z-10 overflow-hidden my-4 sm:my-8"
            >
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-800 font-mono">YOUR AETHER CARD</span>
                </div>
                <button
                  onClick={() => setShowCertificate(false)}
                  className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Certificate Preview Card */}
              <div className="p-3 sm:p-6 overflow-y-auto flex flex-col items-center justify-center bg-slate-100/50 relative">
                <div
                  id="certificate-preview-card"
                  className="w-full select-none rounded-lg shadow-lg"
                  style={{
                    background: activeCertColors.bgGrad,
                    border: `3px solid ${activeCertColors.border}`,
                    position: 'relative',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    padding: 'clamp(1rem, 4vw, 2.5rem) clamp(0.75rem, 3vw, 2rem)',
                    minHeight: 'clamp(320px, 60vw, 566px)',
                  }}
                >
                  {/* Inner thick border */}
                  <div style={{ position: 'absolute', top: '4px', left: '4px', right: '4px', bottom: '4px', border: `10px double ${activeCertColors.doubleBorder}`, pointerEvents: 'none', borderRadius: '2px' }} />

                  {/* Accent line */}
                  <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px', border: `2px solid ${activeCertColors.goldBorder}`, pointerEvents: 'none', borderRadius: '2px' }}>
                    {/* Corner brackets */}
                    <div style={{ position: 'absolute', top: '-5px', left: '-5px', width: '10px', height: '10px', backgroundColor: activeCertColors.goldBorder }} />
                    <div style={{ position: 'absolute', top: '-5px', right: '-5px', width: '10px', height: '10px', backgroundColor: activeCertColors.goldBorder }} />
                    <div style={{ position: 'absolute', bottom: '-5px', left: '-5px', width: '10px', height: '10px', backgroundColor: activeCertColors.goldBorder }} />
                    <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', width: '10px', height: '10px', backgroundColor: activeCertColors.goldBorder }} />
                  </div>

                  {/* Corner flourishes — scaled down on mobile */}
                  <div style={{ position: 'absolute', top: '16px', left: '16px', pointerEvents: 'none' }} className={activeCertColors.leafOpacity}>
                    <Leaf style={{ width: 'clamp(22px,5vw,40px)', height: 'clamp(22px,5vw,40px)', position: 'absolute', top: 0, left: 0, transform: 'rotate(-45deg)' }} />
                    <Leaf style={{ width: 'clamp(14px,3vw,24px)', height: 'clamp(14px,3vw,24px)', position: 'absolute', top: '10px', left: '10px', transform: 'rotate(-60deg)' }} />
                  </div>
                  <div style={{ position: 'absolute', top: '16px', right: '16px', pointerEvents: 'none' }} className={activeCertColors.leafOpacity}>
                    <Leaf style={{ width: 'clamp(22px,5vw,40px)', height: 'clamp(22px,5vw,40px)', position: 'absolute', top: 0, right: 0, transform: 'rotate(45deg)' }} />
                    <Leaf style={{ width: 'clamp(14px,3vw,24px)', height: 'clamp(14px,3vw,24px)', position: 'absolute', top: '10px', right: '10px', transform: 'rotate(60deg)' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: '16px', left: '16px', pointerEvents: 'none' }} className={activeCertColors.leafOpacity}>
                    <Leaf style={{ width: 'clamp(22px,5vw,40px)', height: 'clamp(22px,5vw,40px)', position: 'absolute', bottom: 0, left: 0, transform: 'rotate(-135deg)' }} />
                    <Leaf style={{ width: 'clamp(14px,3vw,24px)', height: 'clamp(14px,3vw,24px)', position: 'absolute', bottom: '10px', left: '10px', transform: 'rotate(-120deg)' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: '16px', right: '16px', pointerEvents: 'none' }} className={activeCertColors.leafOpacity}>
                    <Leaf style={{ width: 'clamp(22px,5vw,40px)', height: 'clamp(22px,5vw,40px)', position: 'absolute', bottom: 0, right: 0, transform: 'rotate(135deg)' }} />
                    <Leaf style={{ width: 'clamp(14px,3vw,24px)', height: 'clamp(14px,3vw,24px)', position: 'absolute', bottom: '10px', right: '10px', transform: 'rotate(120deg)' }} />
                  </div>

                  {/* Large center leaf watermark */}
                  <Leaf style={{ position: 'absolute', width: 'clamp(120px,35vw,256px)', height: 'clamp(120px,35vw,256px)', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(12deg)', color: activeCertColors.text, opacity: 0.025 }} className="pointer-events-none" />

                  {/* Header stamp */}
                  <div className="flex flex-col items-center relative z-10" style={{ marginTop: 'clamp(0.25rem, 2vw, 0.5rem)' }}>
                    <div style={{ backgroundColor: activeCertColors.border, width: 'clamp(28px,7vw,40px)', height: 'clamp(28px,7vw,40px)' }} className="rounded-full flex items-center justify-center text-white mb-1.5 shadow">
                      <Leaf style={{ width: 'clamp(14px,3.5vw,20px)', height: 'clamp(14px,3.5vw,20px)' }} className="text-white" />
                    </div>
                    <span style={{ fontSize: 'clamp(7px, 1.8vw, 10px)' }} className="font-bold tracking-[0.18em] font-mono text-slate-700 uppercase">Aether Sync Ledger Matrix</span>
                  </div>

                  {/* Title */}
                  <div className="relative z-10 flex flex-col items-center" style={{ margin: 'clamp(0.25rem, 1.5vw, 0.5rem) 0' }}>
                    <h2 className="font-bold font-serif italic text-center" style={{ color: activeCertColors.text, fontSize: 'clamp(1rem, 4.5vw, 1.875rem)' }}>
                      Aether Card of Sequestration
                    </h2>
                    <p className="italic mt-1 font-serif text-center text-slate-500" style={{ fontSize: 'clamp(8px, 2vw, 11px)' }}>
                      This Aether Card is proudly awarded to
                    </p>

                    {/* Avatar */}
                    {avatarImg && (
                      <div className="mt-2 mb-1 flex justify-center">
                        <div
                          style={{ borderColor: activeCertColors.border, boxShadow: `0 0 15px ${activeCertColors.border}25`, width: 'clamp(40px,10vw,64px)', height: 'clamp(40px,10vw,64px)' }}
                          className="rounded-full border-2 p-0.5 bg-white/80 flex items-center justify-center overflow-hidden transition-all shadow-md"
                        >
                          <img src={avatarImg} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="relative z-10" style={{ margin: 'clamp(0.1rem, 1vw, 0.25rem) 0' }}>
                    <p className="font-bold font-serif text-slate-900 border-b border-slate-200 inline-block pb-1" style={{ fontSize: 'clamp(1rem, 4.5vw, 1.875rem)', paddingLeft: 'clamp(1rem, 5vw, 2rem)', paddingRight: 'clamp(1rem, 5vw, 2rem)' }}>
                      {profile?.display_name || user?.display_name || 'Eco Guardian'}
                    </p>
                  </div>

                  {/* Cursive appreciation */}
                  <div className="relative z-10" style={{ margin: 'clamp(0.25rem, 1.5vw, 0.375rem) 0' }}>
                    <p className="font-cursive font-semibold leading-tight" style={{ color: activeCertColors.text, fontSize: 'clamp(9px, 2.5vw, 16px)' }}>
                      "With deepest appreciation for your mindful steps toward a greener, cooler planet."
                    </p>
                  </div>

                  {/* Description */}
                  <div className="mx-auto font-serif leading-relaxed relative z-10 px-4" style={{ maxWidth: '36rem', fontSize: 'clamp(7px, 1.8vw, 11px)', color: '#475569' }}>
                    {getCertificateDescription(rank)}
                  </div>

                  {/* Motivation */}
                  <div
                    className="mx-auto font-serif italic relative z-10 px-4"
                    style={{
                      maxWidth: '28rem',
                      fontSize: 'clamp(6.5px, 1.6vw, 9.5px)',
                      margin: 'clamp(0.25rem, 1.5vw, 0.5rem) auto',
                      borderTop: `1px solid ${activeCertColors.border}33`,
                      borderBottom: `1px solid ${activeCertColors.border}33`,
                      padding: 'clamp(4px, 1.2vw, 6px) 1rem',
                      color: activeCertColors.text,
                      backgroundColor: activeCertColors.border + '0c',
                    }}
                  >
                    "Every action synchronized is a testament to the belief that human progress can beat in harmony with nature."
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      width: '100%',
                      paddingLeft: 'clamp(0.5rem, 3vw, 1.5rem)',
                      paddingRight: 'clamp(0.5rem, 3vw, 1.5rem)',
                      position: 'relative',
                      zIndex: 10,
                      marginTop: 'auto',
                      marginBottom: 'clamp(0.1rem, 1vw, 0.25rem)',
                      boxSizing: 'border-box',
                      gap: '0.5rem',
                    }}
                  >
                    {/* Date */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 0%', minWidth: 0 }}>
                      <span className="font-bold text-slate-800 font-serif border-b border-slate-300 pb-1 text-center" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)', width: 'clamp(70px, 18vw, 112px)' }}>
                        {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <span className="font-bold text-slate-400 font-mono mt-1 uppercase text-center" style={{ fontSize: 'clamp(5px, 1.3vw, 8px)' }}>DATE OF EMISSION RECORD</span>
                    </div>

                    {/* Metallic Rank Ribbon Banner */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: 'clamp(32px, 8vw, 48px)', width: 'clamp(140px, 40vw, 280px)', flexShrink: 0 }}>
                      {/* Left ribbon tail */}
                      <div
                        className={`metallic-badge ${badgeConfig.class}`}
                        style={{
                          position: 'absolute',
                          right: '50%',
                          marginRight: 'clamp(50px, 13vw, 95px)',
                          top: 'clamp(8px, 2vw, 12px)',
                          width: 'clamp(22px, 6vw, 45px)',
                          height: 'clamp(14px, 3.5vw, 24px)',
                          zIndex: 9,
                          clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%, 20% 50%, 0% 0%)',
                          filter: 'brightness(0.75)',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                          border: '1px solid rgba(255,255,255,0.15)'
                        }}
                      />
                      {/* Right ribbon tail */}
                      <div
                        className={`metallic-badge ${badgeConfig.class}`}
                        style={{
                          position: 'absolute',
                          left: '50%',
                          marginLeft: 'clamp(50px, 13vw, 95px)',
                          top: 'clamp(8px, 2vw, 12px)',
                          width: 'clamp(22px, 6vw, 45px)',
                          height: 'clamp(14px, 3.5vw, 24px)',
                          zIndex: 9,
                          clipPath: 'polygon(0% 0%, 100% 0%, 80% 50%, 100% 100%, 0% 100%)',
                          filter: 'brightness(0.75)',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                          border: '1px solid rgba(255,255,255,0.15)'
                        }}
                      />
                      {/* Main Ribbon Body */}
                      <div
                        className={`metallic-badge ${badgeConfig.class}`}
                        style={{
                          position: 'relative',
                          zIndex: 10,
                          width: 'clamp(105px, 28vw, 210px)',
                          height: 'clamp(20px, 5vw, 34px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 'clamp(3px, 1vw, 6px)',
                          borderRadius: '4px',
                          border: '1.5px solid rgba(255,255,255,0.35)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.4)',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div style={{ color: activeCertColors.sealText, transform: 'scale(0.85)', display: 'flex', alignItems: 'center' }}>
                          {badgeConfig.icon}
                        </div>
                        <span
                          className="font-serif uppercase font-extrabold whitespace-nowrap select-none"
                          style={{ color: activeCertColors.sealText, fontSize: 'clamp(5px, 1.5vw, 9px)', letterSpacing: '0.12em' }}
                        >
                          {rank}
                        </span>
                      </div>
                    </div>

                    {/* Registry Signature */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 0%', minWidth: 0 }}>
                      <span className="font-bold text-slate-800 font-cursive italic border-b border-slate-300 pb-1 select-none text-center" style={{ fontSize: 'clamp(9px, 2.5vw, 14px)', width: 'clamp(70px, 18vw, 112px)' }}>
                        Vibhath T K
                      </span>
                      <span className="font-bold text-slate-400 font-mono mt-1 uppercase text-center" style={{ fontSize: 'clamp(5px, 1.3vw, 8px)' }}>AETHER VERIFICATION REGISTRY</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="bg-slate-50 border-t border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCertificate(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-600 transition-colors cursor-pointer bg-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={downloadCertificate}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
