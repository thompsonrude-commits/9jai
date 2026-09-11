// Quick test script to verify Groq API key works
import fetch from 'node-fetch';

async function testGroqAPI() {
  const apiKey = process.env.GROQ_KEY || 'gsk_YRVIlb63QtBXRaz9KGgYWGdyb3FYlsF107BxObHKdI6Z5XGUyDhz5OjH';
  
  console.log('Testing Groq API...');
  console.log('API Key:', apiKey.substring(0, 15) + '...');
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say hello in one word' }],
        max_tokens: 10
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Groq API Error:', response.status, error);
      process.exit(1);
    }
    
    const data = await response.json();
    console.log('✅ Groq API Response:', data.choices[0].message.content);
    console.log('✅ API Key is VALID and working!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    process.exit(1);
  }
}

testGroqAPI();
