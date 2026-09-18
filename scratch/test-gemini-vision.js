const fs = require('fs');
const path = require('path');

// Read .env.local
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

const apiKey = process.env.GEMINI_API_KEY;

// Create a realistic test image (or use seed item image)
const testImageBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

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

async function testVision() {
  const models = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.5-pro'];

  const pureBase64 = testImageBase64.split(',')[1];

  for (const model of models) {
    console.log(`\n================ Testing Model: ${model} ================`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
              { inline_data: { mime_type: "image/jpeg", data: pureBase64 } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: "application/json"
          }
        })
      });

      console.log(`HTTP Status: ${res.status} ${res.statusText}`);
      const data = await res.json();
      console.log('Response:', JSON.stringify(data, null, 2));

      if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log(`SUCCESS WITH MODEL: ${model}!`);
        break;
      }
    } catch (err) {
      console.error(`Error testing ${model}:`, err.message);
    }
  }
}

testVision();
