// Lightweight OpenAI helper for explaining text in Vietnamese
// NOTE: This helper reads environment variables at build-time. In Expo/React-Native,
// only variables prefixed with EXPO_PUBLIC_* are automatically inlined into the
// client. Your current `.env` contains `OPENAI_API_KEY` (a secret). Embedding a
// secret key into a mobile/web client is insecure. Strongly prefer creating a
// small backend endpoint that holds the key and proxies requests to OpenAI.

// The helper below tries to read common env names and uses provided base URL and model
// if available. It is convenient for local testing but not recommended for production.
export async function explainTextInVietnamese(text: string): Promise<string> {
  // Prefer explicit variable names found in your .env file
  const key =
    // Direct secret (present in your .env as shown in workspace attachments)
    (process.env.OPENAI_API_KEY as string | undefined) ||
    // Expo public versions (will be exposed to client if prefixed EXPO_PUBLIC_)
    (process.env.EXPO_PUBLIC_OPENAI_API_KEY as string | undefined) ||
    (process.env.EXPO_OPENAI_API_KEY as string | undefined) ||
    (process.env.OPENAI_KEY as string | undefined);

  if (!key) {
    throw new Error('OpenAI API key not found in environment variables. Set OPENAI_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY.');
  }

  // Allow configuring base URL and model via env (your .env uses OPENAI_BASE_URL/OPENAI_MODEL)
  const baseUrl = (process.env.OPENAI_BASE_URL as string | undefined) || 'https://api.openai.com/v1';
  const model = (process.env.OPENAI_MODEL as string | undefined) || 'gpt-3.5-turbo';

  const systemPrompt = `Bạn là một trợ lý thông minh, nhiệm vụ là giải thích nội dung cho người dùng bằng TIẾNG VIỆT hoàn toàn. Hãy trình bày rõ ràng, có cấu trúc: tóm tắt ngắn gọn (1-2 câu), liệt kê các ý chính (nếu có), nêu ý nghĩa hoặc bối cảnh, và cung cấp 2-3 gợi ý hành động hoặc lưu ý nếu phù hợp. Tránh sử dụng tiếng Anh.`;

  const userPrompt = `Giải thích nội dung sau bằng tiếng Việt hoàn toàn và theo cấu trúc đã nêu:\n\n${text}`;

  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 800,
  };

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const textResp = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${textResp}`);
  }

  const data = await res.json();
  // Defensive checks: support both chat and older text responses
  const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return content;
}
