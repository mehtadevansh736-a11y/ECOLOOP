import { NextResponse } from 'next/server';
import { analyzeItemImage, extractCleanBase64AndMime } from '@/lib/services/ai';
import { createClientServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      console.warn('[SCAN API REJECT] Missing or non-string image in request body.');
      return NextResponse.json(
        { error: 'Unable to read this image. Please upload another image.' },
        { status: 400 }
      );
    }

    const { base64Data, mimeType, byteSize } = extractCleanBase64AndMime(image);
    const sizeKb = Math.round(byteSize / 1024);

    console.log(`\n--- [SCAN API SERVER AUDIT LOG] ---`);
    console.log(`MIME Type        : ${mimeType}`);
    console.log(`Base64 Chars     : ${image.length}`);
    console.log(`Decoded Size     : ${sizeKb} KB (${byteSize} bytes)`);
    console.log(`Validation Status: ${byteSize > 0 ? 'PASSED' : 'FAILED'}`);

    if (!base64Data || byteSize === 0) {
      console.warn('[SCAN API REJECT] Empty image payload or byteSize is 0.');
      return NextResponse.json(
        { error: 'Unable to read this image. Please upload another image.' },
        { status: 400 }
      );
    }

    if (byteSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10 MB limit. Please upload a smaller image.' },
        { status: 400 }
      );
    }

    // Call Gemini Vision AI service
    const { result, isDemoFallback } = await analyzeItemImage(image);

    let savedScanId: string | null = null;

    // Save scan to Supabase database if configured
    try {
      const supabase = await createClientServer();
      const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: null }));
      const userId = userData?.user?.id || null;

      const storedImageRef = image.length > 50000 
        ? image.slice(0, 50000) + '...'
        : image;

      const { data: scanData } = await supabase
        .from('scans')
        .insert({
          user_id: userId,
          image_url: storedImageRef,
          item_name: result.item_name,
          category: result.category,
          material: result.material,
          condition: result.condition,
          reusable: result.reusable,
          repairable: result.repairable,
          recyclable: result.recyclable,
          recommended_action: result.recommended_action,
          circularity_score: result.circularity_score,
          confidence: result.confidence,
          reason: result.reason,
          co2_estimate: result.co2_estimate,
        })
        .select('id')
        .single();

      if (scanData?.id) {
        savedScanId = scanData.id;
      }
    } catch (dbErr) {
      console.warn('Database save skipped or operating in demo mode:', dbErr);
    }

    const scanId = savedScanId || `scan-${Date.now()}`;

    return NextResponse.json({
      success: true,
      scanId,
      data: result,
      isDemoFallback,
    });
  } catch (error: any) {
    console.error('Scan API Error:', error);
    return NextResponse.json(
      { error: error.message || 'AI vision service is temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}

