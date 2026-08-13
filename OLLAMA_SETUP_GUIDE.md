# OLLAMA SETUP GUIDE FOR 9JAI AI
**FREE-FIRST Chat Provider - No API Key Required**

---

## 🎯 WHY OLLAMA?

Ollama enables 9JAI AI to provide chat functionality **completely FREE**:
- ✅ No API key required
- ✅ No cost (runs locally)
- ✅ No external dependencies
- ✅ Fast inference (local)
- ✅ Privacy-first (data stays local)
- ✅ Open-source models (llama, gemma, mistral)

---

## 📦 INSTALLATION

### Linux / macOS
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows
Download and run installer from: https://ollama.ai/download

### Docker
```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

---

## 🚀 QUICK START

### 1. Install Ollama (see above)

### 2. Pull a Model
```bash
# Recommended: llama3.2 (3B - fast, good quality)
ollama pull llama3.2

# Alternative: llama3.1 (8B - higher quality, slower)
ollama pull llama3.1:8b

# Alternative: gemma2 (9B - Google's model)
ollama pull gemma2:9b

# Alternative: mistral (7B - fast and capable)
ollama pull mistral
```

### 3. Start Ollama Service
```bash
ollama serve
```

### 4. Test Ollama
```bash
curl http://localhost:11434/api/tags
```

Expected response: List of installed models

### 5. Deploy 9JAI AI Functions
```bash
cd functions
npm run build
firebase deploy --only functions
```

---

## 🔧 MODEL SELECTION

### Recommended Models for 9JAI AI

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| **llama3.2** | 3B | ⚡ Very Fast | ✅ Good | General chat (DEFAULT) |
| llama3.2 | 7B | ⚡ Fast | ✅✅ Better | Recommended for production |
| llama3.1 | 8B | 🔥 Medium | ✅✅ Better | Higher quality responses |
| llama3.1 | 70B | 🐌 Slow | ✅✅✅ Best | Maximum quality (requires GPU) |
| gemma2 | 9B | 🔥 Medium | ✅✅ Better | Google's model |
| mistral | 7B | ⚡ Fast | ✅✅ Better | Fast and capable |

### Pull Multiple Models (Recommended)
```bash
ollama pull llama3.2    # Fast fallback
ollama pull llama3.1:8b # Primary model
ollama pull mistral     # Alternative
```

9JAI AI will automatically use the best available model.

---

## 🌐 DEPLOYMENT OPTIONS

### Option 1: Local Development
Run Ollama on your local machine:
```bash
ollama serve
```

9JAI AI Firebase Functions connect to `http://localhost:11434`

### Option 2: Docker Compose (Recommended for Production)
Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

volumes:
  ollama_data:
```

Start:
```bash
docker-compose up -d
docker-compose exec ollama ollama pull llama3.2
```

### Option 3: Remote Ollama Server
If running Ollama on a different server, set environment variable:
```bash
export OLLAMA_URL=http://your-ollama-server:11434
```

Or in Firebase Functions config:
```bash
firebase functions:config:set ollama.url="http://your-ollama-server:11434"
```

---

## 🔍 VERIFICATION

### Test Ollama Directly
```bash
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.2",
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ]
}'
```

### Test via 9JAI AI Functions
```bash
# Using Firebase emulator
curl http://localhost:5001/YOUR_PROJECT/us-central1/aiChat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello from 9JAI AI"}
    ]
  }'
```

Expected: Response from Ollama model

---

## 🐛 TROUBLESHOOTING

### Ollama Service Not Available
**Error**: "Ollama service is not available"

**Solution**:
```bash
# Check if Ollama is running
ps aux | grep ollama

# Start Ollama
ollama serve

# Check if port is open
curl http://localhost:11434/api/tags
```

### No Models Available
**Error**: "No Ollama models available"

**Solution**:
```bash
# List installed models
ollama list

# Pull a model if none installed
ollama pull llama3.2

