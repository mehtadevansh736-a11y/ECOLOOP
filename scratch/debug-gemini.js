const fs = require('fs');
const path = require('path');

// Manually parse .env.local
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
console.log('GEMINI_API_KEY configured:', Boolean(apiKey && apiKey.length > 0));

async function debugGeminiCall() {
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];
  
  // A tiny 1x1 white pixel jpeg base64
  const dummyBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  for (const model of models) {
    console.log(`\n--- Testing Model: ${model} ---`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Identify the object in this image. Respond in JSON." },
              { inline_data: { mime_type: "image/jpeg", data: dummyBase64 } }
            ]
          }]
        })
      });

      console.log(`HTTP status: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log(`Response Body:`, text);
    } catch (err) {
      console.error(`Fetch Error for ${model}:`, err.message);
    }
  }

  // Also test with Bearer Token header just in case it's an OAuth token
  console.log(`\n--- Testing with Bearer Authorization header ---`);
  const urlBearer = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
  try {
    const res = await fetch(urlBearer, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Identify the object in this image. Respond in JSON." },
            { inline_data: { mime_type: "image/jpeg", data: dummyBase64 } }
          ]
        }]
      })
    });
    console.log(`Bearer HTTP status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Bearer Response Body:`, text);
  } catch (err) {
    console.error(`Bearer Fetch Error:`, err.message);
  }
}

debugGeminiCall();
