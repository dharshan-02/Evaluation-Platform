const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const officeParser = require('officeparser');

/**
 * Extracts raw text from a PDF, PPTX, or DOCX file
 */
const extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (ext === '.pptx' || ext === '.docx' || ext === '.ppt' || ext === '.doc') {
      const text = await officeParser.parseOfficeAsync(filePath);
      return text;
    } else {
      throw new Error(`Unsupported file type: ${ext}. Only PDF, PPTX, and DOCX are supported.`);
    }
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error);
    throw new Error('Failed to extract text from document.');
  }
};

/**
 * SIMULATION ENGINE
 * Since there is no live API key provided for a Search Engine (e.g. SerpApi),
 * this function simulates querying the web by randomly flagging sentences.
 * It demonstrates exactly how the backend behaves and formats data for the UI.
 */
const simulateWebSearch = (text) => {
  if (!text || text.trim() === '') {
    return { overallSimilarity: 0, matches: [] };
  }

  // Split text into rough sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const cleanedSentences = sentences.map(s => s.trim()).filter(s => s.length > 20);

  const mockSources = [
    'https://en.wikipedia.org/wiki/Algorithm',
    'https://github.com/example/student-project',
    'https://stackoverflow.com/questions/12345/how-to-solve-this',
    'https://medium.com/@dev/building-a-react-app',
    'https://www.geeksforgeeks.org/introduction-to-machine-learning/',
    'https://coursehero.com/file/12345/cs101-final-report/'
  ];

  const matches = [];
  let plagiarizedSentencesCount = 0;

  // Randomly flag between 10% to 40% of the sentences to show some data
  cleanedSentences.forEach((sentence) => {
    // 25% chance to flag a sentence
    if (Math.random() < 0.25) {
      plagiarizedSentencesCount++;
      const randomSource = mockSources[Math.floor(Math.random() * mockSources.length)];
      const similarityScore = Math.floor(Math.random() * 40) + 60; // 60% to 99% match
      
      matches.push({
        textSnippet: sentence,
        sourceUrl: randomSource,
        similarityScore
      });
    }
  });

  const overallSimilarity = cleanedSentences.length > 0 
    ? Math.round((plagiarizedSentencesCount / cleanedSentences.length) * 100)
    : 0;

  return {
    overallSimilarity,
    matches
  };
};

/**
 * Main function to scan a document for web plagiarism
 */
const scanDocument = async (filePath) => {
  // 1. Extract text
  const rawText = await extractTextFromFile(filePath);

  // 2. Scan against web (using Simulation Engine)
  const reportData = simulateWebSearch(rawText);

  return reportData;
};

module.exports = {
  extractTextFromFile,
  scanDocument
};
