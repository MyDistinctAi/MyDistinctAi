GET

/api/training/data

404
Request started
Dec 18 11:26:30.69GMT+1

Search Params
modelId
6bbfc6c0-a414-4c79-bf05-9cc47ffd892a
status
processed
Received in Paris, France (cdg1)


Routed to Washington, D.C., USA (iad1)
Function Invocation

404
Not Found


External APIs
Awaiting data


Fluid

285 MB
Response finished in 151ms
Deployment Information

2025-12-18 10:26:40.338 [info] [CHAT] ============================================
2025-12-18 10:26:40.338 [info] [CHAT] New chat request received
2025-12-18 10:26:40.338 [info] [CHAT] Platform detection: {
  header: null,
  isTauriBuild: false,
  isDesktop: false,
  platform: 'WEB (OpenRouter)',
  timestamp: '2025-12-18T10:26:40.338Z'
}
2025-12-18 10:26:40.339 [info] [CHAT] AI Configuration: {
  platform: 'WEB',
  model: 'deepseek/deepseek-chat',
  client: 'OpenRouter'
}
2025-12-18 10:26:40.392 [info] [CHAT] User: 23798b7d-bfdd-4582-a42d-473298bc5945
2025-12-18 10:26:40.392 [info] [CHAT] Request details: {
  modelId: '6bbfc6c0-a414-4c79-bf05-9cc47ffd892a',
  sessionId: '038fdf21-c455-4739-9214-2022c35512bf',
  messageLength: 33,
  useRAG: true,
  platform: 'WEB'
}
2025-12-18 10:26:40.435 [info] [CHAT] Starting RAG search...
2025-12-18 10:26:40.436 [info] [VECTOR_SEARCH] Starting search: {
  queryLength: 33,
  modelId: '6bbfc6c0-a414-4c79-bf05-9cc47ffd892a',
  limit: 5,
  threshold: 0.25,
  timestamp: '2025-12-18T10:26:40.435Z'
}
2025-12-18 10:26:40.436 [info] [VECTOR_SEARCH] Generating query embedding...
2025-12-18 10:26:40.436 [info] [EMBEDDINGS] Generating: {
  provider: 'OpenRouter (web)',
  textLength: 33,
  model: 'default',
  timestamp: '2025-12-18T10:26:40.435Z'
}
2025-12-18 10:26:40.519 [error] [EMBEDDINGS] OpenRouter error: Error: 401 User not found.
    at ce.generate (.next/server/chunks/6874.js:1:102528)
    at eV.makeStatusError (.next/server/chunks/6874.js:1:116999)
    at eV.makeRequest (.next/server/chunks/6874.js:1:117943)
    at async i (.next/server/app/api/chat/route.js:1:4889)
    at async x (.next/server/app/api/chat/route.js:1:8297)
    at async B (.next/server/app/api/chat/route.js:1:11538)
    at async k (.next/server/app/api/chat/route.js:11:3225) {
  status: 401,
  headers: [Object],
  request_id: undefined,
  error: [Object],
  code: 401,
  param: undefined,
  type: undefined
}
2025-12-18 10:26:40.519 [error] [VECTOR_SEARCH] ❌ Failed to generate embedding: OpenRouter embedding failed: 401 User not found.
2025-12-18 10:26:40.519 [info] [CHAT] RAG search complete: { documentsFound: 0, hasContext: false, topSimilarity: 0 }
2025-12-18 10:26:40.519 [info] [CHAT] Sending to AI: {
  platform: 'WEB',
  model: 'deepseek/deepseek-chat',
  messageCount: 2,
  hasContext: false,
  systemPromptLength: 71
}
2025-12-18 10:26:40.568 [error] [CHAT] ❌ Fatal error: Error: 401 User not found.
    at ce.generate (.next/server/chunks/6874.js:1:102528)
    at eV.makeStatusError (.next/server/chunks/6874.js:1:116999)
    at eV.makeRequest (.next/server/chunks/6874.js:1:117943)
    at async B (.next/server/app/api/chat/route.js:7:319)
    at async k (.next/server/app/api/chat/route.js:11:3225)
    at async g (.next/server/app/api/chat/route.js:11:4228) {
  status: 401,
  headers: [Object],
  request_id: undefined,
  error: [Object],
  code: 401,
  param: undefined,
  type: undefined
}
2025-12-18 10:26:40.568 [info] [CHAT] ============================================