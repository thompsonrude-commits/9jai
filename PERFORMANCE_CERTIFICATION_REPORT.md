# Performance Certification Report — Version 1.0

## Purpose
Capture production performance metrics and certify against SLOs.

## Metrics to collect
- Startup time (cold start)
- Average response time (all endpoints)
- Streaming latency (95th/99th percentile)
- OCR latency
- Vision processing latency
- Speech-to-Text latency
- Image generation latency
- Video generation latency
- Memory retrieval latency
- Knowledge retrieval latency
- Provider failover latency

## Suggested Data Sources
- Firebase logs
- Application metrics (Prometheus/Cloud Monitoring)
- Tracing (OpenTelemetry)
- Synthetic load tests (k6, Artillery)

## Collection Commands / Examples
- Example k6 script: `k6 run perf/k6/script.js`
- Query Cloud Monitoring: filter by function name and latency metric

## Results
- Attach graphs and percentile tables here.

## Outcome
- Performance certification: PASS / WARNING / FAIL
- Observations and recommended mitigations:

---
