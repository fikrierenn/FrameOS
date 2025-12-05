import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  return NextResponse.json({
    hasKey: !!apiKey,
    keyPreview: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT FOUND',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('GEMINI')),
  });
}
