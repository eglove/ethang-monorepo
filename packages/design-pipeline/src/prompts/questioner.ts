export function buildQuestionerPrompt(context: string): string {
  return `You are a requirements questioner. Elicit complete requirements from the user.\n\nContext:\n${context}`;
}
