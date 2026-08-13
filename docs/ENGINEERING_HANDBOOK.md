# 9JA AI Engineering Handbook

> This handbook is the official engineering standard for the 9JA AI Platform. It defines how contributors design, implement, test, review, deploy, document, and maintain software for the platform. It complements the architecture reference in [ARCHITECTURE.md](ARCHITECTURE.md) rather than duplicating it.

## Purpose

This handbook exists to make the platform:

- predictable for contributors,
- safe to evolve over time,
- consistent across teams and repositories,
- suitable for internal engineering and open-source collaboration.

Every change to the platform should be made in a way that preserves these standards.

---

## 1. Engineering Principles

The platform is built around the following engineering principles.

### Simplicity
- Prefer clear, direct implementations over clever abstractions.
- Solve the current problem without introducing unnecessary indirection.
- Keep modules focused on one responsibility.

### Maintainability
- Write code that another engineer can understand and extend in the future.
- Favor readable structures, explicit contracts, and self-documenting naming.
- Avoid hidden state and side effects where possible.

### Security by Design
- Assume every input is untrusted.
- Secure authentication, authorization, secrets, encryption, and auditing are mandatory.
- Security controls must be part of the design, not an afterthought.

### Performance by Default
- Build efficient code paths from the beginning.
- Avoid unnecessary memory allocation, synchronous blocking, and repeated work.
- Use caching, batching, and async processing where appropriate.

### API First
- Platform capabilities should be exposed through stable, versioned APIs.
- Design interfaces before implementation.
- Prefer explicit contracts over implicit behavior.

### Plugin First
- New capabilities should be extendable through plug-in interfaces where possible.
- Avoid hard-coding feature-specific logic into core services.

### Connector First
- External integrations should use a consistent connector contract and lifecycle.
- Connector behavior should be resilient, observable, and testable.

### African Language First
- Language-specific behavior must be treated as a first-class engineering concern.
- Do not degrade quality, accuracy, or locale handling for Nigerian and African languages.
- Ensure language-aware testing, documentation, and evaluation.

### Testability
- Design for testing from the start.
- Keep logic composable, deterministic, and observable.
- Write tests alongside implementation.

### Observability
- Every significant workflow should emit logs, metrics, traces, or state updates.
- The absence of observability is treated as an implementation gap.

### Reliability
- Handle failures gracefully with retries, fallbacks, circuit breaking, and recovery paths.
- Prefer deterministic behavior under partial failure.

### Backward Compatibility
- Preserve public APIs and extension points whenever possible.
- Introduce new versions rather than silently breaking existing integrations.

---

## 2. Repository Structure

The repository is organized to separate product surfaces, platform services, and supporting assets.

### Directory Organization
- [app](../app) — product-facing application UI and client-side experience.
- [backend](../backend) — server-side application services and coordination logic.
- [functions](../functions) — serverless or function-based backend handlers.
- [core](../core) — shared platform services, engines, runtime, security, operations, release, and infrastructure abstractions.
- [docs](../docs) — architecture, handbook, ADRs, and supporting engineering documentation.
- [public](../public) — static assets.
- [scripts](../scripts) — automation and maintenance scripts.
- [src](../src) — source entry points and application-specific implementation.
- [ai-lab](../ai-lab) — experiments, evaluation, datasets, and research workflows.

### Module Boundaries
- Platform logic belongs in [core](../core).
- Application and UI logic belongs in [app](../app) and [src](../src).
- Backend integrations belong in [backend](../backend) and [functions](../functions).
- Experimental or research content belongs in [ai-lab](../ai-lab) and should not become part of the production runtime without review.

### Shared Libraries
- Shared libraries and reusable platform services must live in [core](../core) or a clearly named shared package.
- Application-specific code should not duplicate platform capabilities already implemented in the shared layers.

### Package Ownership
- Each major domain should have clear ownership boundaries.
- A package or module should own its schema, contracts, tests, and documentation.
- Cross-cutting concerns such as security, observability, and release should be treated as platform-level responsibilities.

### Naming Conventions
- Use PascalCase for classes, interfaces, and React components.
- Use camelCase for variables, functions, and methods.
- Use UPPER_SNAKE_CASE for constants and static configuration keys.
- Use descriptive file names that match the exported concern.
- Use suffixes such as Service, Engine, Manager, Registry, Provider, and Adapter where appropriate.

