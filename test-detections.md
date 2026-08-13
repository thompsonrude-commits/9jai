# 9jai AI Detection Tests

## Image Generation Detection Tests

### Should Trigger Image Generation ✅
1. "generate image of a lion" → ✅ Explicit
2. "create image of sunset" → ✅ Explicit
3. "a lion" → ✅ Short visual phrase
4. "an eagle" → ✅ Short visual phrase
5. "the sunset" → ✅ Short visual phrase (if 6 words or less)
6. "draw me a car" → ✅ Explicit
7. "paint a house" → ✅ Explicit
8. "picture of mountain" → ✅ Explicit
9. "a beautiful sunset" → ✅ Implicit visual (adjective + noun)
10. "logo for my company" → ✅ Implicit visual pattern
11. "Nigerian skyline" → ✅ Implicit visual pattern
12. "draw a tree" → ✅ Explicit

### Should NOT Trigger Image Generation ❌
1. "what is a lion" → ❌ Question word
2. "how does a lion hunt" → ❌ Question word
3. "generate a report" → ❌ Document keyword
4. "create a list" → ❌ Document keyword
5. "write a function" → ❌ Code keyword
6. "make a table" → ❌ Document keyword
7. "tell me about lions" → ❌ Question pattern (>6 words)

## Video Generation Detection Tests

### Should Trigger Video Generation ✅
1. "generate video of dancing" → ✅ Explicit
2. "create video of sunset" → ✅ Explicit
3. "make video of lion" → ✅ Explicit
4. "video of walking" → ✅ Explicit
5. "animate a car" → ✅ Explicit

### Should NOT Trigger Video Generation ❌
1. "what is video" → ❌ Question
2. "how to make video" → ❌ Instructional question
3. "video tutorial" → ❌ Not a generation request

## Test Status
- ✅ Backend: All 20 Cloud Functions deployed
- ✅ Frontend: Detection logic improved
- ✅ Hosting: Deployed to https://9jai.web.app
- 🔄 Next: Manual testing with real inputs
