import { NextResponse } from 'next/server';
import { analyzeItemImage } from '@/lib/services/ai';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const { result } = await analyzeItemImage(image);

    // Format generated title & description for marketplace
    const title = `${result.item_name} – ${result.condition} Condition`;
    const description = `Pre-owned ${result.item_name} made of ${result.material}. ${result.reason} Great candidate for reuse or refurbishment.`;

    return NextResponse.json({
      success: true,
      listing: {
        title,
        description,
        category: result.category,
        condition: result.condition,
        suggestedPrice: 0,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'AI Listing Generator failed' }, { status: 500 });
  }
}