### Dependency Rules
- Do not introduce circular dependencies.
- Prefer dependencies that move in one direction only: platform services to application surfaces, never the reverse.
- Keep dependencies minimal and explicit.
- Avoid importing implementation details from unrelated modules.

### Import Rules
- Prefer imports from the owning module or package.
- Avoid deep relative imports when a stable public export exists.
- Do not reach across architectural layers in violation of the platform boundaries.

### Public vs Internal APIs
- Public APIs must be documented, versioned, and intentionally maintained.
- Internal APIs may exist for module-local use, but they should be clearly marked or encapsulated.
- Avoid exporting module internals unless there is a deliberate extension need.

---

## 3. Coding Standards

### TypeScript
- Use TypeScript for all new platform code.
- Favor explicit types over implicit any.
- Prefer interfaces or types that model the domain clearly.
- Use `unknown` rather than `any` when a value is not yet fully understood.
- Avoid unsafe casts unless necessary and justified.

### React
- Keep components focused and composable.
- Prefer functional components and hooks for new UI code.
- Keep side effects in hooks or service boundaries rather than inside presentation logic.
- Avoid large, monolithic components where decomposition improves clarity.

### Node.js
- Favor async/await for asynchronous operations.
- Handle promise rejections explicitly.
- Avoid blocking operations in request paths.
- Use structured error handling and lifecycle cleanup.

### CSS
- Prefer clear, maintainable styling over ad hoc class proliferation.
- Keep styles scoped where possible.
- Favor design-system patterns and reusable component classes.

### Configuration
- Keep configuration explicit and environment-driven.
- Do not hard-code environment-specific values.
- Support defaults, validation, and safe fallbacks.
- Never commit secrets or credentials.

### Logging
- Use structured logging where possible.
- Log events at the correct level and keep messages actionable.
- Never log secrets, passwords, tokens, or sensitive personal data.

### Error Handling
- Return or throw typed errors with enough context for debugging.
- Handle expected failures gracefully.
- Log failures with actionable context and preserve the original cause where possible.

### Comments
- Comment why a decision exists, not what the code obviously does.
- Avoid stale comments; update them when behavior changes.

### Documentation
- Every public API, workflow, plugin contract, connector contract, and significant subsystem must have documentation.
- Update documentation with implementation changes.

### Formatting
- Keep formatting consistent and readable.
- Follow the project style for indentation, spacing, and naming.
- Use concise and predictable code organization.

### Linting
- All code should pass the project linting and type-checking workflow.
- New warnings should be addressed, not ignored.

---

## 4. Architecture Guidelines

The canonical architecture reference is in [ARCHITECTURE.md](ARCHITECTURE.md). These guidelines explain how to evolve the platform without breaking its core contracts.

### Adding a New Engine
1. Identify the capability and its responsibility.
2. Define its public interface and lifecycle contract.
3. Register the engine in the capability routing layer.
4. Add configuration and dependency handling.
5. Add tests for success, failure, and fallback behavior.
6. Update architecture and contributor documentation.

### Adding a New Connector
1. Implement the connector using the shared connector contract.
2. Support authentication, retry, mapping, and state handling.
3. Add health checks, resilience logic, and clear error reporting.
4. Add integration tests against a safe stub or sandbox environment.
5. Document configuration, permissions, and expected payloads.

### Adding a New Plugin
1. Define the plugin interface and manifest.
2. Keep plugin logic isolated from core runtime logic.
3. Register the plugin through the approved extension point.
4. Version the plugin contract and document compatibility rules.
5. Test plugin lifecycle, activation, failure, and rollback behavior.

### Adding a New SDK
1. Keep the SDK surface small and intentional.
2. Base it on stable platform contracts.
3. Provide examples and migration guidance.
4. Maintain version compatibility and explicit deprecation paths.
5. Document authentication, request patterns, and error handling.

### Adding a Workflow
1. Define the purpose, inputs, outputs, and failure modes.
2. Model workflow state explicitly.
3. Integrate with orchestration, scheduling, and observability.
4. Make the workflow resumable and auditable where possible.
5. Add end-to-end tests for the full path.

### Adding a Model
1. Register the model with the model manager or registry.
2. Define provider selection and fallback behavior.
3. Add quality evaluation and benchmark expectations.
4. Verify latency, cost, and safety considerations.
5. Document the usage contract and model limitations.

### Extending Existing Services
- Extend services through interfaces and composition rather than direct modification of unrelated code.
- Preserve backward compatibility wherever possible.
- Avoid hidden coupling between modules.
- Add tests before changing behavior in a shared service.

