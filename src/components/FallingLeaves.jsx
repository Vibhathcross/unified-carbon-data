import React, { useState, useEffect } from 'react'

const LEAF_COLORS = [
  'text-green-500',
  'text-green-600',
  'text-emerald-500',
  'text-emerald-600',
  'text-teal-500',
  'text-green-400',
]

export default function FallingLeaves() {
  const [leaves, setLeaves] = useState([])

  useEffect(() => {
    // Generate 38 leaves with randomized initial positions and animation properties
    const leavesArray = Array.from({ length: 38 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,                  // percentage across screen width
      size: Math.random() * 16 + 12,              // size in pixels (12px to 28px)
      duration: Math.random() * 10 + 9,           // time to fall (9s to 19s)
      delay: Math.random() * -20,                  // negative delay so they start at different stages
      sway: Math.random() * 35 + 20,              // pixel width of side sway
      opacity: Math.random() * 0.40 + 0.35,       // opacity (0.35 to 0.75)
      rotation: Math.random() * 360,              // initial rotation angle
      strokeWidth: Math.random() > 0.5 ? 2 : 1.5, // slight stroke variation
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
    }))
    setLeaves(leavesArray)
  }, [])

  return (
    <div className="fixed inset-0 z-[-8] overflow-hidden pointer-events-none">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute"
          style={{
            left: `${leaf.left}%`,
            width: `${leaf.size}px`,
            height: `${leaf.size}px`,
            opacity: leaf.opacity,
            animationName: 'fall-and-sway',
            animationDuration: `${leaf.duration}s`,
            animationDelay: `${leaf.delay}s`,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
            '--sway-x': `${leaf.sway}px`,
            '--init-rot': `${leaf.rotation}deg`,
          }}
        >
          {/* Lucide Leaf Path Icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={leaf.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${leaf.color} w-full h-full`}
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2Z" />
            <path d="M9.8 6.1C13.5 9 15 12 11 15" />
          </svg>
        </div>
      ))}
    </div>
  )
}
