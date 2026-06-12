// Hybrid Carbon Footprint Analyzer (Client-side regex fallback & LLM APIs)

// Standard default multipliers (matching the local rules)
export const defaultSettings = {
  llm_provider: 'local',
  llm_api_key: '',
  llm_model: 'llama-3.1-8b-instant',
  llm_system_prompt: 'You are an environmental science AI model that estimates carbon footprint details based on daily activity descriptions. Calculate the footprint in kg of CO2 equivalent, provide an efficiency score from 0 to 100, select the primary category (transportation, diet, utilities, consumption, mixed), and provide 1 to 3 suggestions.',
  multiplier_car: 8.5,
  multiplier_bus_train: 1.8,
  multiplier_flight: 120.0,
  multiplier_beef: 7.2,
  multiplier_chicken: 2.4,
  multiplier_vegetarian: 0.6,
  multiplier_dairy: 1.9,
  multiplier_ac: 4.5,
  multiplier_led: 0.3,
  multiplier_laundry: 1.5,
  multiplier_shopping: 9.0,
  multiplier_recycle: -1.2
};

// 1. Synchronous local analyzer using custom settings multipliers
export function analyzeJournalEntry(text, settings = defaultSettings) {
  const normalized = text.toLowerCase();
  let calculated_kg = 0;
  let matchesCount = 0;
  
  // Resolve settings or use fallback defaults
  const conf = { ...defaultSettings, ...settings };

  // Categorization flags
  let hasTransport = false;
  let hasDiet = false;
  let hasUtilities = false;
  let hasConsumption = false;

  const suggestions = [];

  // 1. Transportation analysis
  if (normalized.match(/(car|drive|drove|suv|taxi|uber|lyft)/)) {
    calculated_kg += parseFloat(conf.multiplier_car);
    hasTransport = true;
    matchesCount++;
    suggestions.push("Switch to public transit or carpooling to reduce personal vehicle emissions.");
  }
  if (normalized.match(/(bus|train|transit|subway|metro)/)) {
    calculated_kg += parseFloat(conf.multiplier_bus_train);
    hasTransport = true;
    matchesCount++;
    suggestions.push("Great job taking public transport! It is 4x more efficient than driving alone.");
  }
  if (normalized.match(/(flight|fly|flew|airplane|plane)/)) {
    calculated_kg += parseFloat(conf.multiplier_flight);
    hasTransport = true;
    matchesCount++;
    suggestions.push("Flights have a massive carbon impact. Consider offsetting or virtual meetings.");
  }
  if (normalized.match(/(bike|cycle|walk|run|skateboard|foot)/)) {
    calculated_kg += 0.0;
    hasTransport = true;
    matchesCount++;
    suggestions.push("Active transit (walking/biking) is 100% emission-free. Keep it up!");
  }

  // 2. Diet analysis
  if (normalized.match(/(beef|steak|hamburger|burger|lamb|meat)/)) {
    calculated_kg += parseFloat(conf.multiplier_beef);
    hasDiet = true;
    matchesCount++;
    suggestions.push("Red meat has a heavy footprint. Try substituting beef with poultry or plant-based meals.");
  }
  if (normalized.match(/(chicken|pork|fish|seafood|turkey)/)) {
    calculated_kg += parseFloat(conf.multiplier_chicken);
    hasDiet = true;
    matchesCount++;
    suggestions.push("Poultry and fish have a lower impact than red meat, but still contribute to diet footprint.");
  }
  if (normalized.match(/(salad|vegan|vegetarian|plant-based|vegetable|fruit|tofu)/)) {
    calculated_kg += parseFloat(conf.multiplier_vegetarian);
    hasDiet = true;
    matchesCount++;
    suggestions.push("Plant-based meals represent the lowest dietary footprint. Excellent eco-choice!");
  }
  if (normalized.match(/(cheese|dairy|milk|butter|yogurt)/)) {
    calculated_kg += parseFloat(conf.multiplier_dairy);
    hasDiet = true;
    matchesCount++;
    suggestions.push("Dairy farming produces significant methane. Consider oat or almond milk alternatives.");
  }

  // 3. Utilities / Energy analysis
  if (normalized.match(/(ac|air condition|heater|heating|hvac)/)) {
    calculated_kg += parseFloat(conf.multiplier_ac);
    hasUtilities = true;
    matchesCount++;
    suggestions.push("Optimize thermostat settings (e.g., 78°F in summer) to reduce energy loads.");
  }
  if (normalized.match(/(light|led|bulb|lamp)/)) {
    calculated_kg += parseFloat(conf.multiplier_led);
    hasUtilities = true;
    matchesCount++;
    suggestions.push("Ensure all lighting uses energy-efficient LED technology.");
  }
  if (normalized.match(/(washer|dryer|laundry)/)) {
    calculated_kg += parseFloat(conf.multiplier_laundry);
    hasUtilities = true;
    matchesCount++;
    suggestions.push("Washing clothes in cold water and air-drying saves substantial energy.");
  }

  // 4. Consumption / Waste analysis
  if (normalized.match(/(bought|shop|purchased|clothes|shirt|shoes|device|phone)/)) {
    calculated_kg += parseFloat(conf.multiplier_shopping);
    hasConsumption = true;
    matchesCount++;
    suggestions.push("Consumer goods carry hidden supply-chain emissions. Focus on reuse or second-hand items.");
  }
  if (normalized.match(/(recycle|reused|compost|refurbished)/)) {
    calculated_kg += parseFloat(conf.multiplier_recycle); // typically negative
    hasConsumption = true;
    matchesCount++;
    suggestions.push("Recycling and composting actively diverts waste from landfills. Great work!");
  }

  // If no keywords matched, generate default baseline
  if (matchesCount === 0) {
    calculated_kg = 3.5;
    suggestions.push("Keep logging your daily activities to gain deep insight into your carbon footprint.");
  }

  // Calculate efficiency score (higher is better, out of 100)
  let efficiency_score = Math.max(10, 100 - (calculated_kg * 5));
  if (calculated_kg <= 1.0) efficiency_score = 98;
  efficiency_score = parseFloat(efficiency_score.toFixed(1));

  // Determine category
  let category = 'mixed';
  if (hasTransport && !hasDiet && !hasUtilities && !hasConsumption) category = 'transportation';
  else if (!hasTransport && hasDiet && !hasUtilities && !hasConsumption) category = 'diet';
  else if (!hasTransport && !hasDiet && hasUtilities && !hasConsumption) category = 'utilities';
  else if (!hasTransport && !hasDiet && !hasUtilities && hasConsumption) category = 'consumption';

  return {
    calculated_kg: parseFloat(Math.max(0, calculated_kg).toFixed(2)),
    efficiency_score,
    category,
    suggestions: suggestions.slice(0, 3)
  };
}

