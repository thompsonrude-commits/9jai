# Developer Console & Platform Operations Center

The Developer Console & Platform Operations Center (DCPOC) provides a modular operations surface for dashboards, workflows, metrics, logs, alerts, incidents, configuration, reports, search, and release readiness.

## Included modules

- Dashboard engine and overview summaries
- Widget framework for dashboard composition
- Metrics aggregation and summarization
- Log aggregation and search
- Alert management and acknowledgment
- Incident creation and resolution tracking
- Configuration management
- Report generation in multiple formats
- Search across operations artifacts
- Release readiness checks

## Verification

Run the dedicated suite with:

```bash
node --import tsx/esm --test core/operations/operationsPlatform.test.ts
```
