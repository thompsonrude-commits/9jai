export class ErrorCoordinator {
  formatError(err: any) {
    return { message: err?.message ?? String(err), code: err?.code ?? 'ERR' };
  }
}
