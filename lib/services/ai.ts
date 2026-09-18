import { AIScanResult, Category, CircularAction } from '@/types';
import { calculateCO2Avoided } from './impact';
import { SEED_DEMO_ITEMS } from '../seedData';

const VALID_CATEGORIES: Category[] = [
  'Plastic',
  'Paper',
  'Glass',
  'Metal',
  'Textile',
  'Electronics',
  'Furniture',
  'Organic',
  'Mixed',
  'Other',
];

const VALID_ACTIONS: CircularAction[] = [
  'Reuse',
  'Repair',
  'Donate',
  'Resell',
  'Recycle',
  'Dispose',
];

/**
 * Robust Base64 and MIME Type extractor supporting all DataURL variants
 */
export function extractCleanBase64AndMime(dataUrl: string): { base64Data: string; mimeType: string; byteSize: number } {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return { base64Data: '', mimeType: 'image/jpeg', byteSize: 0 };
  }

  const trimmed = dataUrl.trim();
  let mimeType = 'image/jpeg';

  // Extract MIME type if data URL
  const mimeMatch = trimmed.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);/i);
  if (mimeMatch && mimeMatch[1]) {
    mimeType = mimeMatch[1].toLowerCase();
    if (mimeType === 'image/jpg') mimeType = 'image/jpeg';
  }

  // Extract pure Base64 content after comma
  let base64Data = trimmed;
  const commaIndex = trimmed.indexOf(',');
  if (commaIndex !== -1 && trimmed.startsWith('data:')) {
    base64Data = trimmed.substring(commaIndex + 1);
  }

  // Remove whitespace, linebreaks
  base64Data = base64Data.replace(/[\r\n\s]/g, '');

  // Calculate actual decoded byte length
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  const byteSize = Math.max(0, Math.floor((base64Data.length * 3) / 4) - padding);

  return { base64Data, mimeType, byteSize };
}

/**
 * Normalizes confidence scores from Gemini Vision API to a standard 0-100 scale.
 * Handles both decimal float (0.95 -> 95) and percentage integer (95 -> 95) formats.
 */
export function normalizeConfidence(val: any): number {
  if (val === undefined || val === null || val === '') {
    return 85;
  }

  const num = Number(val);
  if (isNaN(num)) {
    return 85;
  }

  // Decimal float format (0.95 -> 95, 0.8 -> 80)
  if (num > 0 && num <= 1) {
    return Math.round(num * 100);
  }

  // Integer scale format (95 -> 95, 80 -> 80)
  if (num > 1 && num <= 100) {
    return Math.round(num);
  }

  if (num <= 0) return 0;
  return 100;
}

/**
 * Multimodal AI analysis using Google Gemini Vision API.
 */
