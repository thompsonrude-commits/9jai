# Auto-Switch Image Generation Feature

## Overview

The app now includes an **automatic image generation detection system** that seamlessly switches from text chat to image generation when users request images. No UI buttons needed — the system intelligently detects image requests and handles them automatically.

## How It Works

### 1. **Automatic Detection**
When a user sends a message containing image generation keywords, the system automatically detects it and switches to image generation mode.

**Detected Keywords:**
- `generate image`, `create image`, `draw`, `paint`, `create a picture`
- `make an image`, `generate a picture`, `create a photo`, `generate photo`
- `draw me`, `paint me`, `show me a picture`, `create artwork`, `generate art`
- `make a drawing`, `create a visual`, `generate visual`, `illustrate`
- `create illustration`, `generate illustration`, `make artwork`, `design`
- `create design`, `generate design`, `visualize`, `create visualization`
- `image of`, `picture of`, `photo of`, `artwork of`, `illustration of`
- And many more variations...

### 2. **Automatic Prompt Extraction**
The system extracts the image description from the user's request by removing the image generation keywords.

**Examples:**
- User: "Generate image of a sunset over mountains"
  → Extracted prompt: "a sunset over mountains"

- User: "Create a picture of a cat playing with yarn"
  → Extracted prompt: "a cat playing with yarn"

- User: "Draw me a beautiful landscape"
  → Extracted prompt: "a beautiful landscape"

### 3. **Seamless Modal Opening**
When an image request is detected:
1. The user's message is added to the chat
2. An AI response indicating image generation is shown
3. The Image Generator modal opens automatically with the extracted prompt
4. Image generation begins immediately

### 4. **Image Integration**
Once the image is generated:
1. The image is saved to generation history
2. The image is displayed in the chat as a message
3. Users can download, share, or regenerate variations

## User Experience Flow

```
User: "Generate image of a sunset"
    ↓
System detects image request
    ↓
User message added to chat
    ↓
AI response: "🎨 Generating image: 'a sunset'"
    ↓
Image Generator modal opens automatically
    ↓
Image generation starts with extracted prompt
    ↓
Image displayed in chat
    ↓
User can download, share, or close modal
```

## Technical Implementation

### Detection Function
```typescript
const detectImageRequest = (text: string): boolean => {
  const imageKeywords = [
    'generate image', 'create image', 'draw', 'paint', 'create a picture',
    // ... more keywords
  ];
  
  const lowerText = text.toLowerCase();
  return imageKeywords.some(keyword => lowerText.includes(keyword));
};
```

### Message Handling
When an image request is detected:
1. User message is added to chat history
2. AI response message is added
3. Image Generator modal opens with pre-filled prompt
4. Image is generated and added to chat

### Image Generator Enhancement
The `ImageGenerator` component now accepts:
- `initialPrompt`: Pre-filled prompt for auto-generation
- `onImageGenerated`: Callback when image is generated
- `onClose`: Callback when modal is closed

## Features

✅ **Automatic Detection** - No manual switching needed
✅ **Smart Prompt Extraction** - Removes keywords to get clean descriptions
✅ **Seamless Integration** - Images appear in chat naturally
✅ **History Tracking** - All generated images saved
✅ **Download & Share** - Users can download or share generated images
✅ **Multiple API Support** - Replicate, Hugging Face, Unsplash fallbacks
✅ **Error Handling** - Graceful fallbacks if generation fails

## Supported Image Generation APIs

1. **Replicate** - High-quality image generation (primary)
2. **Hugging Face** - Stable Diffusion models (fallback)
3. **Unsplash** - Real photos search (fallback)
4. **Placeholder** - Default fallback image

## Configuration

To enable image generation, set these environment variables in `.env`:

```env
REACT_APP_REPLICATE_TOKEN=your_replicate_token
REACT_APP_HF_TOKEN=your_huggingface_token
REACT_APP_UNSPLASH_TOKEN=your_unsplash_token
```

## Files Modified

- `src/components/LanguageAssistant.tsx` - Added image detection and auto-switch logic
- `src/components/ImageGenerator.tsx` - Enhanced with auto-generation support
- `src/lib/imageService.ts` - Image generation and history management

## Testing

To test the auto-switch feature:

1. Open the app and navigate to any language
2. Try these prompts:
   - "Generate image of a cat"
   - "Create a picture of mountains"
   - "Draw me a sunset"
   - "Paint a beautiful landscape"
   - "Show me an image of the ocean"

3. The Image Generator modal should open automatically
4. Image should be generated and displayed in chat

## Future Enhancements

- [ ] Add more image generation keywords
- [ ] Support for image editing/variations
- [ ] Batch image generation
- [ ] Image style presets
- [ ] Advanced prompt enhancement with AI
- [ ] Image-to-image generation
- [ ] Real-time generation progress

## Notes

- Image generation requires valid API tokens
- Generation time depends on the API and model used
- Generated images are saved to browser localStorage
- Maximum 50 images stored in history
- Images can be downloaded or shared via native share API

---

**Status:** ✅ Deployed and Live
**Last Updated:** May 20, 2026
