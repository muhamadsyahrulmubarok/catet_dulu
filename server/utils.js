// Utility functions for Indonesian language support

/**
 * Parse Indonesian number formats
 * Examples: "15rb" -> 15000, "2.5k" -> 2500, "25ribu" -> 25000
 */
function parseIndonesianNumber(text) {
  if (!text || typeof text !== 'string') return null;
  
  // Remove common currency symbols and spaces
  let cleanText = text.toLowerCase()
    .replace(/rp\.?/g, '')
    .replace(/rupiah/g, '')
    .replace(/\s+/g, '');
  
  // Handle thousands notation
  if (cleanText.includes('rb') || cleanText.includes('ribu')) {
    const number = parseFloat(cleanText.replace(/rb|ribu/g, ''));
    return isNaN(number) ? null : number * 1000;
  }
  
  // Handle 'k' notation
  if (cleanText.includes('k')) {
    const number = parseFloat(cleanText.replace(/k/g, ''));
    return isNaN(number) ? null : number * 1000;
  }
  
  // Handle regular numbers with dots as thousand separators
  if (cleanText.includes('.') && !cleanText.includes(',')) {
    // Check if it's likely a thousand separator (e.g., "15.000")
    const parts = cleanText.split('.');
    if (parts.length === 2 && parts[1].length === 3 && /^\d+$/.test(parts[1])) {
      const number = parseFloat(parts[0] + parts[1]);
      return isNaN(number) ? null : number;
    }
  }
  
  // Handle regular numbers
  const number = parseFloat(cleanText.replace(/[^\d.,]/g, '').replace(',', '.'));
  return isNaN(number) ? null : number;
}

/**
 * Indonesian food keywords for categorization
 */
const indonesianFoodKeywords = [
  'makan', 'minum', 'kopi', 'teh', 'nasi', 'ayam', 'soto', 'bakso', 'mie',
  'gado', 'rendang', 'sate', 'gudeg', 'warteg', 'padang', 'jawa', 'sunda',
  'es', 'jus', 'air', 'minuman', 'makanan', 'sarapan', 'lunch', 'dinner',
  'snack', 'cemilan', 'gorengan', 'bakar', 'rebus', 'goreng', 'tumis'
];

/**
 * Indonesian transport keywords
 */
const indonesianTransportKeywords = [
  'ojek', 'gojek', 'grab', 'taxi', 'bus', 'busway', 'transjakarta', 'kereta',
  'krl', 'mrt', 'bensin', 'solar', 'pertamax', 'parkir', 'tol', 'motor',
  'mobil', 'angkot', 'mikrolet', 'bajaj', 'becak'
];

/**
 * Indonesian shopping keywords
 */
const indonesianShoppingKeywords = [
  'beli', 'belanja', 'shopping', 'mall', 'toko', 'warung', 'minimarket',
  'supermarket', 'pasar', 'baju', 'celana', 'sepatu', 'tas', 'dompet',
  'hp', 'handphone', 'laptop', 'elektronik', 'kosmetik', 'skincare'
];

/**
 * Indonesian bills keywords
 */
const indonesianBillsKeywords = [
  'listrik', 'air', 'pdam', 'internet', 'wifi', 'pulsa', 'token', 'pln',
  'indihome', 'telkom', 'xl', 'telkomsel', 'indosat', 'three', 'smartfren',
  'tagihan', 'bayar', 'pembayaran', 'cicilan', 'kredit', 'pinjaman'
];

/**
 * Indonesian entertainment keywords
 */
const indonesianEntertainmentKeywords = [
  'nonton', 'bioskop', 'cinema', 'film', 'movie', 'game', 'gaming', 'karaoke',
  'ktv', 'billiard', 'bowling', 'gym', 'fitness', 'spa', 'massage', 'pijat',
  'wisata', 'liburan', 'vacation', 'hotel', 'penginapan', 'tiket'
];

/**
 * Categorize expense based on Indonesian keywords
 */
