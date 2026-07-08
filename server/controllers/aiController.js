const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * @desc   Review code for quality, Big O, and best practices
 * @route  POST /api/ai/review
 * @access Private
 */
const reviewCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    if (!genAI) {
      return res.status(503).json({
        success: false,
        message: 'Google Gemini API Key is missing. Please configure GEMINI_API_KEY in the server environment.',
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
You are an expert AI Code Reviewer. Review the following ${language || 'programming'} code snippet.
Provide a concise, professional review with the following sections in Markdown:
1. **Time & Space Complexity (Big O)**: Analyze the algorithmic complexity.
2. **Code Quality**: Rate it out of 10 and explain why.
3. **Best Practices & Suggestions**: Suggest improvements (e.g., naming conventions, edge cases, modern syntax).

Code:
\`\`\`
${code}
\`\`\`
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.status(200).json({ success: true, review: responseText });
  } catch (error) {
    console.error('AI Code Review Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate code review' });
  }
};

/**
 * @desc   Chat with the AI Tutor for hints (strict prompt to avoid giving final answers)
 * @route  POST /api/ai/tutor
 * @access Private
 */
const chatWithTutor = async (req, res) => {
  try {
    const { history, message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (!genAI) {
      return res.status(503).json({
        success: false,
        message: 'Google Gemini API Key is missing. Please configure GEMINI_API_KEY.',
      });
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: 'You are a helpful AI Coding Tutor. Your STRICT RULE is to never give the direct answer or write the complete final code for the user. Instead, provide hints, guide them to the right path, explain concepts, and ask leading questions to help them solve it themselves.'
    });
    
    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.status(200).json({ success: true, reply: responseText });
  } catch (error) {
    console.error('AI Tutor Chat Error:', error);
    res.status(500).json({ success: false, message: 'Failed to communicate with AI Tutor' });
  }
};

module.exports = {
  reviewCode,
  chatWithTutor
};
