import React, { useState, useEffect } from 'react'

export default function FallingLeaves() {
  const [leaves, setLeaves] = useState([])

  useEffect(() => {
    // Generate 18 leaves with randomized initial positions and animation properties
    const leavesArray = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // percentage across screen width
      size: Math.random() * 14 + 10, // size in pixels (10px to 24px)
      duration: Math.random() * 12 + 10, // time to fall (10s to 22s)
      delay: Math.random() * -15, // negative delay so they start at different stages
      sway: Math.random() * 25 + 15, // pixel width of side sway
      opacity: Math.random() * 0.16 + 0.1, // opacity (0.1 to 0.26)
      rotation: Math.random() * 360, // initial rotation angle
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
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-600 w-full h-full"
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2Z" />
            <path d="M9.8 6.1C13.5 9 15 12 11 15" />
          </svg>
        </div>
      ))}
    </div>
  )
}
