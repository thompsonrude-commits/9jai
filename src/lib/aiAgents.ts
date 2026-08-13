/**
 * AI Agents — Autonomous multi-step reasoning agents
 * Each agent can plan, execute, and synthesize results across multiple steps
 */

import { unifiedChatStream } from './ai';

// ── Types ──────────────────────────────────────────────────────────────────

export type AgentType =
  | 'researcher'
  | 'coder'
  | 'translator'
  | 'tutor'
  | 'summarizer'
  | 'content-creator'
  | 'planner'
  | 'analyst'
  | 'swarm-coordinator'
  | 'cultural-expert';

export interface AgentStep {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'done' | 'error';
  result?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface AgentTask {
  id: string;
  type: AgentType;
  goal: string;
  steps: AgentStep[];
  finalResult?: string;
  status: 'planning' | 'executing' | 'done' | 'error';
  createdAt: number;
  completedAt?: number;
}

export interface AgentPlan {
  steps: { description: string; tool: string }[];
  reasoning: string;
}

// ── Agent system prompts ───────────────────────────────────────────────────

const AGENT_PROMPTS: Record<AgentType, string> = {
  researcher: `You are a Research Agent. Your job is to:
1. Break down research questions into sub-questions
2. Search for information systematically
3. Synthesize findings into clear, accurate reports
4. Cite sources and note confidence levels
5. Identify gaps in knowledge
Always be thorough, accurate, and cite your reasoning.`,

  coder: `You are a Code Agent. Your job is to:
1. Understand the coding requirement fully
2. Plan the architecture before writing code
3. Write clean, commented, working code
4. Test edge cases mentally
5. Provide usage examples
Always write production-quality code with error handling.`,

  translator: `You are a Translation Agent specialized in African languages. Your job is to:
1. Identify the source and target languages
2. Translate accurately preserving meaning and tone
3. Provide cultural context when relevant
4. Note any untranslatable concepts
5. Offer pronunciation guides for African languages
Always preserve cultural nuance and authenticity.`,

  tutor: `You are a Tutoring Agent. Your job is to:
1. Assess the student's current level
2. Break down complex concepts into simple steps
3. Use examples and analogies
4. Check understanding with questions
5. Provide practice exercises
6. Give encouraging, constructive feedback
Always adapt to the student's pace and learning style.`,

  summarizer: `You are a Summarization Agent. Your job is to:
1. Identify the key points and main ideas
2. Remove redundancy while preserving meaning
3. Organize information logically
4. Highlight the most important insights
5. Provide both brief and detailed summaries
Always be accurate and never distort the original meaning.`,

  'content-creator': `You are a Content Creation Agent. Your job is to:
1. Understand the content goal and audience
2. Plan the content structure
3. Write engaging, original content
4. Optimize for clarity and impact
5. Add cultural relevance for African audiences
Always create content that is authentic, engaging, and culturally aware.`,

  planner: `You are a Planning Agent. Your job is to:
1. Break down complex goals into actionable steps
2. Identify dependencies and priorities
3. Estimate time and resources needed
4. Identify potential obstacles
5. Create clear, executable plans
Always be practical, realistic, and thorough.`,

  analyst: `You are an Analysis Agent. Your job is to:
1. Examine data and information critically
2. Identify patterns and trends
3. Draw evidence-based conclusions
4. Present findings clearly
5. Make actionable recommendations
Always be objective, data-driven, and clear.`,

  'swarm-coordinator': `You are the Swarm Intelligence Coordinator. Your job is to:
1. Orchestrate multiple specialized models to solve complex logic tasks.
2. Verify mathematical and coding results using peer-review logic.
3. Resolve conflicting outputs by identifying the strongest reasoning path.
4. Synthesize a "Master Response" that is 100% verified.`,

  'cultural-expert': `You are the Nigerian Cultural Wisdom Agent. Your job is to:
1. Infuse every response with hyper-localized context (History, Proverbs, Law).
2. Translate complex western concepts into local analogies.
3. Ensure cultural authenticity across all 40+ supported languages.`,
};

// ── Agent detector — determines if a task needs an agent ──────────────────

export function detectAgentTask(message: string): { needsAgent: boolean; type?: AgentType; complexity: number } {
  const lower = message.toLowerCase();

  // High complexity indicators
  const complexityKeywords = [
    'research', 'analyze', 'plan', 'create a full', 'build a complete',
    'write a detailed', 'explain everything', 'comprehensive', 'step by step',
    'teach me', 'help me learn', 'summarize this', 'translate this document',
    'write a report', 'create a plan', 'develop a strategy',
  ];

  const complexity = complexityKeywords.filter(k => lower.includes(k)).length;

  if (lower.includes('research') || lower.includes('find information about') || lower.includes('tell me everything about')) {
    return { needsAgent: true, type: 'researcher', complexity: complexity + 2 };
  }

  if (lower.includes('write code') || lower.includes('build') || lower.includes('create app') || lower.includes('develop')) {
    return { needsAgent: true, type: 'coder', complexity: complexity + 2 };
  }

  if (lower.includes('translate') && (lower.includes('document') || lower.includes('paragraph') || lower.includes('text'))) {
    return { needsAgent: true, type: 'translator', complexity: complexity + 1 };
  }

  if (lower.includes('teach me') || lower.includes('explain') || lower.includes('how does') || lower.includes('tutor')) {
    return { needsAgent: complexity >= 1, type: 'tutor', complexity };
  }

  if (lower.includes('summarize') || lower.includes('summary of') || lower.includes('tldr')) {
    return { needsAgent: true, type: 'summarizer', complexity: complexity + 1 };
  }

  if (lower.includes('write') && (lower.includes('article') || lower.includes('essay') || lower.includes('blog') || lower.includes('post'))) {
    return { needsAgent: true, type: 'content-creator', complexity: complexity + 2 };
  }

  if (lower.includes('plan') || lower.includes('strategy') || lower.includes('roadmap') || lower.includes('schedule')) {
    return { needsAgent: true, type: 'planner', complexity: complexity + 1 };
  }

  if (lower.includes('analyze') || lower.includes('analysis') || lower.includes('compare') || lower.includes('evaluate')) {
    return { needsAgent: true, type: 'analyst', complexity: complexity + 1 };
  }

  return { needsAgent: false, complexity };
}

// ── Agent planner — creates execution steps ────────────────────────────────

export async function planAgentTask(goal: string, type: AgentType): Promise<AgentStep[]> {
  const planningPrompt = `You are an AI agent planner. Given this goal: "${goal}"

Create a step-by-step execution plan with 3-5 concrete steps.
Each step should be specific and actionable.

Respond ONLY with a JSON array like this:
[
  {"description": "Step 1 description"},
  {"description": "Step 2 description"},
  {"description": "Step 3 description"}
]

No other text. Just the JSON array.`;

  let planText = '';
  try {
    for await (const chunk of unifiedChatStream([
      { role: 'system', content: AGENT_PROMPTS[type] },
      { role: 'user', content: planningPrompt },
    ], 0.3)) {
      planText += chunk;
    }

    // Extract JSON from response
    const jsonMatch = planText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((step: any, i: number) => ({
        id: `step_${i}_${Date.now()}`,
        description: step.description,
        status: 'pending' as const,
      }));
    }
  } catch (err) {
    console.warn('[Agent] Planning failed, using default steps:', err);
  }

