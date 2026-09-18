const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

async function testEndToEnd() {
  console.log('=== END-TO-END GEMINI VISION TEST ===');
  console.log('GEMINI_API_KEY Configured:', Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 0));
  console.log('NEXT_PUBLIC_DEMO_MODE:', process.env.NEXT_PUBLIC_DEMO_MODE);

  // High quality sample image of a plastic water bottle (Base64 JPEG)
  const pureBase64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  const mimeType = "image/jpeg";

  const apiKey = process.env.GEMINI_API_KEY;
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
}`;

  const models = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-2.5-pro'];

  for (const model of models) {
    console.log(`\nTrying Gemini Model: ${model}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
              { inline_data: { mime_type: mimeType, data: pureBase64 } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: "application/json"
          }
        })
      });

      console.log(`HTTP Status for ${model}:`, res.status, res.statusText);
      const data = await res.json();
      
      if (res.ok) {
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('\n--- REAL GEMINI VISION RESPONSE ---');
        console.log(textOutput);
        console.log(`\nSUCCESSFULLY RECEIVED RESPONSE FROM MODEL: ${model}!`);
        break;
      } else {
        console.log(`Model ${model} returned non-200 status:`, data.error?.message || data);
      }
    } catch (err) {
      console.error(`Error testing ${model}:`, err.message);
    }
  }
}

testEndToEnd();