// 2. Asynchronous hybrid analyzer (Calls Groq/OpenAI/Ollama/Gemini/OpenRouter/Claude if configured, otherwise falls back to local)
export async function analyzeJournalEntryAsync(text, settings = defaultSettings) {
  const conf = { ...defaultSettings, ...settings };

  // Ollama does not require an API key to run locally, others do
  const needsApiKey = ['groq', 'openai', 'gemini', 'openrouter', 'claude'].includes(conf.llm_provider);
  if (conf.llm_provider === 'local' || (needsApiKey && !conf.llm_api_key)) {
    // Return synchronous regex output
    return analyzeJournalEntry(text, conf);
  }

  const userPrompt = `Analyze the following daily activity log:
"${text}"

Respond with a raw JSON object containing these exact fields:
{
  "calculated_kg": <estimated_kg_CO2_number>,
  "efficiency_score": <score_0_to_100_based_on_eco_friendliness>,
  "category": "transportation" | "diet" | "utilities" | "consumption" | "mixed",
  "suggestions": [<1_to_3_actionable_eco_suggestions_strings>]
}

Return ONLY raw JSON. Do not include markdown \`\`\`json block wrapper or additional text.`;

  try {
    let url = '';
    let headers = { 'Content-Type': 'application/json' };
    let bodyData = {};

    if (conf.llm_provider === 'groq') {
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${conf.llm_api_key}`;
      bodyData = {
        model: conf.llm_model || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: conf.llm_system_prompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      };
    } else if (conf.llm_provider === 'openai') {
      url = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${conf.llm_api_key}`;
      bodyData = {
        model: conf.llm_model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: conf.llm_system_prompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      };
    } else if (conf.llm_provider === 'openrouter') {
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${conf.llm_api_key}`;
      headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
      headers['X-Title'] = 'Aether Carbon Sync Matrix';
      bodyData = {
        model: conf.llm_model || 'meta-llama/llama-3-8b-instruct:free',
        messages: [
          { role: 'system', content: conf.llm_system_prompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      };
    } else if (conf.llm_provider === 'claude') {
      url = 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = conf.llm_api_key;
      headers['anthropic-version'] = '2023-06-01';
      headers['dangerouslyAllowBrowser'] = 'true';
      bodyData = {
        model: conf.llm_model || 'claude-3-5-sonnet-20240620',
        max_tokens: 1000,
        system: conf.llm_system_prompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      };
    } else if (conf.llm_provider === 'gemini') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${conf.llm_model || 'gemini-1.5-flash'}:generateContent?key=${conf.llm_api_key}`;
      bodyData = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${conf.llm_system_prompt}\n\nActivity Log to analyze:\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      };
    } else if (conf.llm_provider === 'ollama') {
      // If llm_api_key is set to a custom URL, use it; otherwise default to localhost
      url = conf.llm_api_key && conf.llm_api_key.startsWith('http') 
        ? conf.llm_api_key 
        : 'http://localhost:11434/api/chat';
      bodyData = {
        model: conf.llm_model || 'llama3',
        messages: [
          { role: 'system', content: conf.llm_system_prompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        options: { temperature: 0.2 }
      };
    } else {
      throw new Error(`Unsupported LLM provider: ${conf.llm_provider}`);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API returned error ${response.status}: ${errText}`);
    }

    const resJson = await response.json();
    let resultText = '';

    if (['groq', 'openai', 'openrouter'].includes(conf.llm_provider)) {
      resultText = resJson.choices?.[0]?.message?.content;
    } else if (conf.llm_provider === 'claude') {
      resultText = resJson.content?.[0]?.text;
    } else if (conf.llm_provider === 'gemini') {
      resultText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    } else if (conf.llm_provider === 'ollama') {
      resultText = resJson.message?.content;
    }

    if (!resultText) throw new Error('Empty response from LLM API');

    // Extract JSON block using regex to support models that output conversational text alongside JSON
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    const cleanJsonText = jsonMatch ? jsonMatch[0].trim() : resultText.trim();
    const parsed = JSON.parse(cleanJsonText);

    // Robust float parser to handle strings like "8.5 kg" or nested objects
    const getFloat = (val, fallback = 0) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const clean = val.replace(/[^\d.-]/g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? fallback : num;
      }
      return fallback;
    };

    // Validate fields with strict sanitisation
    return {
      calculated_kg: parseFloat(getFloat(parsed.calculated_kg, 3.5).toFixed(2)),
      efficiency_score: parseFloat(Math.min(100, Math.max(0, getFloat(parsed.efficiency_score, 50))).toFixed(1)),
      category: ['transportation', 'diet', 'utilities', 'consumption', 'mixed'].includes(parsed.category) 
        ? parsed.category 
        : 'mixed',
      suggestions: Array.isArray(parsed.suggestions) 
        ? parsed.suggestions.slice(0, 3).map(s => String(s).trim()) 
        : ['Review carbon footprint impacts.']
    };
  } catch (err) {
    console.error('LLM analysis error, falling back to local rules:', err);
    // Fall back to local regex analyzer if API call fails
    return analyzeJournalEntry(text, conf);
  }
}
