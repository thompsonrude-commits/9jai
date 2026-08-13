import type { ApiGateway } from './types';

export class DefaultApiGateway implements ApiGateway {
  private routes = new Map<string, (request: unknown) => Promise<unknown> | unknown>();

  registerRoute(path: string, handler: (request: unknown) => Promise<unknown> | unknown): void {
    this.routes.set(path, handler);
  }

  async route(request: unknown): Promise<unknown> {
    const path = (request as { path?: string }).path ?? '/';
    const handler = this.routes.get(path);
    if (!handler) {
      throw new Error(`No route registered for ${path}`);
    }
    return handler(request);
  }
}
