export async function generateMockResponse(prompt: string) {
  return {
    id: 'mock-gen-1',
    prompt,
    text: `Mocked AI response for: ${prompt}`,
  };
}
