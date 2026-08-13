const url = 'https://api.groq.com/openai/v1/models';
const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${process.env.GROQ_KEY}` } });
console.log('status', resp.status);
const data = await resp.json();
console.log(JSON.stringify(data, null, 2));
