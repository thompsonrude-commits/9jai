# 9JA AI Platform v1.0 System Context Diagram

## C4 Model — Level 1

```mermaid
flowchart LR
  User[Users] --> App[Web Application]
  User --> Mobile[Mobile Application]
  User --> Desktop[Desktop Application]
  Developer[Developer SDK] --> App
  App --> API[Backend API]
  Desktop --> API
  Mobile --> API
  Developer --> API
  API --> Auth[Authentication Services]
  API --> Models[AI Models]
  API --> Knowledge[Knowledge Storage]
  API --> Connectors[External Connectors]
  API --> Monitor[Monitoring Systems]
  API --> Integrations[Third-party Integrations]
  Models --> API
  Knowledge --> API
  Connectors --> API
  Monitor --> API
```

## System Boundaries
- Internal platform boundary: 9JA AI Platform services and runtime
- External systems: users, SDKs, AI models, authentication services, monitoring systems, third-party connectors

## Primary Actors
- End users
- Developers
- Platform operators
- Integrators