export async function analyzeItemImage(imageDataUrl: string): Promise<{
  result: AIScanResult;
  isDemoFallback: boolean;
}> {
  const { base64Data, mimeType, byteSize } = extractCleanBase64AndMime(imageDataUrl);

  if (!base64Data || byteSize === 0) {
    throw new Error('Unable to read this image. Please upload another image.');
  }

  if (byteSize > 10 * 1024 * 1024) {
    throw new Error('File size exceeds 10 MB limit. Please upload a smaller image.');
  }

  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // 1. Call Google Gemini Vision if API key is provided
  if (geminiApiKey) {
    try {
      const rawResult = await callGeminiVision(base64Data, mimeType, geminiApiKey);

      const rawConfidence = rawResult?.confidence;
      const normalizedConf = normalizeConfidence(rawConfidence);
      const itemName = String(rawResult?.item_name || '').trim();

      console.log(`\n[EcoLoop Gemini Debug]`);
      console.log(`model: ${rawResult._modelUsed || 'Gemini Vision'}`);
      console.log(`raw response received: true`);

      console.log(`\n[Parsed AI]`);
      console.log(`item_name : "${itemName}"`);
      console.log(`category  : "${rawResult?.category}"`);
      console.log(`material  : "${rawResult?.material}"`);
      console.log(`condition : "${rawResult?.condition}"`);
      console.log(`confidence: ${rawConfidence} -> normalized: ${normalizedConf}%`);

      // Check if item is unidentifiable or blank
      const isUnidentified = 
        normalizedConf < 20 ||
        itemName.toLowerCase().includes('unidentified') ||
        (itemName.toLowerCase().includes('blank image') && normalizedConf < 50);

      if (isUnidentified) {
        console.warn(`[EcoLoop Scan Reject] Unidentified item. item_name="${itemName}", confidence=${normalizedConf}%`);
        throw new Error('AI could not confidently identify this item. Try another photo with the object clearly visible.');
      }

      rawResult.confidence = normalizedConf;
      const validatedResult = validateAndSanitizeAIResult(rawResult, rawResult._modelUsed || 'Gemini Vision');

      console.log(`\n[Validated AI]`);
      console.log(`item_name : "${validatedResult.item_name}"`);
      console.log(`category  : "${validatedResult.category}"`);
      console.log(`confidence: ${validatedResult.confidence}%\n`);

      return { result: validatedResult, isDemoFallback: false };
    } catch (err: any) {
      console.error('[EcoLoop Gemini Error]:', err.message || err);
      if (err.message?.includes('confidently identify')) {
        throw err;
      }
      throw new Error('AI vision service is temporarily unavailable. Please try again.');
    }
  }

  // 2. Demo Fallback Mode if GEMINI_API_KEY is not configured
  if (isDemoMode) {
    console.log('[EcoLoop AI] GEMINI_API_KEY not found in server env. Running in Demo Mode Fallback.');
    const selectedSeed = selectDemoSeedByImage(imageDataUrl);
    const validatedSeed = validateAndSanitizeAIResult(selectedSeed, 'Demo Mode Fallback');
    return {
      result: validatedSeed,
      isDemoFallback: true,
    };
  }

  // 3. No key and demo mode disabled -> Return configuration error
  throw new Error('Gemini API key is not configured. Please add GEMINI_API_KEY to .env.local.');
}

/**
 * Call Gemini Multimodal API with exact EcoLoop visual intelligence prompt
 */