  // Fallback default steps
  return [
    { id: `step_0_${Date.now()}`, description: 'Analyze the request', status: 'pending' },
    { id: `step_1_${Date.now()}`, description: 'Gather relevant information', status: 'pending' },
    { id: `step_2_${Date.now()}`, description: 'Process and synthesize', status: 'pending' },
    { id: `step_3_${Date.now()}`, description: 'Generate final response', status: 'pending' },
  ];
}

// ── Agent executor — runs a single step ───────────────────────────────────

export async function* executeAgentStep(
  goal: string,
  step: AgentStep,
  stepIndex: number,
  totalSteps: number,
  previousResults: string[],
  type: AgentType
): AsyncGenerator<string> {
  const context = previousResults.length > 0
    ? `\n\nPrevious steps completed:\n${previousResults.map((r, i) => `Step ${i + 1}: ${r.slice(0, 200)}...`).join('\n')}`
    : '';

  const stepPrompt = `Overall goal: ${goal}

You are on step ${stepIndex + 1} of ${totalSteps}: "${step.description}"
${context}

Execute this specific step thoroughly. Be detailed and accurate.`;

  for await (const chunk of unifiedChatStream([
    { role: 'system', content: AGENT_PROMPTS[type] },
    { role: 'user', content: stepPrompt },
  ], 0.7)) {
    yield chunk;
  }
}

// ── Agent synthesizer — combines all step results ─────────────────────────

export async function* synthesizeAgentResults(
  goal: string,
  steps: AgentStep[],
  type: AgentType
): AsyncGenerator<string> {
  const stepsContext = steps
    .filter(s => s.result)
    .map((s, i) => `**Step ${i + 1}: ${s.description}**\n${s.result}`)
    .join('\n\n---\n\n');

  const synthesisPrompt = `You completed a multi-step task with this goal: "${goal}"

Here are the results from each step:

${stepsContext}

Now synthesize all of this into a comprehensive, well-organized final response.
Make it clear, actionable, and complete. Format it beautifully with headers and structure.`;

  for await (const chunk of unifiedChatStream([
    { role: 'system', content: AGENT_PROMPTS[type] },
    { role: 'user', content: synthesisPrompt },
  ], 0.7)) {
    yield chunk;
  }
}

// ── Full agent runner — orchestrates the entire agent pipeline ─────────────

export async function* runAgent(
  goal: string,
  type: AgentType,
  onStepUpdate?: (task: AgentTask) => void
): AsyncGenerator<{ type: 'step_update'; task: AgentTask } | { type: 'content'; text: string } | { type: 'done'; task: AgentTask }> {
  const task: AgentTask = {
    id: `agent_${Date.now()}`,
    type,
    goal,
    steps: [],
    status: 'planning',
    createdAt: Date.now(),
  };

  // Phase 1: Plan
  yield { type: 'step_update', task: { ...task } };
  task.steps = await planAgentTask(goal, type);
  task.status = 'executing';
  yield { type: 'step_update', task: { ...task } };

  // Phase 2: Execute each step
  const previousResults: string[] = [];

  for (let i = 0; i < task.steps.length; i++) {
    task.steps[i].status = 'running';
    task.steps[i].startedAt = Date.now();
    yield { type: 'step_update', task: { ...task } };

    let stepResult = '';
    try {
      for await (const chunk of executeAgentStep(goal, task.steps[i], i, task.steps.length, previousResults, type)) {
        stepResult += chunk;
      }
      task.steps[i].result = stepResult;
      task.steps[i].status = 'done';
      task.steps[i].completedAt = Date.now();
      previousResults.push(stepResult);
    } catch (err) {
      task.steps[i].status = 'error';
      task.steps[i].result = 'Step failed';
    }

    yield { type: 'step_update', task: { ...task } };
  }

  // Phase 3: Synthesize
  let finalResult = '';
  for await (const chunk of synthesizeAgentResults(goal, task.steps, type)) {
    finalResult += chunk;
    yield { type: 'content', text: chunk };
  }

  task.finalResult = finalResult;
  task.status = 'done';
  task.completedAt = Date.now();
  yield { type: 'done', task: { ...task } };
}
