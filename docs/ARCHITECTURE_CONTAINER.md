# 9JA AI Platform v1.0 Container Diagram

## C4 Model — Level 2

```mermaid
flowchart TB
  subgraph Client[Client Layer]
    Web[Frontend]
    MobileApp[Mobile App]
    DesktopApp[Desktop App]
    SDK[Developer SDK]
  end

  subgraph Backend[Backend Services]
    API[Backend API]
    AuthSvc[Security Platform]
    DevPlatform[Developer Platform]
    Ops[Operations Center]
  end

  subgraph Core[AI Platform Services]
    AIService[AIService]
    Orchestrator[AI Orchestrator]
    Registry[Capability Registry]
    Scheduler[Inference Scheduler]
    Runtime[Inference Runtime]
    KnowledgeSvc[Knowledge Services]
    MemorySvc[Memory Services]
    Connector[Connector Runtime]
    ModelWorkers[Model Workers]
  end

  subgraph Data[Data and Storage]
    DB[(Databases)]
    Vector[(Vector Store)]
    Objects[(Object Storage)]
    Cache[(Cache)]
    Queue[(Message Queue)]
    Config[(Configuration Store)]
    Audit[(Audit Store)]
  end

  Web --> API
  MobileApp --> API
  DesktopApp --> API
  SDK --> API
  API --> AuthSvc
  API --> AIService
  AIService --> Orchestrator
  Orchestrator --> Registry
  Orchestrator --> Scheduler
  Scheduler --> Runtime
  Runtime --> ModelWorkers
  Runtime --> KnowledgeSvc
  Runtime --> MemorySvc
  Runtime --> Connector
  KnowledgeSvc --> Vector
  MemorySvc --> DB
  Connector --> Queue
  Connector --> Objects
  AuthSvc --> Config
  AuthSvc --> Audit
  Ops --> DB
  Ops --> Queue
  Ops --> Cache
  Ops --> Config
```

## Deployable Containers
- Frontend
- Backend API
- AI Platform Services
- Inference Runtime
- Knowledge Services
- Memory Services
- Model Workers
- Connector Runtime
- Security Platform
- Developer Platform
- Operations Center
- Databases and storage services
