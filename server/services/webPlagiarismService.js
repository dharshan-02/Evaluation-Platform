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

  // To prevent token limits and ensure focused search queries, limit to ~15000 chars
  const truncatedText = text.length > 15000 ? text.substring(0, 15000) : text;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is missing on the server.');
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Enable Google Search Grounding to actually query the web
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }]
    });
    
    const prompt = `
You are a highly strict academic integrity and plagiarism detection AI with access to Google Search.
You MUST search the web to check if the following document text contains verbatim or slightly modified paragraphs from the internet, published papers, GitHub, or articles.

Document Text:
"""
${truncatedText}
"""

Instructions:
1. Actually utilize your Google Search capability to verify exact phrases or concepts from the text above.
2. Be aggressive in flagging anything that strongly matches web results.
3. If the text is a common template, boilerplate, or well-known public tutorial, flag it and provide the source URL.

Respond STRICTLY in the following JSON format (no markdown blocks, just raw JSON). Do NOT include any text outside the JSON object:
{
  "overallSimilarity": number (0 to 100, representing the estimated percentage of plagiarized content. Do NOT be afraid to return high numbers like 80 or 100 if it exists online),
  "matches": [
    {
      "textSnippet": "The specific sentence or paragraph from the document that is plagiarized",
      "sourceUrl": "The exact URL or source where this was found on the web",
      "similarityScore": number (0 to 100 representing the similarity of this specific snippet)
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Clean up potential markdown formatting
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Fallback parser in case Gemini adds extra conversational text
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON if it's embedded in text
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse AI response into JSON");
      }
    }
    
    return {
      overallSimilarity: parsedData.overallSimilarity || 0,
      matches: parsedData.matches || []
    };
  } catch (error) {
    console.error('Error during AI academic plagiarism check:', error);
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