---

## 5. Development Workflow

### Branch Strategy
- Use a stable `main` branch for integration.
- Create short-lived feature branches for change work.
- Use descriptive branch names such as `feature/connector-oauth`, `fix/knowledge-retrieval`, or `docs/handbook-update`.

### Commit Message Conventions
Use clear, conventional commit messages:
- `feat:` for new capabilities
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for structural changes
- `test:` for test additions or updates
- `chore:` for maintenance work

Example: `feat(core): add connector retry policy`

### Pull Request Process
- Submit small, focused pull requests whenever possible.
- Include a clear summary, motivation, and testing evidence.
- Link the relevant issue or requirement.
- Ensure the change is documented when behavior or interfaces change.

### Code Review Process
- Request review from the appropriate domain owner.
- Review for correctness, clarity, security, and compatibility.
- Ask questions rather than making assumptions.
- Do not merge changes that lack tests or documentation when required.

### Issue Tracking
- Use issues to record bugs, tasks, enhancements, and architectural ideas.
- Link implementation work to the issue being resolved.
- Include reproduction steps, expected behavior, and impact.

### Release Workflow
- Changes should pass the quality gates before release.
- Release candidates should be validated in a controlled environment.
- Stable releases require documentation, changelog, and rollout readiness checks.

---

## 6. Testing Standards

Testing is mandatory. A change without validation is not complete.

### Unit Testing
- Unit tests should cover logic, edge cases, and failure paths.
- Keep tests focused on behavior rather than implementation details.
- Prefer deterministic, fast unit tests.

### Repository Validation
- Use `npm run validate` to verify repository integrity before merging or releasing.
- The validation pipeline includes linting, TypeScript compilation, production build, frontend tests, backend tests, functions build, and functions lint.
- Use `npm run validate:ci` in CI environments for the same validation without extra console summary noise.

### Integration Testing
- Validate interactions between modules, services, and external boundaries.
- Ensure the integration contract is tested, not just the isolated units.

### End-to-End Testing
- Cover critical workflows that span API, runtime, storage, and integrations.
- Validate the real user or system path where possible.

### Performance Testing
- Measure latency, throughput, and resource usage for high-impact paths.
- Validate changes against reasonable load expectations.

### Security Testing
- Validate authentication, authorization, input validation, and secret handling.
- Review dependency and configuration changes for security risk.

### Regression Testing
- Re-run relevant tests when modifying shared services or platform-critical components.
- Keep regression coverage for previously reported defects.

### Coverage Expectations
- New logic should be covered by automated tests.
- Core and security-critical modules should be tested more aggressively.
- A minimum target of 80% for new modules is expected, with higher expectations for security-sensitive paths.

### Test Naming
- Use descriptive test names that state the behavior being verified.
- Prefer names such as `should_retry_on_transient_failure` over generic names.

### Mocking Strategy
- Mock only the external boundary or dependency being isolated.
- Do not over-mock business logic.
- Prefer fakes or small stubs for deterministic behavior.

---

## 7. Security Guidelines

### Secrets Management
- Never hard-code secrets.
- Use environment variables, secret stores, or approved secure configuration mechanisms.
- Rotate credentials and audit access regularly.

### Authentication
- Use the platform’s central authentication mechanisms.
- Avoid ad hoc authentication logic in feature modules.
- Validate identity at the boundary and preserve identity context through the workflow.

### Authorization
- Enforce authorization according to the platform policy layer.
- Avoid privilege escalation and privilege bypass.
- Apply role-based and attribute-based access control consistently.

### Input Validation
- Validate all user, API, and connector inputs.
- Normalize data before use.
- Reject malformed or unexpected input early.

### Dependency Management
- Review dependencies before adding or upgrading them.
- Prefer trusted, maintained libraries.
- Pin or review versions that affect security posture.

### Logging
- Do not log secrets or sensitive content.
- Ensure logs cannot be used to disclose private information.

### Encryption
- Use encryption for data at rest and in transit.
- Follow platform security requirements for key management and rotation.

### Responsible Disclosure
- Report security vulnerabilities privately and responsibly.
- Do not publicly disclose a vulnerability before a fix is available.

---

## 8. Performance Guidelines

### Memory Usage
- Avoid unnecessary object retention.
- Release resources when they are no longer needed.
- Be careful with large buffers, caches, and repeated parsing.

