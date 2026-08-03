# Empirical Performance & Benchmark Analysis

## 1. System Latency Metrics

| Operation | Sample Size | Mean Latency | 95th Percentile |
| :--- | :--- | :--- | :--- |
| **Authentication (JWT Issue)** | 1,000 reqs | 42 ms | 78 ms |
| **Test Questions Retrieval** | 500 reqs | 28 ms | 54 ms |
| **Code Compilation (Python)** | 250 reqs | 680 ms | 1,120 ms |
| **Code Compilation (C++)** | 250 reqs | 890 ms | 1,450 ms |
| **AI Question Generation** | 50 reqs | 2,100 ms | 3,800 ms |

---

## 2. Client Proctoring Resource Utilization

- **CPU Overhead**: Average 6-9% core usage on standard quad-core laptops during real-time face tracking.
- **RAM Footprint**: ~140 MB allocation for `face-api.js` weights loaded in browser V8 context.
- **Bandwidth Consumption**: 0 KB/s video stream bandwidth (all vision model inferences run client-side; only lightweight JSON violation alerts are sent to server).
