import type { OrchestratorRequest, Intent } from './types';
import { orchestratorEvents } from './events';

export class IntentAnalyzer {
  analyze(req: OrchestratorRequest): Intent[] {
    const text = typeof req.input === 'string' ? req.input : JSON.stringify(req.input || {});
    const intents: Intent[] = [];
    if (req.type) intents.push({ name: req.type, confidence: 0.99 });
    if (/ocr|scan|receipt/i.test(text)) intents.push({ name: 'ocr', confidence: 0.9 });
    if (/image|generate|create image|draw|art/i.test(text)) intents.push({ name: 'image_generation', confidence: 0.9 });
    if (/translate|translation/i.test(text)) intents.push({ name: 'translation', confidence: 0.9 });
    if (intents.length === 0) intents.push({ name: 'chat', confidence: 0.6 });
    orchestratorEvents.emitEvent({ type: 'IntentDetected', requestId: req.id ?? '', intents });
    return intents;
  }
}