function categorizeIndonesianExpense(description) {
  if (!description || typeof description !== 'string') return 'Other';
  
  const lowerDesc = description.toLowerCase();
  
  if (indonesianFoodKeywords.some(keyword => lowerDesc.includes(keyword))) {
    return 'Food';
  }
  
  if (indonesianTransportKeywords.some(keyword => lowerDesc.includes(keyword))) {
    return 'Transport';
  }
  
  if (indonesianShoppingKeywords.some(keyword => lowerDesc.includes(keyword))) {
    return 'Shopping';
  }
  
  if (indonesianBillsKeywords.some(keyword => lowerDesc.includes(keyword))) {
    return 'Bills';
  }
  
  if (indonesianEntertainmentKeywords.some(keyword => lowerDesc.includes(keyword))) {
    return 'Entertainment';
  }
  
  return 'Other';
}

/**
 * Extract expense information from Indonesian text
 */
function extractIndonesianExpense(text) {
  if (!text || typeof text !== 'string') return null;
  
  const result = {
    amount: null,
    description: text,
    category: 'Other',
    merchant: null
  };
  
  // Try to extract amount using various patterns
  const amountPatterns = [
    /(\d+(?:\.\d{3})*(?:,\d{2})?)\s*(?:rb|ribu)/gi,  // 15rb, 15ribu
    /(\d+(?:\.\d+)?)\s*k\b/gi,                        // 15k, 2.5k
    /rp\.?\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/gi,       // Rp 15.000
    /(\d+(?:\.\d{3})*(?:,\d{2})?)\s*rupiah/gi,      // 15000 rupiah
    /(\d+(?:\.\d{3})*(?:,\d{2})?)/g                 // plain numbers
  ];
  
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseIndonesianNumber(match[0]);
      if (amount && amount > 0) {
        result.amount = amount;
        break;
      }
    }
  }
  
  // Categorize based on keywords
  result.category = categorizeIndonesianExpense(text);
  
  // Try to extract merchant name (simple heuristic)
  const merchantPatterns = [
    /(?:di|at)\s+([a-zA-Z\s]+?)(?:\s|$)/gi,
    /([a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+(?:\d+|rp)/gi
  ];
  
  for (const pattern of merchantPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      result.merchant = match[1].trim();
      break;
    }
  }
  
  return result;
}

/**
 * Format number in Indonesian locale
 */
function formatIndonesianCurrency(amount) {
  if (!amount || isNaN(amount)) return 'Rp 0';
  return `Rp ${parseFloat(amount).toLocaleString('id-ID')}`;
}

/**
 * Translate common Indonesian expense terms to English
 */
function translateIndonesianToEnglish(text) {
  if (!text || typeof text !== 'string') return text;
  
  const translations = {
    'makan': 'meal',
    'minum': 'drink',
    'kopi': 'coffee',
    'teh': 'tea',
    'nasi': 'rice',
    'ayam': 'chicken',
    'ojek': 'motorcycle taxi',
    'gojek': 'gojek ride',
    'grab': 'grab ride',
    'bensin': 'gasoline',
    'parkir': 'parking',
    'beli': 'buy',
    'belanja': 'shopping',
    'listrik': 'electricity',
    'air': 'water bill',
    'pulsa': 'phone credit',
    'nonton': 'watch movie',
    'bioskop': 'cinema'
  };
  
  let translated = text.toLowerCase();
  
  Object.entries(translations).forEach(([indonesian, english]) => {
    const regex = new RegExp(`\\b${indonesian}\\b`, 'gi');
    translated = translated.replace(regex, english);
  });
  
  return translated;
}

module.exports = {
  parseIndonesianNumber,
  categorizeIndonesianExpense,
  extractIndonesianExpense,
  formatIndonesianCurrency,
  translateIndonesianToEnglish,
  indonesianFoodKeywords,
  indonesianTransportKeywords,
  indonesianShoppingKeywords,
  indonesianBillsKeywords,
  indonesianEntertainmentKeywords
};