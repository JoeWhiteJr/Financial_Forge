const env = require('../config/env');
const logger = require('../config/logger');

const SYSTEM_INSTRUCTION = `You are a finance research assistant for Financial Forge. You help users understand financial concepts, analyze documents, and answer questions based on provided context. Always base your answers on the provided context when available. If the context doesn't contain enough information to answer the question, say so clearly. Be concise, accurate, and professional.`;

/**
 * Generate a response from the configured LLM provider.
 * @param {string} prompt - The user's question
 * @param {Array<{content: string, source_file: string, chunk_index: number}>} context - Retrieved context chunks
 * @returns {Promise<string>} The generated response text
 */
async function generateResponse(prompt, context = []) {
  const provider = env.llmProvider;

  if (provider === 'anthropic') {
    return generateAnthropicResponse(prompt, context);
  } else if (provider === 'gemini') {
    return generateGeminiResponse(prompt, context);
  } else {
    throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

/**
 * Build the user message with RAG context prepended.
 */
function buildUserMessage(prompt, context) {
  if (context.length === 0) return prompt;

  let msg = 'Here is the relevant context from the knowledge base:\n\n';
  context.forEach((chunk, i) => {
    msg += `--- Context ${i + 1} (Source: ${chunk.source_file}, Chunk ${chunk.chunk_index}) ---\n`;
    msg += `${chunk.content}\n\n`;
  });
  msg += '---\n\n';
  msg += `Based on the context above, please answer the following question:\n\n${prompt}`;
  return msg;
}

/**
 * Generate a response using Anthropic Claude Sonnet 4.5.
 */
async function generateAnthropicResponse(prompt, context) {
  if (!env.anthropicApiKey) {
    return 'Error: Anthropic API key is not configured. Please set the ANTHROPIC_API_KEY environment variable.';
  }

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: env.anthropicApiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: SYSTEM_INSTRUCTION,
      messages: [
        { role: 'user', content: buildUserMessage(prompt, context) },
      ],
    });

    return message.content[0].text;
  } catch (err) {
    logger.error({ err }, 'Anthropic API error');
    return `Error generating response: ${err.message}`;
  }
}

/**
 * Generate a response using Google Gemini (fallback).
 */
async function generateGeminiResponse(prompt, context) {
  if (!env.geminiApiKey) {
    return 'Error: Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.';
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: buildUserMessage(prompt, context),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    return response.text;
  } catch (err) {
    logger.error({ err }, 'Gemini API error');
    return `Error generating response: ${err.message}`;
  }
}

module.exports = { generateResponse };
