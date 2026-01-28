# Llama 3.1 Chatbot Integration

## Overview
The Govi-Isuru platform now supports Llama 3.1 AI chatbot via Hugging Face Inference API.
This means **no local GPU required** - all AI processing happens in the cloud!

## Setup Instructions

### 1. Get a Hugging Face API Token

1. Go to https://huggingface.co/settings/tokens
2. Sign in or create a free account
3. Click "New token"
4. Give it a name (e.g., "govi-isuru-chatbot")
5. Select "Read" access
6. Click "Generate token"
7. Copy the token (starts with `hf_...`)

### 2. Add Token to Environment

Open `server/.env` and replace:
```env
HUGGINGFACE_API_TOKEN=your_huggingface_token_here
```

With your actual token:
```env
HUGGINGFACE_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxx
```

### 3. Restart the Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd server
node index.js
```

## API Endpoints

### Chat with Llama 3.1
```
POST http://localhost:5000/api/llama-chatbot/chat
```

**Request Body:**
```json
{
  "message": "What's the best fertilizer for rice during the monsoon season?",
  "history": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help you with your farming needs?"
    }
  ],
  "options": {
    "temperature": 0.7,
    "max_tokens": 512
  }
}
```

**Response:**
```json
{
  "answer": "For rice during monsoon season, I recommend...",
  "model": "meta-llama/Meta-Llama-3.1-8B-Instruct",
  "source": "Hugging Face Inference API"
}
```

### Health Check
```
GET http://localhost:5000/api/llama-chatbot/health
```

## Testing with cURL

```bash
# Health check
curl http://localhost:5000/api/llama-chatbot/health

# Send a message
curl -X POST http://localhost:5000/api/llama-chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are common rice diseases in Sri Lanka?",
    "history": [],
    "options": {
      "temperature": 0.7,
      "max_tokens": 300
    }
  }'
```

## Features

✅ **No Local GPU Needed** - Uses Hugging Face cloud infrastructure  
✅ **Agricultural Expert** - Pre-configured with farming knowledge  
✅ **Conversation History** - Maintains context across messages  
✅ **Bilingual Support** - Can understand and respond in English and Sinhala  
✅ **Customizable** - Adjust temperature, max_tokens, etc.  
✅ **Free Tier Available** - Hugging Face offers free API usage with rate limits

## Important Notes

### Rate Limits
- Free tier: ~1000 requests per day
- If you need more, upgrade to Hugging Face Pro ($9/month)

### Cold Start
- First request might take 20-30 seconds (model loading)
- Subsequent requests are much faster (1-3 seconds)
- If you get "Model is loading" error, wait 20 seconds and try again

### Cost-Effective Alternative
This approach is much cheaper than:
- Running your own GPU server
- Using OpenAI API (which costs per token)
- Deploying a local Llama instance

## Integrating with Zapier Chatbot

You can configure the Zapier chatbot to call this API endpoint:
1. In Zapier, set up a webhook action
2. Point it to: `http://your-domain:5000/api/llama-chatbot/chat`
3. Pass the user message in the request body

## Troubleshooting

### "HUGGINGFACE_API_TOKEN not set"
- Make sure you added the token to `server/.env`
- Restart the server after updating .env

### "Model is loading, please try again in 20 seconds"
- This is normal for the first request
- Wait 20-30 seconds and try again
- Model stays warm for ~15 minutes after last use

### "Rate limit exceeded"
- You've hit the free tier limit
- Wait until the next day or upgrade to Pro

## Next Steps

To integrate with your React frontend:
1. Update the Zapier chatbot configuration to call this endpoint
2. Or create a custom React component that calls `/api/llama-chatbot/chat`
3. Pass conversation history to maintain context

---

**Need Help?** Check the Hugging Face Inference API docs:
https://huggingface.co/docs/api-inference/index
