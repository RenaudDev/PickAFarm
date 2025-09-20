import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'
export const dynamic = 'force-static'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#22c55e',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '4px',
        }}
      >
        🌾
      </div>
    ),
    {
      ...size,
    }
  )
}
