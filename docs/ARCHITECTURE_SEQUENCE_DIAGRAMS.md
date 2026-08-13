# 9JA AI Platform v1.0 Sequence Diagrams

## Standard Chat Request
```mermaid
sequenceDiagram
  participant User
  participant API as Backend API
  participant Auth as Auth
  participant AI as AIService
  participant Orchestrator
  participant Registry
  participant Scheduler
  participant Runtime
  participant Engine
  participant Audit
  User->>API: Request
  API->>Auth: Authenticate
  Auth-->>API: OK
  API->>AI: Process request
  AI->>Orchestrator: Route request
  Orchestrator->>Registry: Resolve capability
  Registry-->>Orchestrator: Engine selection
  Orchestrator->>Scheduler: Submit job
  Scheduler->>Runtime: Execute
  Runtime->>Engine: Invoke engine
  Engine-->>Runtime: Output
  Runtime-->>Scheduler: Result
  Scheduler-->>Orchestrator: Completed
  Orchestrator->>Audit: Audit event
  Orchestrator-->>API: Response
  API-->>User: Response
```

## Knowledge Retrieval
```mermaid
sequenceDiagram
  participant Orchestrator
  participant Knowledge
  participant Store as Knowledge Store
  participant Vector as Vector Store
  Orchestrator->>Knowledge: Query knowledge
  Knowledge->>Vector: Retrieve embeddings
  Vector-->>Knowledge: Matches
  Knowledge->>Store: Fetch documents
  Store-->>Knowledge: Documents
  Knowledge-->>Orchestrator: Context
```

## Memory Retrieval
```mermaid
sequenceDiagram
  participant Orchestrator
  participant Memory
  participant Short as Short-Term Memory
  participant Long as Long-Term Memory
  Orchestrator->>Memory: Request context
  Memory->>Short: Read active context
  Memory->>Long: Read durable context
  Short-->>Memory: Context
  Long-->>Memory: Context
  Memory-->>Orchestrator: Context bundle
```

## Connector Synchronization
```mermaid
sequenceDiagram
  participant Connector
  participant Auth as Auth
  participant Sync as Sync Engine
  participant Remote as External System
  Connector->>Auth: Authenticate
  Auth-->>Connector: Token
  Connector->>Sync: Start sync
  Sync->>Remote: Pull or push data
  Remote-->>Sync: Payload
  Sync-->>Connector: State updated
```

## Authentication and Authorization
```mermaid
sequenceDiagram
  participant Client
  participant Authn as Authentication
  participant Authz as Authorization
  participant Policy as Policy Engine
  Client->>Authn: Login / token
  Authn-->>Client: Session
  Client->>Authz: Perform action
  Authz->>Policy: Evaluate policy
  Policy-->>Authz: Permit / Deny
  Authz-->>Client: Decision
```

## Failure Recovery
```mermaid
sequenceDiagram
  participant Scheduler
  participant Retry as Retry Manager
  participant Circuit as Circuit Breaker
  participant Recovery as Recovery Manager
  Scheduler->>Retry: Submit failed task
  Retry->>Circuit: Check health
  Circuit-->>Retry: Open / Closed
  Retry->>Recovery: Trigger recovery path
  Recovery-->>Scheduler: Requeue / fallback
```
