**NLIE Public API**

Module: `core/nlie`

Exports:
- `NlieEngine` — constructor: `new NlieEngine(options?: NlieEngineOptions, registry?: CapabilityRegistry, orchestrator?: AIOrchestrator, runtime?: ModelRuntime)`
- `NlieRequest`, `NlieResult`, and related types in `types.ts`.
- `nlieEvents` — emits `NlieRequested`, `NlieCompleted`, `NlieFailed`.

Adapter Contract (AI Orchestrator):
- Capability: `nlie.language`
- Adapter shape: `{ engineId: string, capability: string, execute: (req) => Promise<any> }`
- Input to `execute` should be `{ input: NlieRequest }`.

Result shape:
- `{ success: boolean, result?: NlieResult, error?: string }`
