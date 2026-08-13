export class CrossReferenceEngine {
  private links: Array<{ from: string; to: string; type?: string }> = [];

  link(fromId: string, toId: string, type = 'ref') {
    this.links.push({ from: fromId, to: toId, type });
  }

  findRelated(id: string) {
    const out = this.links.filter((l) => l.from === id).map((l) => l.to);
    const inbound = this.links.filter((l) => l.to === id).map((l) => l.from);
    return Array.from(new Set([...out, ...inbound]));
  }
}
