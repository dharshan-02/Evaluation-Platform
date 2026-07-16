const fs = require('fs');
const path = require('path');
const officeParser = require('officeparser');

/**
 * Extracts raw text from a PDF, PPTX, or DOCX file
 */
const extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  try {
    const allowedExts = ['.pdf', '.pptx', '.docx', '.ppt', '.doc'];
    if (!allowedExts.includes(ext)) {
      throw new Error(`Unsupported file type: ${ext}. Only PDF, PPTX, and DOCX are supported.`);
    }

    // officeparser natively supports extracting text from pdf, docx, pptx, etc.
    const result = await officeParser.parseOffice(filePath);
    return result.toText();
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error);
    throw new Error('Failed to extract text from document.');
  }
};

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Real Web/Academic Plagiarism Engine using Gemini
 */
const performRealWebSearch = async (text) => {
  if (!text || text.trim() === '') {
    return { overallSimilarity: 0, matches: [] };
  }

  // To prevent token limits on huge documents, we'll slice to the first ~30000 characters
  // which is roughly 6000-8000 words (more than enough to detect plagiarism)
  const truncatedText = text.length > 30000 ? text.substring(0, 30000) : text;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is missing on the server. Please add it to your hosting dashboard.');
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `
You are an academic integrity and plagiarism detection AI.
Analyze the following extracted document text and determine if any significant portions are plagiarized from known published research papers, academic journals, books, or reputable online reports.

Document Text:
"""
${truncatedText}
"""

Respond STRICTLY in the following JSON format (no markdown blocks, just raw JSON):
{
  "overallSimilarity": number (0 to 100 representing the estimated percentage of the document that is plagiarized),
  "matches": [
    {
      "textSnippet": "The specific sentence or paragraph from the document that is plagiarized",
      "sourceUrl": "Name of the published journal, research paper title, DOI, or URL where this was likely copied from",
      "similarityScore": number (0 to 100 representing the similarity of this specific snippet)
    }
  ]
}

If no plagiarism is detected against published literature, return overallSimilarity: 0 and an empty matches array.
`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    // Clean up potential markdown formatting
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedData = JSON.parse(responseText);
    
    return {
      overallSimilarity: parsedData.overallSimilarity || 0,
      matches: parsedData.matches || []
    };
  } catch (error) {
    console.error('Error during AI academic plagiarism check:', error);
    // Throw the error so the controller can send it to the frontend
    throw new Error('AI Plagiarism Check Failed: ' + (error.message || 'Unknown error'));
  }
};

/**
 * Main function to scan a document for web plagiarism
 */
const scanDocument = async (filePath) => {
  // 1. Extract text
  const rawText = await extractTextFromFile(filePath);

  // 2. Scan against web (using Real Engine)
  const reportData = await performRealWebSearch(rawText);

  return reportData;
};

module.exports = {
  extractTextFromFile,
  scanDocument
};
