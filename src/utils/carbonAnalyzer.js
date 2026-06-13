// Aether Carbon Analyzer — Pure AI Analysis Engine

export const OLD_DEFAULT_SYSTEM_PROMPT = 'You are an expert environmental scientist and sustainability advisor. You analyze daily activity logs and produce detailed, insightful carbon footprint reports.';

export const defaultSettings = {
  llm_provider: 'openrouter',
  llm_api_key: '',
  llm_base_url: '',
  llm_model: 'nvidia/nemotron-3-nano-30b-a3b:free',
  llm_system_prompt: `You are a non-judgmental sustainability scientist. Analyze the user's daily activity log and produce a warm, personal carbon footprint report.

CRITICAL INSTRUCTIONS:
- Tone: Speak without judging or lecturing the user. Be completely objective, warm, and understanding.
- Human Mindset: Respect that people have busy lives, budget limits, habits, and comfort zones. Never make the user feel guilty or overwhelmed.
- Practical Recommendations: Provide suggestions as simple, actionable steps towards a carbon-efficient path. The entry-level steps must require minimal effort or cost.
- Motivation: End the report with a beautiful, humble, and encouraging sentence to inspire the user to take action.
- Non-Carbon/Irrelevant Logs: If the daily log text has no information relevant to carbon footprint or emissions calculations (e.g. simple greetings like "hello", testing text, sleeping, reading a book, or unrelated statements), you MUST set "calculated_kg" to null and "efficiency_score" to null in the returned JSON object.
- Clarifying Questions: If the daily log text lacks specific details that would make the carbon footprint estimate significantly more accurate (e.g. distance traveled, vehicle fuel type, type of meat eaten, appliance energy usage), and you need more details, you can ask at most 1-2 brief, highly relevant questions to clarify. List these questions as an array of strings in the "clarifying_questions" field. If no questions are needed, or if the user has already answered all questions in the conversation history, or if the turn limit (3 turns max) has been reached, you MUST set "clarifying_questions" to null or an empty array [].

Respond ONLY with a raw JSON object (no markdown, no code fences) with EXACTLY these fields:

{
  "calculated_kg": <total estimated kg CO2 equivalent as a precise number based on the activities in the text, or null if the log has no relevant carbon information>,
  "efficiency_score": <eco-friendliness score between 1.0 and 10.0, higher means greener, or null if the log has no relevant carbon information>,

  "narrative": "<3-4 sentences of warm, non-judgmental, specific analysis of the text. Name each activity that contributed to emissions and explain its carbon impact in simple everyday language.>",

  "clarifying_questions": [<an array of 1-2 clarifying questions if more details are needed for a precise calculation, or null/empty array if no questions are needed or if turn limit is reached>],

  "causes": [
    {
      "activity": "<The exact human-readable name of the activity as described>",
      "label": "<A short descriptive phrase to group this cause>",
      "kg": <estimated kg CO2 as a number>,
      "impact": "high" | "medium" | "low"
    }
  ],

  "suggestions": [
    {
      "title": "<Short, positive, action-oriented title>",
      "detail": "<1-2 sentences explaining the benefit in a realistic and positive way>",
      "steps": [
        "Step 1: A tiny, zero-effort first action to do today.",
        "Step 2: A simple, realistic habit to build over this week.",
        "Step 3: A practical long-term upgrade if they want to go further."
      ]
    }
  ],

  "motivation": "<A beautiful, humble, and deeply motivating sentence encouraging them to attempt these steps.>"
}

Return ONLY raw JSON. No text outside the JSON object.`
};

// Synchronous local fallback (minimal, only used as emergency backup)
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

  // Calculate efficiency score (higher is better, out of 10)
  let efficiency_score = Math.max(1.0, 10.0 - (calculated_kg * 0.5));
  if (calculated_kg <= 1.0) efficiency_score = 9.8;
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

