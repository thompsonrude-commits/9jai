# Universal Integration & Connector Platform

The Universal Integration & Connector Platform (UICP) provides the modular integration layer for the 9JA AI platform.

## Included modules

- Connector framework and lifecycle orchestration
- Connector registry and capability discovery
- Authentication manager with API key, OAuth/OIDC, refresh, and rotation support
- Credential vault abstraction for secure secret storage
- Webhook engine for incoming and outgoing event processing
- Retry and circuit-breaker resilience
- Health monitoring and diagnostics
- API gateway, connection pooling, rate limiting, sandboxing, versioning, and metrics

## Usage

```ts
import {
  ConnectorFramework,
  InMemoryConnectorRegistry,
  DefaultAuthenticationManager,
  InMemoryCredentialVault,
} from './core/integrations/index.js';
```

## Verification

The dedicated connector test suite can be run with:

```bash
npm run test:connectors
```
