const fs = require('fs');

// Create a valid 10x10 dummy JPEG Base64
const sampleJpegBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function testPipeline() {
  console.log('Testing EcoLoop Scanner Image Pipeline...');

  // Load modules
  try {
    const { extractCleanBase64AndMime } = require('./lib/services/ai');
    const { base64Data, mimeType, byteSize } = extractCleanBase64AndMime(sampleJpegBase64);

    console.log('1. Base64 & MIME Extraction:');
    console.log('   - MIME:', mimeType);
    console.log('   - Byte Size:', byteSize, 'bytes');
    console.log('   - Base64 length:', base64Data.length, 'chars');

    if (mimeType !== 'image/jpeg' || byteSize === 0) {
      console.error('FAILED extraction test!');
      process.exit(1);
    }

    console.log('2. Pipeline test passed successfully!');
  } catch (err) {
    console.error('Error in test script:', err);
  }
}

testPipeline();
