const fs = require('fs');
const path = require('path');

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

async function listModels() {
  console.log('Listing available models for key...');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const res = await fetch(url);
    console.log('HTTP Status:', res.status, res.statusText);
    const data = await res.json();
    console.log('Available models:');
    if (data.models) {
      data.models.forEach(m => console.log(' -', m.name, '| Methods:', m.supportedGenerationMethods));
    } else {
      console.log('Response body:', data);
    }
  } catch (err) {
    console.error('Error listing models:', err);
  }
}

listModels();