### Caching
- Cache expensive or repeated results where appropriate.
- Keep cache invalidation deterministic and explicit.
- Avoid stale cache behavior where correctness matters.

### Concurrency
- Use concurrency carefully and make it observable.
- Avoid unbounded parallelism where it can create resource pressure.
- Design for backpressure and graceful degradation.

### Asynchronous Processing
- Use asynchronous processing for long-running operations.
- Preserve error handling and cancellation semantics.
- Make long-running work recoverable and observable.

### Resource Cleanup
- Close streams, sockets, timers, subscriptions, and temporary files.
- Avoid resource leaks in long-lived services.

### Model Loading
- Load models only when required.
- Reuse loaded models where possible.
- Ensure startup and warm-up paths are known and measured.

### Inference Optimization
- Batch work when it improves efficiency and preserves accuracy.
- Optimize prompts, retrieval, context size, and model selection.
- Measure latency and quality together.

### Database Access
- Avoid unnecessary queries.
- Use the correct indexes and access patterns.
- Keep database access patterns predictable and efficient.

---

## 9. Documentation Standards

Documentation is part of the implementation.

### API Documentation
- Document request and response contracts.
- Describe authentication, error behavior, versioning, and examples.

### Architecture Documentation
- Update architecture notes when subsystems, interfaces, or boundaries change.
- Keep the architecture reference aligned with the implementation.

### SDK Documentation
- Document installation, authentication, basic usage, error handling, and extension points.

### Tutorials
- Provide step-by-step guidance for common tasks and workflows.
- Keep tutorials runnable and current.

### Examples
- Examples should be concise, tested, and relevant.
- Prefer realistic examples over overly abstract ones.

### ADRs
- Use ADRs for significant architectural decisions and trade-offs.
- Capture the context, decision, and consequences.

### Release Notes
- Summarize user-visible changes, compatibility impacts, and upgrade guidance.

---

## 10. Plugin & Connector Development

### Creating Plugins
1. Define the plugin contract and lifecycle hooks.
2. Create the plugin package and manifest.
3. Implement activation, configuration, and teardown behavior.
4. Register the plugin with the extension mechanism.
5. Add tests for supported and unsupported scenarios.
6. Document installation, configuration, and limitations.

### Creating Connectors
1. Define the connector contract and authentication model.
2. Implement connector actions, retry, and error handling.
3. Add mapping logic for payload translation.
4. Add integration tests and safe validation hooks.
5. Document configuration, permissions, and operational expectations.

### Packaging
- Package plugins and connectors with manifests, metadata, and compatibility information.
- Ensure versioning and dependency metadata are explicit.

### Versioning
- Use semantic versioning for public plugin and connector interfaces.
- Avoid breaking changes without a new version or migration path.

### Testing
- Test connector success, failure, retry, timeout, and recovery flows.
- Test plugin activation and deactivation paths.

### Publishing
- Publish only through approved channels and registries.
- Ensure package metadata, documentation, and compatibility notes are complete.

---

## 11. SDK Development

### SDK Design Principles
- Keep the SDK simple, predictable, and idiomatic.
- Favor a minimal but complete surface area.
- Make common workflows easy and advanced workflows possible.

### Version Compatibility
- Preserve compatibility for stable APIs.
- Introduce new versions deliberately and document migration steps.

### API Stability
- Public SDK methods should remain stable unless a versioned change is introduced.
- Clearly mark deprecated methods and provide migration guidance.

### Example Implementations
- Include minimal working examples for usage and onboarding.
- Keep examples aligned with current API conventions.

### Extension Mechanisms
- Support extension through configuration, hooks, or plugin integration where appropriate.
- Avoid requiring downstream users to modify core SDK internals.

---

## 12. Operational Practices

### Monitoring
- Monitor the health of services, workflows, and integrations.
- Track latency, failures, and abnormal resource usage.

### Logging
- Emphasize actionable log events and correlation identifiers.
- Keep logs useful for debugging and operations.

### Metrics
- Emit metrics that matter to service health and business outcomes.
- Ensure alerts are based on meaningful thresholds.

### Incident Response
- Follow documented incident procedures.
- Preserve evidence, coordinate response, and communicate status clearly.

### Diagnostics
- Make debugging straightforward with traces, state snapshots, and actionable context.
- Avoid requiring deep code inspection for common failures.

### Alerting
- Alert on meaningful failures, not noise.
- Ensure alerts can be triaged quickly and routed correctly.

