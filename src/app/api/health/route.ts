import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const START_TIME = Date.now()

export async function GET() {
  const uptime = Math.floor((Date.now() - START_TIME) / 1000)

  return NextResponse.json(
    {
      status: 'ok',
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime_seconds: uptime,
      region: process.env.VERCEL_REGION ?? 'local',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
      },
    }
  )
}
