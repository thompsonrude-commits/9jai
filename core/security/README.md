# Enterprise Security, Governance & Trust Platform

The Enterprise Security, Governance & Trust Platform (ESGTP) provides the centralized security layer for the 9JA AI platform.

## Included modules

- Identity and session management
- Authentication and authorization services
- Versioned policy engine
- Secret storage abstraction
- Encryption engine
- Audit and trust ledgers
- Tenant isolation and sandbox execution

## Usage

```ts
import {
  InMemoryIdentityStore,
  DefaultAuthenticationService,
  DefaultAuthorizationService,
  DefaultPolicyEngine,
  InMemorySecretStore,
  DefaultEncryptionEngine,
  DefaultAuditEngine,
  DefaultTrustLedger,
  DefaultTenantIsolationManager,
  DefaultSecuritySandbox,
} from './core/security/index.js';
```

## Verification

Run the dedicated suite with:

```bash
node --import tsx/esm --test core/security/securityPlatform.test.ts
```
