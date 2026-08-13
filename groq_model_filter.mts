const resp = await fetch('https://api.groq.com/openai/v1/models', { headers: { 'Authorization': `Bearer ${process.env.GROQ_KEY}` } });
const data = await resp.json();
const imageModels = data.data.filter((m:any)=>m.input_modalities?.includes('image') && m.output_modalities?.includes('text'));
console.log(imageModels.map((m:any)=>({id:m.id,name:m.name,input_modalities:m.input_modalities,output_modalities:m.output_modalities}))); 