async function callGeminiVision(base64Data: string, mimeType: string, apiKey: string): Promise<any> {
  const promptText = `You are the visual intelligence engine for EcoLoop, an AI-powered circular economy platform.

Look directly at the uploaded image and identify the physical object shown.

Do not infer the object from the filename.

First identify the object/product.

Then determine:

- item_name
- EcoLoop category
- visible material
- condition
- reusable
- repairable
- recyclable
- recommended circular action
- confidence
- reason
- visual evidence

Allowed EcoLoop categories:

Plastic
Paper
Glass
Metal
Textile
Electronics
Furniture
Organic
Mixed
Other

Allowed actions:

Reuse
Repair
Donate
Resell
Recycle
Dispose

Important classification rules:

- Identify the product/object before identifying its material.
- A smartphone is Electronics even if its body contains glass, plastic, or metal.
- A laptop is Electronics.
- Chargers, cables and batteries are Electronics.
- Clothing is Textile.
- Chairs, tables and cabinets are Furniture.
- Food and biological waste is Organic.
- Clearly identifiable glass containers are Glass.
- Clearly identifiable metal products are Metal.
- Clearly identifiable paper/cardboard products are Paper.
- Clearly identifiable plastic products are Plastic.
- Multiple significant unrelated objects should be Mixed.
- If the object cannot be reliably identified, use Other.
- If exact material cannot be visually determined, use Unknown.
- Never invent chemical/material composition.
- Do not infer anything from the filename.

Return ONLY valid JSON:

{
  "item_name": "...",
  "category": "...",
  "material": "...",
  "condition": "...",
  "reusable": true,
  "repairable": false,
  "recyclable": true,
  "recommended_action": "Recycle",
  "confidence": 0,
  "reason": "...",
  "visual_evidence": "..."
}

Confidence must reflect actual visual certainty.`;

  // Currently supported vision-capable Gemini models
  const modelsToTry = [
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-2.5-pro'
  ];

  let lastError: Error | null = null;
  const isKeyConfigured = Boolean(apiKey && apiKey.length > 0);

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        let safeErrMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const parsedErr = JSON.parse(errBody);
          if (parsedErr.error?.message) {
            safeErrMsg = parsedErr.error.message;
          }
        } catch (_) {}

        console.log(`[Gemini Debug] model: ${model} | HTTP status: ${response.status} | error: ${safeErrMsg}`);

        // If model is 404 unavailable, 503 overloaded, or 429 rate limited, try next model in fallback list
        if (response.status === 404 || response.status === 503 || response.status === 429) {
          lastError = new Error(`Gemini model ${model} unavailable (${safeErrMsg})`);
          continue;
        }
        throw new Error(`Gemini API call failed (${safeErrMsg})`);
      }

      const data = await response.json();
      const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!textOutput) {
        throw new Error('Empty response content returned by Gemini Vision API');
      }

      // Strip markdown code blocks if present
      const jsonClean = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
      const jsonMatch = jsonClean.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse valid JSON from Gemini Vision response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      parsed._modelUsed = model;
      parsed._httpStatus = response.status;
      return parsed;
    } catch (err: any) {
      lastError = err;
      if (err.message?.includes('404') || err.message?.includes('unavailable')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All supported Gemini vision models returned errors');
}

/**
 * Smart Validation & Sanitization Layer:
 * Enforces EcoLoop taxonomy and deterministic impact calculations.
 */
export function validateAndSanitizeAIResult(raw: any, providerName = 'Unknown Provider'): AIScanResult {
  // 1. Category Taxonomy Mapping
  let category: Category = 'Other';
  const rawCat = String(raw?.category || '').trim();

  if (VALID_CATEGORIES.includes(rawCat as Category)) {
    category = rawCat as Category;
  } else {
    category = mapRawCategoryToTaxonomy(rawCat, String(raw?.material || ''));
  }

  // 2. Material Validation & Normalized Confidence
  let material = String(raw?.material || 'Unknown').trim();
  let confidence = normalizeConfidence(raw?.confidence);

  const isConsistent = checkCategoryMaterialConsistency(category, material);
  if (!isConsistent) {
    material = `Unknown ${category === 'Other' || category === 'Mixed' ? '' : category} Material`.trim();
    confidence = Math.max(35, confidence - 20);
  } else if (material.toLowerCase() === 'unknown' || material.toLowerCase().includes('unknown')) {
    material = material.length > 20 ? material : `Unknown ${category} Material`;
  }

  // 3. Properties boolean normalization
  const reusable = Boolean(raw?.reusable);
  const repairable = Boolean(raw?.repairable);
  const recyclable = Boolean(raw?.recyclable ?? true);
  const condition = String(raw?.condition || 'Used - Fair').trim();

  // 4. Action Validation
  let recommended_action: CircularAction = 'Recycle';
  const rawAction = String(raw?.recommended_action || '').trim();

  if (VALID_ACTIONS.includes(rawAction as CircularAction)) {
    recommended_action = rawAction as CircularAction;
  }

  const guidedAction = determineGuidedAction(
    category,
    recommended_action,
    reusable,
    repairable,
    recyclable,
    condition,
    confidence
  );

  recommended_action = guidedAction;

  // 5. Deterministic Circularity Score calculation (Rule 5 requirement)
  const circularity_score = calculateDeterministicCircularityScore(
    recommended_action,
    reusable,
    repairable,
    recyclable,
    condition,
    confidence
  );

  // 6. Deterministic CO2 Estimate calculation (Rule 5 requirement - uses impact.ts)
  const co2_estimate = calculateCO2Avoided(category, recommended_action);

  // 7. Reason & Visual Evidence combination
  let reason = String(raw?.reason || 'AI circular audit completed.').trim();
  if (raw?.visual_evidence && typeof raw.visual_evidence === 'string') {
    reason += ` (Visual evidence: ${raw.visual_evidence})`;
  }

  return {
    item_name: String(raw?.item_name || `${category} Item`).trim(),
    category,
    material,
    condition,
    reusable,
    repairable,
    recyclable,
    recommended_action,
    circularity_score,
    confidence,
    reason,
    co2_estimate,
  };
}

function mapRawCategoryToTaxonomy(rawCat: string, rawMat: string): Category {
  const catLower = rawCat.toLowerCase();
  const matLower = rawMat.toLowerCase();

  if (catLower.includes('plastic') || matLower.includes('pet') || matLower.includes('hdpe') || matLower.includes('poly')) return 'Plastic';
  if (catLower.includes('paper') || catLower.includes('cardboard') || matLower.includes('paper') || matLower.includes('cardboard')) return 'Paper';
  if (catLower.includes('glass') || matLower.includes('glass')) return 'Glass';
  if (catLower.includes('metal') || catLower.includes('can') || matLower.includes('aluminum') || matLower.includes('steel')) return 'Metal';
  if (catLower.includes('textile') || catLower.includes('cloth') || catLower.includes('apparel') || matLower.includes('cotton') || matLower.includes('denim')) return 'Textile';
  if (catLower.includes('electron') || catLower.includes('device') || catLower.includes('appliance') || matLower.includes('pcb') || matLower.includes('circuit')) return 'Electronics';
  if (catLower.includes('furnit') || catLower.includes('chair') || catLower.includes('table') || matLower.includes('wood')) return 'Furniture';
  if (catLower.includes('organ') || catLower.includes('food') || catLower.includes('plant') || matLower.includes('compost')) return 'Organic';
  if (catLower.includes('mix') || catLower.includes('packag')) return 'Mixed';
  return 'Other';
}

function checkCategoryMaterialConsistency(category: Category, material: string): boolean {
  const mat = material.toLowerCase();
  switch (category) {
    case 'Plastic':
      return !(mat.includes('glass') || mat.includes('paper') || mat.includes('cardboard') || mat.includes('cotton') || mat.includes('wood'));
    case 'Paper':
      return !(mat.includes('glass') || mat.includes('metal') || mat.includes('plastic') || mat.includes('electronics'));
    case 'Glass':
      return !(mat.includes('paper') || mat.includes('plastic') || mat.includes('cotton') || mat.includes('denim'));
    case 'Metal':
      return !(mat.includes('glass') || mat.includes('paper') || mat.includes('cardboard') || mat.includes('cotton'));
    case 'Textile':
      return !(mat.includes('glass') || mat.includes('metal') || mat.includes('cardboard'));
    case 'Electronics':
      return !(mat.includes('cardboard') || mat.includes('organic') || mat.includes('food'));
    case 'Organic':
      return !(mat.includes('metal') || mat.includes('glass') || mat.includes('lithium') || mat.includes('plastic'));
    default:
      return true;
  }
}

function determineGuidedAction(
  category: Category,
  suggestedAction: CircularAction,
  reusable: boolean,
  repairable: boolean,
  recyclable: boolean,
  condition: string,
  confidence: number
): CircularAction {
  const condLower = condition.toLowerCase();
  const isDamaged = condLower.includes('damage') || condLower.includes('broken') || condLower.includes('crack');
  const isGood = condLower.includes('intact') || condLower.includes('good') || condLower.includes('new') || condLower.includes('clean');

  if (confidence < 45 && !reusable && !recyclable) {
    return 'Dispose';
  }

  if (category === 'Organic') {
    return 'Recycle';
  }

  if (category === 'Electronics') {
    if (repairable && isDamaged) return 'Repair';
    if (reusable && isGood) return 'Resell';
    return 'Recycle';
  }

  if (repairable && isDamaged) {
    return 'Repair';
  }

  if (reusable && isGood) {
    if (['Furniture', 'Textile'].includes(category)) return 'Donate';
    return suggestedAction === 'Resell' || suggestedAction === 'Donate' ? suggestedAction : 'Reuse';
  }

  if (recyclable) {
    return 'Recycle';
  }

  return suggestedAction;
}

function calculateDeterministicCircularityScore(
  action: CircularAction,
  reusable: boolean,
  repairable: boolean,
  recyclable: boolean,
  condition: string,
  confidence: number
): number {
  let score = 50;
  switch (action) {
    case 'Reuse': score = 92; break;
    case 'Resell': score = 88; break;
    case 'Donate': score = 86; break;
    case 'Repair': score = 82; break;
    case 'Recycle': score = 74; break;
    case 'Dispose': score = 20; break;
  }

  if (reusable) score += 4;
  if (repairable) score += 3;
  if (recyclable) score += 3;

  const condLower = (condition || '').toLowerCase();
  if (condLower.includes('new') || condLower.includes('intact')) score += 4;
  else if (condLower.includes('damaged') || condLower.includes('broken')) score -= 8;

  if (confidence < 70) score = Math.max(25, score - 15);

  return Math.min(100, Math.max(0, Math.round(score)));
}

function selectDemoSeedByImage(imageDataUrl: string): AIScanResult {
  let hash = 0;
  for (let i = 0; i < imageDataUrl.length; i++) {
    hash = (hash << 5) - hash + imageDataUrl.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SEED_DEMO_ITEMS.length;
  return SEED_DEMO_ITEMS[index];
}