// Pure AI Analyzer — all analysis is done by the LLM, no local regex fallback
export async function analyzeJournalEntryAsync(text, settings = defaultSettings) {
  const conf = { ...defaultSettings, ...settings };

  // Ollama does not require an API key to run locally, others do
  const needsApiKey = ['groq', 'openai', 'gemini', 'openrouter', 'claude'].includes(conf.llm_provider);
  if (needsApiKey && !conf.llm_api_key) {
    throw new Error(`API Key for ${conf.llm_provider.toUpperCase()} is not configured. Please open Settings and enter your API Key.`);
  }

  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // If settings have empty, legacy, or missing clarifying questions instructions prompt, fall back to default
  let systemPrompt = conf.llm_system_prompt;
  if (!systemPrompt || systemPrompt.trim() === '' || !systemPrompt.includes('clarifying_questions')) {
    systemPrompt = defaultSettings.llm_system_prompt;
  }

  const userPrompt = `Activity log:
"${text}"`;

  try {
    let url = '';
    let headers = { 'Content-Type': 'application/json' };
    let bodyData = {};

    if (conf.llm_provider === 'groq') {
      url = conf.llm_base_url || (isDev ? '/api-proxy/groq/openai/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions');
      headers['Authorization'] = `Bearer ${conf.llm_api_key}`;
      bodyData = {
        model: conf.llm_model || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      };
    } else if (conf.llm_provider === 'openai') {
      url = conf.llm_base_url || (isDev ? '/api-proxy/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions');
      headers['Authorization'] = `Bearer ${conf.llm_api_key}`;
      bodyData = {
        model: conf.llm_model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      };
    } else if (conf.llm_provider === 'openrouter') {
      url = conf.llm_base_url || 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${conf.llm_api_key}`;
      headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
      headers['X-Title'] = 'Aether Carbon Sync Matrix';
      bodyData = {
        model: conf.llm_model || 'meta-llama/llama-3-8b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      };
    } else if (conf.llm_provider === 'claude') {
      url = conf.llm_base_url || (isDev ? '/api-proxy/anthropic/v1/messages' : 'https://api.anthropic.com/v1/messages');
      headers['x-api-key'] = conf.llm_api_key;
      headers['anthropic-version'] = '2023-06-01';
      headers['dangerouslyAllowBrowser'] = 'true';
      bodyData = {
        model: conf.llm_model || 'claude-3-5-sonnet-20240620',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      };
    } else if (conf.llm_provider === 'gemini') {
      const geminiBase = conf.llm_base_url || 'https://generativelanguage.googleapis.com/v1beta/models';
      url = `${geminiBase}/${conf.llm_model || 'gemini-1.5-flash'}:generateContent?key=${conf.llm_api_key}`;
      bodyData = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nActivity Log to analyze:\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      };
    } else if (conf.llm_provider === 'ollama') {
      url = conf.llm_base_url || 'http://localhost:11434/api/chat';
      bodyData = {
        model: conf.llm_model || 'llama3',
        messages: [
          { role: 'system', content: systemPrompt },
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

    const getFloatOrNull = (val) => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const clean = val.replace(/[^\d.-]/g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? null : num;
      }
      return null;
    };

    const calcKg = getFloatOrNull(parsed.calculated_kg);
    const effScore = getFloatOrNull(parsed.efficiency_score);

    // Validate fields with strict sanitisation
    return {
      calculated_kg: calcKg !== null ? parseFloat(calcKg.toFixed(2)) : null,
      efficiency_score: effScore !== null ? parseFloat(Math.min(10, Math.max(1, effScore)).toFixed(1)) : null,
      narrative: typeof parsed.narrative === 'string' ? parsed.narrative.trim() : '',
      clarifying_questions: Array.isArray(parsed.clarifying_questions)
        ? parsed.clarifying_questions.map(q => typeof q === 'string' ? q.trim() : '').filter(Boolean)
        : [],
      causes: Array.isArray(parsed.causes)
        ? parsed.causes.slice(0, 8).map(c => ({
            activity: String(c.activity || '').trim(),
            label: String(c.label || '').trim(),
            kg: parseFloat(getFloat(c.kg, 0).toFixed(2)),
            impact: ['high', 'medium', 'low'].includes(c.impact) ? c.impact : 'medium'
          }))
        : [],
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.slice(0, 3).map(s => {
            if (typeof s === 'string') return { title: s, detail: '', steps: [] };
            return {
              title: String(s.title || '').trim(),
              detail: String(s.detail || '').trim(),
              steps: Array.isArray(s.steps) ? s.steps.slice(0, 3).map(st => String(st).trim()) : []
            };
          })
        : [{ title: 'Review your daily habits', detail: 'Small changes add up over time.', steps: [] }],
      motivation: typeof parsed.motivation === 'string'
        ? parsed.motivation.trim()
        : (typeof parsed.eco_advice === 'string' ? parsed.eco_advice.trim() : '')
    };
  } catch (err) {
    console.error('LLM analysis error:', err);
    throw err;
  }
}
