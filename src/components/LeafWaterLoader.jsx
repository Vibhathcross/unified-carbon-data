import React from 'react'

export default function LeafWaterLoader({ size = 'w-12 h-12', loop = true }) {
  const riseClass = loop ? 'animate-[wave-rise-loop_3s_infinite_ease-in-out]' : 'animate-[wave-rise-once_1.5s_forwards_cubic-bezier(0.25,1,0.5,1)]'

  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      {/* Background outline leaf */}
      <svg
        className="absolute w-full h-full text-green-200"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.58 0 8a7 7 0 0 1-8 10z" />
        <path d="M9 22v-4H5" />
      </svg>

      {/* Masked filling leaf */}
      <svg className="absolute w-full h-full" viewBox="0 0 24 24">
        <defs>
          <clipPath id="leaf-water-clip">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.58 0 8a7 7 0 0 1-8 10z" />
          </clipPath>
          <linearGradient id="leaf-water-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" /> {/* emerald-400 */}
            <stop offset="100%" stopColor="#059669" /> {/* emerald-600 */}
          </linearGradient>
        </defs>

        <g clipPath="url(#leaf-water-clip)">
          {/* Inner group for translating vertically */}
          <g className={riseClass}>
            {/* Wave path translating horizontally */}
            <path
              className="animate-[wave-horizontal_1.8s_linear_infinite]"
              d="M -24,0 Q -18,-1.5 -12,0 T 0,0 T 12,0 T 24,0 V 24 H -24 Z"
              fill="url(#leaf-water-gradient)"
            />
          </g>
        </g>
      </svg>
    </div>
  )
}
