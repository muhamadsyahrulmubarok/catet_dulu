const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  async processImage(imageBuffer, mimeType) {
    try {
      const prompt = `
        Analyze this image and extract any expense-related information. The text can be in English or Indonesian language. Look for:
        1. Amount/price (numbers with currency symbols like Rp, $, or format like "15rb", "25k")
        2. Description of items or services
        3. Date (if visible)
        4. Merchant/store name
        5. Category (food, transport, shopping, etc.)

        For Indonesian receipts, understand common patterns:
        - Currency: "Rp", "rupiah", "ribu" (thousand), "rb", "k" (thousand)
        - Common items: "nasi", "ayam", "kopi", "teh", "air", "es", "goreng", "bakar"
        - Merchants: Indonesian restaurant names, "warung", "resto", "cafe"
        - Transport: "ojek", "gojek", "grab", "parkir", "tol"

        Return the information in this JSON format:
        {
          "amount": "extracted amount as number (without currency symbol, convert thousands if needed)",
          "description": "brief description of the expense in English",
          "category": "suggested category (Food, Transport, Entertainment, Shopping, Bills, Health, Education, Other)",
          "date": "date if found (YYYY-MM-DD format) or null",
          "merchant": "store/merchant name if visible",
          "raw_text": "all text found in the image"
        }

        Important notes:
        - Convert Indonesian numbers: "15rb" = 15000, "25k" = 25000, "2.5k" = 2500
        - Translate Indonesian descriptions to English for consistency
        - Recognize Indonesian currency formats: "Rp 15.000" = 15000

        If no expense information is found, return:
        {
          "amount": null,
          "description": "No expense information found",
          "category": "Other",
          "date": null,
          "merchant": null,
          "raw_text": "extracted text from image"
        }
      `;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Error parsing Gemini JSON response:', parseError);
      }

      // Fallback if JSON parsing fails
      return {
        amount: null,
        description: "Could not process image",
        category: "Other",
        date: null,
        merchant: null,
        raw_text: text
      };

    } catch (error) {
      console.error('Error processing image with Gemini:', error);
      throw new Error('Failed to process image');
    }
  }

  async processText(text) {
    try {
      const prompt = `
        Analyze this text and extract expense information. The text can be in English or Indonesian language. The text might be:
        1. A description of an expense (e.g., "Bought coffee for $5", "Beli kopi 15000", "Makan siang 25rb")
        2. A receipt or bill text
        3. A simple expense note

        For Indonesian text, understand common patterns:
        - Currency: "Rp", "rupiah", "ribu" (thousand), "rb", "k" (thousand)
        - Food terms: "makan", "minum", "kopi", "nasi", "ayam", "soto", "bakso", etc.
        - Transport: "ojek", "gojek", "grab", "busway", "kereta", "bensin", "parkir"
        - Shopping: "beli", "belanja", "shopping", "baju", "sepatu"
        - Bills: "listrik", "air", "internet", "pulsa", "token"
        - Entertainment: "nonton", "bioskop", "game", "karaoke"

        Extract the following information and return in JSON format:
        {
          "amount": "extracted amount as number (without currency symbol, convert thousands if needed)",
          "description": "brief description of the expense in English",
          "category": "suggested category (Food, Transport, Entertainment, Shopping, Bills, Health, Education, Other)",
          "date": "date if found (YYYY-MM-DD format) or null",
          "merchant": "store/merchant name if mentioned"
        }

        Text to analyze: "${text}"

        Important notes:
        - Convert Indonesian numbers: "15rb" = 15000, "25k" = 25000, "2.5k" = 2500
        - Translate Indonesian descriptions to English for consistency
        - Recognize Indonesian currency formats and amounts
        - If no clear expense information is found, try to categorize the text and suggest a reasonable category.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      // Try to parse JSON response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Error parsing Gemini JSON response:', parseError);
      }

      // Fallback if JSON parsing fails
      return {
        amount: null,
        description: text,
        category: "Other",
        date: null,
        merchant: null
      };

    } catch (error) {
      console.error('Error processing text with Gemini:', error);
      throw new Error('Failed to process text');
    }
  }

  async generateMonthlyReport(expenses) {
    try {
      const expenseData = expenses.map(exp => ({
        amount: exp.amount,
        category: exp.category,
        description: exp.description,
        date: exp.date
      }));

      const prompt = `
        Generate a comprehensive monthly expense report based on this data:
        ${JSON.stringify(expenseData, null, 2)}

        Provide insights including:
        1. Total spending
        2. Top spending categories
        3. Spending patterns
        4. Recommendations for saving
        5. Unusual or high expenses

        Format the response as a readable report, not JSON.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error('Error generating report with Gemini:', error);
      throw new Error('Failed to generate report');
    }
  }
}

module.exports = new GeminiService();