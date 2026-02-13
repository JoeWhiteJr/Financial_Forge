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

  if (provider === 'gemini') {
    return generateGeminiResponse(prompt, context);
  } else if (provider === 'anthropic') {
    throw new Error('Anthropic provider not yet implemented');
  } else {
    throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

/**
 * Generate a response using Google Gemini.
 */
async function generateGeminiResponse(prompt, context) {
  if (!env.geminiApiKey) {
    return 'Error: Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.';
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(env.geminiApiKey);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Build the full prompt with context
    let fullPrompt = '';

    if (context.length > 0) {
      fullPrompt += 'Here is the relevant context from the knowledge base:\n\n';
      context.forEach((chunk, i) => {
        fullPrompt += `--- Context ${i + 1} (Source: ${chunk.source_file}, Chunk ${chunk.chunk_index}) ---\n`;
        fullPrompt += `${chunk.content}\n\n`;
      });
      fullPrompt += '---\n\n';
      fullPrompt += `Based on the context above, please answer the following question:\n\n${prompt}`;
    } else {
      fullPrompt = prompt;
    }

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    return response.text();
  } catch (err) {
    logger.error({ err }, 'Gemini API error');
    return `Error generating response: ${err.message}`;
  }
}

module.exports = { generateResponse };
