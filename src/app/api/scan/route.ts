import { NextResponse } from 'next/server';
import { scanSystem } from '@/backend/scanner';

export async function GET() {
  try {
    const specs = await scanSystem();
    return NextResponse.json(specs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Scan failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
