import { NextResponse } from 'next/server';
import { recordCircularActionServer } from '@/lib/services/activities';
import { Category, CircularAction } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scanId, action, category, itemName } = body;

    if (!scanId || !action || !category) {
      return NextResponse.json(
        { error: 'Missing scanId, action, or category.' },
        { status: 400 }
      );
    }

    const result = await recordCircularActionServer(
      scanId,
      action as CircularAction,
      category as Category,
      itemName || 'Scanned Item'
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Action API handler error:', error);
    return NextResponse.json(
      { error: 'Could not record circular action. Please try again.' },
      { status: 500 }
    );
  }
}
