# Quick Testing Commands

Copy-paste these commands for fast testing.

---

## 🏥 Health Check

```bash
curl -s https://9jai.web.app/api/v1/health | jq
```

**What to look for**:
- `"status": "ready"` or `"status": "not_ready"`
- Provider list with `available: true/false`
- Which API keys are configured

---

## 💬 Test Chat

```bash
curl -s -X POST https://9jai.web.app/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }' | jq
```

**What to look for**:
- `"text": "..."` - The AI response
- `"provider": "ollama"` - Shows which provider handled it
- `"model": "..."` - Shows which model was used
- `"latencyMs": ...` - Response time

---

## 🎨 Test Image Generation

```bash
curl -s -X POST https://9jai.web.app/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a simple red circle"
  }' | jq
```

**What to look for**:
- `"imageUrl": "..."` - Image URL or base64 data
- `"provider": "pollinations-..."` - Should be Pollinations
- `"model": "..."` - Which Pollinations model

---

## 🔍 Test Search

```bash
curl -s -X POST https://9jai.web.app/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Nigeria capital city"
  }' | jq
```

**What to look for**:
- `"context": "..."` - Search results summary
- `"results": [...]` - Array of search results
- Should include web sources

---

## 🎤 Test Transcription (Requires Audio File)

```bash
# First, encode your audio file to base64
BASE64_AUDIO=$(base64 -i recording.webm)

curl -s -X POST https://9jai.web.app/api/v1/speech/transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "audioBase64": "'$BASE64_AUDIO'",
    "mimeType": "audio/webm",
    "language": "en"
  }' | jq
```

**What to look for**:
- `"text": "..."` - Transcribed text

---

## 👁️ Test Vision (Requires Image)

```bash
# First, encode your image to base64
BASE64_IMAGE=$(base64 -i test-image.jpg)

curl -s -X POST https://9jai.web.app/api/v1/vision/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "data:image/jpeg;base64,'$BASE64_IMAGE'",
    "prompt": "What do you see in this image?"
  }' | jq
```

**What to look for**:
- `"text": "..."` - Image analysis
- `"model": "..."` - Which vision model used

---

## 🔤 Test OCR (Requires Image with Text)

```bash
# Encode image with text
BASE64_IMAGE=$(base64 -i document.jpg)

curl -s -X POST https://9jai.web.app/api/v1/ocr \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "data:image/jpeg;base64,'$BASE64_IMAGE'",
    "language": "eng",
    "layout": false
  }' | jq
```

**What to look for**:
- `"text": "..."` - Extracted text
- `"confidence": ...` - OCR confidence score
- `"provider": "tesseract"` - Should be Tesseract (FREE)

---

## 📄 Test Document Storage

### Create Document
```bash
curl -s -X POST https://9jai.web.app/api/v1/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Document",
    "content": "This is a test document content.",
    "language": "en"
  }' | jq
```

### Get Document (Replace {id} with actual document ID)
```bash
curl -s https://9jai.web.app/api/v1/documents/{id} | jq
```

---

## 🔌 Test Plugin Registry

### Register Plugin
```bash
curl -s -X POST https://9jai.web.app/api/v1/plugins/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-plugin",
    "name": "Test Plugin",
    "version": "1.0.0",
    "description": "A test plugin"
  }' | jq
```

### Get Plugin
```bash
curl -s https://9jai.web.app/api/v1/plugins/test-plugin | jq
```

### List All Plugins
```bash
curl -s https://9jai.web.app/api/v1/plugins | jq
```

---

## 🔗 Test Connector Registry

### Register Connector
```bash
curl -s -X POST https://9jai.web.app/api/v1/connectors/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-connector",
    "name": "Test Connector",
    "version": "1.0.0",
    "description": "A test connector"
  }' | jq
```

### Get Connector
```bash
curl -s https://9jai.web.app/api/v1/connectors/test-connector | jq
```

### List All Connectors
```bash
curl -s https://9jai.web.app/api/v1/connectors | jq
```

---

## 🚀 Run Full Test Suite

```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🔍 Debugging Commands

### Check if Function is Deployed
```bash
firebase functions:list
```

### View Function Logs
```bash
firebase functions:log
```

### Check Firebase Hosting
```bash
curl -I https://9jai.web.app
```

### Test Local Ollama (If Backend Has Access)
```bash
curl http://localhost:11434/api/tags
```

---

## 📊 Provider Status Check

Quick check which providers are available:

```bash
curl -s https://9jai.web.app/api/v1/health | jq '.providers[] | {id: .id, available: .available}'
```

---

## 🎯 Expected Response Formats

### Successful Chat Response
```json
{
  "text": "Hello! I'm doing well...",
  "provider": "ollama",
  "model": "llama3.2",
  "latencyMs": 1234,
  "cached": false,
  "tokensUsed": 45
}
```

### Successful Image Response
```json
{
  "imageUrl": "data:image/jpeg;base64,...",
  "imageBase64": "data:image/jpeg;base64,...",
  "provider": "pollinations-turbo",
  "model": "pollinations-turbo",
  "latencyMs": 2345
}
```

### Error Response
```json
{
  "error": "Error message here",
  "text": "Fallback message for user"
}
```

---

## 💡 Tips

1. **Add `| jq` to format JSON output nicely**
2. **Use `-s` flag for silent curl (cleaner output)**
3. **Use `-v` flag for verbose curl (debugging)**
4. **Save responses to files**: Add `> response.json` to commands
5. **Test multiple times** to check consistency
6. **Check response times** for performance issues

---

## 🚨 Common Issues

### 404 Not Found
- Firebase rewrites not working
- Function not deployed
- Wrong endpoint URL

### 500 Internal Server Error
- Provider failure
- Missing API key
- Backend code error

### 503 Service Unavailable
- No providers available
- Rate limited
- Cold start timeout

### CORS Error
- Incorrect origin
- Missing CORS headers
- Browser blocking request

---

**For full testing guide, see**: `LIVE_APPLICATION_TEST_PLAN.md`
