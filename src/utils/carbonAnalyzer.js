// Client-side fallback analyzer for Carbon Footprint calculations

export function analyzeJournalEntry(text) {
  const normalized = text.toLowerCase();
  let calculated_kg = 0;
  let matchesCount = 0;
  
  // Categorization flags
  let hasTransport = false;
  let hasDiet = false;
  let hasUtilities = false;
  let hasConsumption = false;

  const suggestions = [];

  // 1. Transportation analysis
  if (normalized.match(/(car|drive|drove|suv|taxi|uber|lyft)/)) {
    calculated_kg += 8.5;
    hasTransport = true;
    matchesCount++;
    suggestions.push("Switch to public transit or carpooling to reduce personal vehicle emissions.");
  }
  if (normalized.match(/(bus|train|transit|subway|metro)/)) {
    calculated_kg += 1.8;
    hasTransport = true;
    matchesCount++;
    suggestions.push("Great job taking public transport! It is 4x more efficient than driving alone.");
  }
  if (normalized.match(/(flight|fly|flew|airplane|plane)/)) {
    calculated_kg += 120.0;
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
    calculated_kg += 7.2;
    hasDiet = true;
    matchesCount++;
    suggestions.push("Red meat has a heavy footprint. Try substituting beef with poultry or plant-based meals.");
  }
  if (normalized.match(/(chicken|pork|fish|seafood|turkey)/)) {
    calculated_kg += 2.4;
    hasDiet = true;
    matchesCount++;
    suggestions.push("Poultry and fish have a lower impact than red meat, but still contribute to diet footprint.");
  }
  if (normalized.match(/(salad|vegan|vegetarian|plant-based|vegetable|fruit|tofu)/)) {
    calculated_kg += 0.6;
    hasDiet = true;
    matchesCount++;
    suggestions.push("Plant-based meals represent the lowest dietary footprint. Excellent eco-choice!");
  }
  if (normalized.match(/(cheese|dairy|milk|butter|yogurt)/)) {
    calculated_kg += 1.9;
    hasDiet = true;
    matchesCount++;
    suggestions.push("Dairy farming produces significant methane. Consider oat or almond milk alternatives.");
  }

  // 3. Utilities / Energy analysis
  if (normalized.match(/(ac|air condition|heater|heating|hvac)/)) {
    calculated_kg += 4.5;
    hasUtilities = true;
    matchesCount++;
    suggestions.push("Optimize thermostat settings (e.g., 78°F in summer) to reduce energy loads.");
  }
  if (normalized.match(/(light|led|bulb|lamp)/)) {
    calculated_kg += 0.3;
    hasUtilities = true;
    matchesCount++;
    suggestions.push("Ensure all lighting uses energy-efficient LED technology.");
  }
  if (normalized.match(/(washer|dryer|laundry)/)) {
    calculated_kg += 1.5;
    hasUtilities = true;
    matchesCount++;
    suggestions.push("Washing clothes in cold water and air-drying saves substantial energy.");
  }

  // 4. Consumption / Waste analysis
  if (normalized.match(/(bought|shop|purchased|clothes|shirt|shoes|device|phone)/)) {
    calculated_kg += 9.0;
    hasConsumption = true;
    matchesCount++;
    suggestions.push("Consumer goods carry hidden supply-chain emissions. Focus on reuse or second-hand items.");
  }
  if (normalized.match(/(recycle|reused|compost|refurbished)/)) {
    calculated_kg -= 1.2;
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
  // Standard daily target is ~10 kg CO2.
  let efficiency_score = Math.max(10, 100 - (calculated_kg * 5));
  if (calculated_kg <= 1.0) efficiency_score = 98; // active transport/vegan baseline
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
    suggestions: suggestions.slice(0, 3) // Return top 3 suggestions
  };
}
