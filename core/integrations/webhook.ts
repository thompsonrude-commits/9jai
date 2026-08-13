import { createHmac } from 'crypto';
import type { IncomingWebhookEvent, WebhookDefinition, WebhookEngine } from './types';

export class DefaultWebhookEngine implements WebhookEngine {
  private webhooks = new Map<string, WebhookDefinition>();
  private subscriptions = new Map<string, Array<(event: IncomingWebhookEvent) => Promise<void> | void>>();

  async registerWebhook(definition: WebhookDefinition): Promise<void> {
    this.webhooks.set(definition.id, definition);
  }

  async subscribe(eventType: string, handler: (event: IncomingWebhookEvent) => Promise<void> | void): Promise<void> {
    const handlers = this.subscriptions.get(eventType) ?? [];
    handlers.push(handler);
    this.subscriptions.set(eventType, handlers);
  }

  async processIncomingWebhook(event: IncomingWebhookEvent): Promise<boolean> {
    if (!event.expectedSignature && event.signature) {
      return false;
    }

    if (event.expectedSignature && event.signature !== event.expectedSignature) {
      return false;
    }

    for (const handler of this.subscriptions.get(event.type) ?? []) {
      await handler(event);
    }

    return true;
  }

  private computeSignature(payload: unknown, secret?: string): string {
    if (!secret) return '';
    const serialized = JSON.stringify(payload);
    return `sha256=${createHmac('sha256', secret).update(serialized).digest('hex')}`;
  }
}