# Verify model is available
ollama list
```

### Connection Refused
**Error**: "Connection refused to localhost:11434"

**Solutions**:
1. Ensure Ollama is running: `ollama serve`
2. Check firewall settings
3. If using Docker, check port mapping: `-p 11434:11434`
4. If remote server, set OLLAMA_URL environment variable

### Model Loading Too Slow
**Solution**:
- Use smaller model: `ollama pull llama3.2` (3B instead of 70B)
- Ensure sufficient RAM (8GB+ recommended)
- Use GPU if available (NVIDIA CUDA, Apple Metal)

### Out of Memory
**Error**: Model fails to load

**Solution**:
- Use smaller model variant (3B or 7B instead of 70B)
- Close other applications
- Increase Docker memory limit (if using Docker)
- Use quantized models (Q4 or Q5 variants)

---

## ⚙️ CONFIGURATION

### Environment Variables

**OLLAMA_URL** (optional)
- Default: `http://localhost:11434`
- Set custom Ollama server URL

**Example**:
```bash
export OLLAMA_URL=http://192.168.1.100:11434
```

### Firebase Functions Config (optional)
```bash
firebase functions:config:set ollama.url="http://your-server:11434"
```

Then in code:
```typescript
const OLLAMA_BASE_URL = functions.config().ollama?.url || 'http://localhost:11434';
```

---

## 🚀 PRODUCTION DEPLOYMENT

### Recommended Setup for Production

1. **Dedicated Ollama Server**
   - Run Ollama on separate server/container
   - Use Docker for easy deployment
   - Scale horizontally (multiple Ollama instances)

2. **Load Balancing**
   - Use nginx/HAProxy for load balancing
   - Round-robin across multiple Ollama instances
   - Health checks on `/api/tags` endpoint

3. **Monitoring**
   - Monitor Ollama response times
   - Track model usage
   - Set up alerts for failures

4. **Model Selection**
   - Production: llama3.1:8b or llama3.2:7b
   - Development: llama3.2:3b
   - High-quality: llama3.1:70b (requires GPU)

---

## 📊 PERFORMANCE TIPS

### Model Selection for Speed
```bash
# Fastest (3B parameters)
ollama pull llama3.2

# Balanced (7-9B parameters)  
ollama pull mistral
ollama pull gemma2:9b

# Slowest but best quality (70B parameters)
ollama pull llama3.1:70b
```

### GPU Acceleration
- **NVIDIA**: Automatically uses CUDA if available
- **Apple Silicon**: Automatically uses Metal
- **AMD**: ROCm support (Linux only)

### Memory Requirements
- 3B model: ~4GB RAM
- 7-8B model: ~8GB RAM
- 13B model: ~16GB RAM
- 70B model: ~64GB RAM (or GPU VRAM)

---

## 🔐 SECURITY

### Ollama Security Best Practices

1. **Network Security**
   - Bind Ollama to localhost only (default)
   - Use firewall to restrict access
   - If exposing publicly, use authentication proxy

2. **Docker Security**
   - Run Ollama container as non-root user
   - Limit container resources
   - Use Docker secrets for sensitive config

3. **Model Validation**
   - Only pull models from official Ollama library
   - Verify model checksums
   - Keep Ollama updated

---

## 📈 MONITORING

### Health Check Endpoint
```bash
curl http://localhost:11434/api/tags
```

### Model List
```bash
ollama list
```

### System Status
```bash
ollama ps  # Show running models
```

### Logs
```bash
# Docker logs
docker logs ollama

# systemd logs (Linux)
journalctl -u ollama -f
```

---

## 🎯 NEXT STEPS

After setting up Ollama:

1. ✅ Verify Ollama is running: `curl http://localhost:11434/api/tags`
2. ✅ Pull at least one model: `ollama pull llama3.2`
3. ✅ Deploy 9JAI AI Functions: `firebase deploy --only functions`
4. ✅ Test chat works without API keys
5. ✅ Monitor performance and adjust model as needed

---

## 🆘 SUPPORT

### Ollama Documentation
- Official Docs: https://github.com/ollama/ollama/blob/main/README.md
- Model Library: https://ollama.ai/library
- GitHub Issues: https://github.com/ollama/ollama/issues

### 9JAI AI Specific
- Check `MASTER_RECONCILIATION_REPORT.md` for overall status
- Check `FREE_FIRST_PROVIDER_STATUS.md` for provider status
- Review Firebase Functions logs for Ollama errors

---

**END OF OLLAMA SETUP GUIDE**
**Ollama = FREE-FIRST Chat Provider ✅**
