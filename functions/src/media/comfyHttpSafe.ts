import fetch from 'node-fetch';

export async function submitWorkflowHttp(workflow: any, endpoint: string, apiKey?: string): Promise<string> {
  const headers: Record<string,string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    // Use Bearer token when an API key is configured; keep it optional for unauthenticated ComfyUI deployments
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const resp = await fetch(`${endpoint}/prompt`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt: workflow }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`ComfyUI submission failed: ${resp.status} ${text}`);
  }

  const data = await resp.json() as any;
  if (!data.prompt_id) throw new Error('ComfyUI did not return prompt_id');
  return data.prompt_id;
}
