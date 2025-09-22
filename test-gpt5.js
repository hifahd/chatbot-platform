require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testGPT5() {
  // Test GPT-5 first
  try {
    console.log('Testing GPT-5 with Responses API...');

    const response = await openai.responses.create({
      model: 'gpt-5-mini',
      input: 'Say "GPT-5 is working!"',
      reasoning: { effort: 'minimal' },
      text: { verbosity: 'low' }
    });

    console.log('✅ GPT-5 Success!');
    console.log('Response:', response.output_text || response);
    return;

  } catch (error) {
    console.log('❌ GPT-5 Error:', error.message);
    console.log('Code:', error.code);
  }

  // Fallback: Test GPT-4o with Responses API
  try {
    console.log('\nTesting GPT-4o with Responses API...');

    const response = await openai.responses.create({
      model: 'gpt-4o',
      input: 'Say "GPT-4o with Responses API is working!"',
      reasoning: { effort: 'minimal' },
      text: { verbosity: 'low' }
    });

    console.log('✅ GPT-4o Success!');
    console.log('Response:', response.output_text || response);

  } catch (error) {
    console.log('❌ GPT-4o Error:', error.message);
    console.log('Status:', error.status);
    console.log('Code:', error.code);
  }

  // Final test: Basic Responses API without advanced parameters
  try {
    console.log('\nTesting basic Responses API with GPT-4o-mini...');

    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: 'Say "Basic Responses API is working!"'
    });

    console.log('✅ Basic Responses API Success!');
    console.log('Response:', response.output_text || response);

  } catch (error) {
    console.log('❌ Basic Responses API Error:', error.message);
    console.log('Status:', error.status);
    console.log('Code:', error.code);
    console.log('\n📝 Final Recommendation: Stay with current Chat Completions API - Responses API not ready');
  }
}

testGPT5();