### Recovery
- Design services and workflows so they can recover automatically or with controlled manual steps.
- Document rollback and recovery paths.

---

## 13. Release Process

### Versioning
- Follow semantic versioning rules for platform-facing changes.
- Document breaking versus non-breaking changes.

### Release Candidates
- Use release candidates for validation of major, minor, and significant changes.
- Verify test, documentation, security, and release-readiness criteria before promotion.

### Stable Releases
- Stable releases should be fully tested, documented, and ready for adoption.
- Stable releases should include changelog and migration guidance as needed.

### Patch Releases
- Patch releases should address defects, regressions, or security issues with minimal change scope.

### LTS Releases
- LTS releases should remain supported for a defined period.
- Document support expectations, upgrade windows, and compatibility constraints.

### Rollback
- Every release should include a rollback or recovery path.
- Rollback plans must be understood before deployment.

### Hotfixes
- Hotfixes should be narrowly scoped, tested, and documented.
- Hotfixes should not introduce avoidable architectural drift.

---

## 14. Quality Gates

The following checks are mandatory before changes are merged.

- Tests pass for the affected area.
- Security review is completed where relevant.
- Documentation is updated when behavior or interfaces change.
- Linting and type checks are clean.
- Static analysis findings are addressed or explicitly reviewed.
- Performance implications are evaluated for high-impact changes.
- The change is consistent with architecture boundaries and platform principles.

A pull request is not considered complete until these checks are satisfied.

---

## 15. Contributor Guide

### Set Up the Project
1. Clone the repository and install dependencies.
2. Create or activate the correct runtime environment.
3. Review the architecture and handbook references.
4. Run the local validation commands.

### Build Locally
Use the project’s standard build workflow to validate local changes.

### Run Tests
Useful commands include:
- `npm run lint`
- `npm test`
- `npm run validate`
- `npm run validate:ci`
- `npm run test:connectors`
- `npm run test:security`
- `npm run test:operations`
- `npm run test:release`

### Production probe validation
Before promoting a deployment, verify the runtime probes through the AI proxy:
- `GET /api/ai/liveness` — lightweight process liveness check.
- `GET /api/ai/ready` — readiness check for provider secrets and runtime availability.
- `GET /api/ai/health` — provider health and operational telemetry snapshot.

### Submit Changes
- Create a focused branch.
- Implement the change with tests and documentation.
- Open a pull request with context and evidence.

### Report Issues
- File clear issues with reproduction steps and expected outcomes.
- Include relevant logs or examples when possible.

### Propose Architectural Improvements
- Open an issue or discussion before making significant architectural changes.
- Reference the architecture documentation and explain the expected benefit and risk.

---

## 16. Appendices

### Glossary
- API: Application Programming Interface
- ADR: Architecture Decision Record
- SDK: Software Development Kit
- LTS: Long-Term Support
- RC: Release Candidate

### Acronyms
- AI: Artificial Intelligence
- RBAC: Role-Based Access Control
- ABAC: Attribute-Based Access Control
- SLO: Service Level Objective
- SLI: Service Level Indicator

### Useful Commands
- `npm install`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run dev`

### Reference Links
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [ARCHITECTURE_DOCUMENTATION_INDEX.md](ARCHITECTURE_DOCUMENTATION_INDEX.md)
- [ARCHITECTURE_SYSTEM_CONTEXT.md](ARCHITECTURE_SYSTEM_CONTEXT.md)
- [ARCHITECTURE_CONTAINER.md](ARCHITECTURE_CONTAINER.md)
- [ARCHITECTURE_SEQUENCE_DIAGRAMS.md](ARCHITECTURE_SEQUENCE_DIAGRAMS.md)

### Checklists

#### Pull Request Checklist
- [ ] Change has a clear purpose and scope.
- [ ] Tests were added or updated.
- [ ] Documentation was updated where needed.
- [ ] Security and compatibility concerns were considered.
- [ ] Quality checks passed.

#### Release Checklist
- [ ] Release notes are prepared.
- [ ] Documentation is current.
- [ ] Regression tests passed.
- [ ] Rollback path is documented.
- [ ] Stakeholders were notified.

### Templates

#### Issue Template
- Summary
- Steps to reproduce
- Expected behavior
- Actual behavior
- Impact
- Suggested fix

#### PR Template
- Summary
- Motivation
- Testing
- Documentation
- Risks and follow-ups
