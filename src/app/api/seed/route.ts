import { NextResponse } from 'next/server';
import { seed } from '@/lib/seed';

export async function GET() {
  try {
    const result = seed();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
