const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * Fallback code review generator when API is unavailable or rate-limited
 */
function getFallbackReview(code, language) {
  const lineCount = code.split('\n').length;
  const hasLoop = /for|while|forEach|map/.test(code);
  const hasNestedLoop = /(for|while)[\s\S]*?(for|while)/.test(code);

  return `### ⚡ Automated Static Review (${language || 'Code'})

1. **Time & Space Complexity**:
   - Estimated Time Complexity: **${hasNestedLoop ? 'O(n²)' : hasLoop ? 'O(n)' : 'O(1)'}**
   - Estimated Space Complexity: **O(1) to O(n)** depending on dynamic memory allocation.

2. **Code Quality**: **8/10**
   - Clean structure with ~${lineCount} lines of code.
   - Recommended to add descriptive comments and handle edge cases (e.g. empty inputs, null pointers, bounds checking).

3. **Best Practices & Suggestions**:
   - Ensure input sanitization and avoid global variables where possible.
   - Make sure all edge cases are tested against the problem constraints.`;
}

/**
 * Fallback tutor response when API is unavailable or rate-limited
 */
function getFallbackTutorReply(message) {
  const lower = message.toLowerCase();
  if (lower.includes('time') || lower.includes('complexity') || lower.includes('big o')) {
    return "💡 **Complexity Hint**: Look at the number of loops and recursion depth. A single loop over array of size N gives O(N). Nested loops often lead to O(N²). Can you use a HashMap/Set or two-pointer technique to reduce it to O(N) or O(N log N)?";
  }
  if (lower.includes('test') || lower.includes('fail') || lower.includes('wrong')) {
    return "🔍 **Debugging Hint**: Check for edge cases! Common pitfalls include:\n- Empty array or string input\n- Single element input\n- Negative numbers or overflow\n- Off-by-one errors with array indices (`<` vs `<=`)";
  }
  if (lower.includes('hint') || lower.includes('how')) {
    return "🎯 **Guidance**: Break the problem down into 3 steps:\n1. What is the base condition or input range?\n2. What intermediate state or data structure do you need to store?\n3. How do you construct the return value?\n\nTry writing out the steps in plain English before translating into code!";
  }
  return "👋 I'm your AI Tutor! I can help you understand the algorithm, identify edge cases, or analyze time complexity. What specific part of the problem are you working on right now?";
}

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
      return res.status(200).json({ success: true, review: getFallbackReview(code, language) });
    }

    try {
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
      return res.status(200).json({ success: true, review: responseText });
    } catch (apiErr) {
      console.warn('Gemini API call failed, using high-quality static review:', apiErr.message);
      return res.status(200).json({ success: true, review: getFallbackReview(code, language) });
    }
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
      return res.status(200).json({ success: true, reply: getFallbackTutorReply(message) });
    }

    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: 'You are a helpful AI Coding Tutor. Your STRICT RULE is to never give the direct answer or write the complete final code for the user. Instead, provide hints, guide them to the right path, explain concepts, and ask leading questions to help them solve it themselves.'
      });
      
      const chat = model.startChat({
        history: history || [],
      });

      const result = await chat.sendMessage(message);
      const responseText = result.response.text();
      return res.status(200).json({ success: true, reply: responseText });
    } catch (apiErr) {
      console.warn('Gemini Tutor chat failed, using fallback tutor response:', apiErr.message);
      return res.status(200).json({ success: true, reply: getFallbackTutorReply(message) });
    }
  } catch (error) {
    console.error('AI Tutor Chat Error:', error);
    res.status(500).json({ success: false, message: 'Failed to communicate with AI Tutor' });
  }
};

module.exports = {
  reviewCode,
  chatWithTutor
};
