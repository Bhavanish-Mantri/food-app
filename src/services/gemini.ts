import { GoogleGenerativeAI } from '@google/generative-ai';
import { MenuItem, OrderItemCustomization, CartItem, UserProfile, Review, AISentiment, Order } from '../types/database';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
export const isRealGemini = !!apiKey;

// Initialize Google Gen AI client if API key is present
const ai = isRealGemini ? new GoogleGenerativeAI(apiKey) : null;

// Helper to sanitize JSON response from Gemini
const cleanJSONResponse = (text: string): string => {
  let cleaned = text.trim();
  // Remove markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
};

// ==========================================
// REAL GEMINI API CALL IMPLEMENTATIONS
// ==========================================

const realCustomizeDish = async (menuItem: MenuItem, prompt: string): Promise<OrderItemCustomization> => {
  if (!ai) throw new Error('Gemini API is not initialized');
  const model = ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const systemInstruction = `You are a helpful, premium AI Chef. Your task is to customize a menu item based on a user's prompt. 
Evaluate their request, formulate ingredient additions/removals, calculate a price adjustment (price delta), and recalculate the macronutrients (calories, protein, carbs, fat).
Be reasonable: swapping ingredients shouldn't cost much; adding premium ingredients (like extra bacon, double steak, avocado) should increase the price by $1.50 to $4.00. Swapping cream for coconut milk might decrease or increase calories slightly.

You MUST respond ONLY with a JSON object matching this schema:
{
  "notes": "A friendly confirmation from the chef describing the changes (e.g. 'I will prepare your Carbonara with spiralized zucchini instead of pasta, adding double pancetta and a touch of chili flakes.')",
  "ingredientAdjustments": ["List of specific changes, e.g. '+ Extra Pancetta', '- Spelt Spaghetti', '+ Zucchini Noodles'"],
  "priceDelta": 2.50, // Float number. Can be positive, negative, or zero.
  "macroUpdates": {
    "calories": 420, // Final estimated calories (integer)
    "protein": 24,   // Final estimated protein in grams (integer)
    "carbs": 12,     // Final estimated carbs in grams (integer)
    "fat": 38        // Final estimated fat in grams (integer)
  }
}`;

  const userContent = `Original Item:
Name: ${menuItem.name}
Description: ${menuItem.description}
Price: $${menuItem.price}
Macros: Calories ${menuItem.macros.calories}kcal, Protein ${menuItem.macros.protein}g, Carbs ${menuItem.macros.carbs}g, Fat ${menuItem.macros.fat}g

User Customization Request: "${prompt}"`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    systemInstruction
  });

  const responseText = result.response.text();
  return JSON.parse(cleanJSONResponse(responseText));
};

const realNutritionistChat = async (
  history: { role: 'user' | 'model'; parts: string }[],
  prompt: string,
  cartItems: CartItem[],
  userPrefs: UserProfile['preferences'],
  menuItems: MenuItem[],
  orderHistory?: Order[]
): Promise<{ response: string; cartCommands?: { action: 'add' | 'remove'; menuItemId: string; quantity: number }[] }> => {
  if (!ai) throw new Error('Gemini API is not initialized');
  const model = ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const cartDetails = cartItems.map(c => `${c.quantity}x ${c.menuItem.name} (Customized: ${c.customization ? 'Yes' : 'No'})`).join(', ') || 'Cart is empty';
  const menuDetails = menuItems.map(m => `ID: ${m.id} | Name: ${m.name} | Price: $${m.price} | Category: ${m.category} | Macros: Cal ${m.macros.calories}, P ${m.macros.protein}g, C ${m.macros.carbs}g, F ${m.macros.fat}g`).join('\n');
  const orderDetails = orderHistory && orderHistory.length > 0
    ? orderHistory.map(o => `Order Date: ${new Date(o.created_at).toLocaleDateString()} | Total: $${o.total_price} | Items: ${o.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}`).join('\n')
    : 'No previous orders';

  const systemInstruction = `You are "NourishNow AI Personal Nutritionist". You give friendly, highly accurate, and helpful health and nutrition advice.
You can review the customer's current food cart, check their dietary preferences (Diet: ${userPrefs.diet}, Target Calories: ${userPrefs.targetCalories}kcal, Allergies: ${userPrefs.allergies.join(', ') || 'None'}), and guide them.

You MUST understand and factor in the following parameters when answering the user:
1. BUDGET: If they mention a budget (e.g. ₹300, under $15), recommend dishes fitting that price. Note that ₹300 is approximately $3.60 USD, and ₹500 is $6.00 USD. If items exceed their budget, recommend the closest/cheapest alternative and explain.
2. MOOD: Suggest comforting foods (e.g. red lentil dahl) for stress/tiredness, or refreshing foods (e.g. green cleansing smoothie) for energy.
3. CALORIES: Suggest items that fit within their daily calorie target or their requested calorie limit.
4. PROTEIN GOAL: Suggest high protein items if they request them (e.g. >30g protein, like Ribeye, Salmon, Butter Chicken).
5. DIET: Respect diet profiles (Keto, Vegan, Low-Carb, Gluten-Free) or goals like "diabetic friendly" (low net carbs/low glycemic index) and avoid foods that conflict.
6. CUISINE: Understand user cuisine preferences (Indian, Italian, Seafood, Salad, Bowls).
7. PREVIOUS ORDERS: Use the user's order history to make suggestions or refer to it naturally if they ask.
8. TIME OF DAY: Suggest breakfast items (Acai bowls, smoothies) or lunch/dinner mains based on their query or the time of day.
9. HEALTH GOALS: Answer naturally for constraints like "I am diabetic" (focus on fiber, protein, and very low carbs, warning about high glycemic options) or "I don't eat spicy food" (avoid spiced dishes).

Crucially, you have control over the shopping cart! If the user asks you to add something, remove something, or swaps a dish for a healthier alternative, you should output commands to execute.

You MUST respond ONLY with a JSON object matching this schema:
{
  "response": "Your conversational response in markdown. Be encouraging, reference their goal (${userPrefs.diet}), and explain any changes/recommendations you are proposing.",
  "cartCommands": [ // Optional. Only include if the user requested to add/remove something.
    {
      "action": "add", // 'add' or 'remove'
      "menuItemId": "menu-101", // The specific menu ID from the menu list provided.
      "quantity": 1
    }
  ]
}

Available Menu Items in the store:
${menuDetails}

Customer Current Cart:
${cartDetails}

Customer Previous Orders:
${orderDetails}`;

  const geminiHistory = history.map(h => ({
    role: h.role === 'model' ? 'model' : 'user',
    parts: [{ text: h.parts }]
  }));

  // Append current prompt
  const contents = [...geminiHistory, { role: 'user', parts: [{ text: prompt }] }];

  const result = await model.generateContent({
    contents,
    systemInstruction
  });

  const responseText = result.response.text();
  return JSON.parse(cleanJSONResponse(responseText));
};

const realAnalyzeReviews = async (reviews: Review[]): Promise<AISentiment> => {
  if (!ai) throw new Error('Gemini API is not initialized');
  const model = ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const reviewList = reviews.map(r => `Rating: ${r.rating} Stars | Comment: "${r.comment}"`).join('\n');

  const systemInstruction = `You are an expert Review Analyst. Analyze the sentiment of the following customer reviews.
Identify specific positives, negatives, calculate a aggregate sentiment score (0 to 100 where 100 is highly positive and 0 is highly negative), and write a concise 2-3 sentence overall summary.

You MUST respond ONLY with a JSON object matching this schema:
{
  "sentimentScore": 85,
  "positives": ["Good taste", "Friendly service"],
  "negatives": ["Long wait time"],
  "summary": "Overall customers are very satisfied with the taste and service, though a few noted longer wait times during peak hours."
}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: reviewList }] }],
    systemInstruction
  });

  const responseText = result.response.text();
  return JSON.parse(cleanJSONResponse(responseText));
};

const realSmartSearch = async (items: MenuItem[], query: string): Promise<{ ids: string[]; explanation: string }> => {
  if (!ai) throw new Error('Gemini API is not initialized');
  const model = ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const menuDetails = items.map(m => `ID: ${m.id} | Name: ${m.name} | Description: ${m.description} | Category: ${m.category} | Price: $${m.price}`).join('\n');

  const systemInstruction = `You are a Smart Culinary Search Engine. The user will ask for meals using natural language (e.g. 'something warm for a rainy day under $20', 'gluten free and high protein').
Evaluate the menu items and select the IDs of the items that match the user request. Provide a 1-sentence friendly explanation of why these items were selected.

You MUST respond ONLY with a JSON object matching this schema:
{
  "ids": ["menu-101", "menu-302"], // String IDs of matching items. Return empty list if no items match.
  "explanation": "I found these delicious warm options that fit your budget of $20."
}`;

  const userContent = `Menu Items:
${menuDetails}

User Search Query: "${query}"`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    systemInstruction
  });

  const responseText = result.response.text();
  return JSON.parse(cleanJSONResponse(responseText));
};

// ==========================================
// LOCAL MOCK AI ENGINE (FALLBACK)
// ==========================================

const mockCustomizeDish = async (menuItem: MenuItem, prompt: string): Promise<OrderItemCustomization> => {
  await new Promise(r => setTimeout(r, 600)); // Simulate API latency
  const lower = prompt.toLowerCase();
  let priceDelta = 0;
  let macroUpdates = { ...menuItem.macros };
  let adjustments: string[] = [];
  let notes = `Chef: "I will customize your ${menuItem.name} according to your request!"`;

  if (lower.includes('extra') || lower.includes('double') || lower.includes('add')) {
    let item = 'premium ingredient';
    if (lower.includes('bacon')) {
      item = 'Applewood Bacon';
      priceDelta += 2.0;
      macroUpdates.calories += 180;
      macroUpdates.fat += 15;
      macroUpdates.protein += 8;
    } else if (lower.includes('chicken') || lower.includes('protein')) {
      item = 'Grilled Chicken';
      priceDelta += 3.5;
      macroUpdates.calories += 150;
      macroUpdates.protein += 28;
      macroUpdates.fat += 3;
    } else if (lower.includes('avocado')) {
      item = 'Smashed Avocado';
      priceDelta += 1.5;
      macroUpdates.calories += 120;
      macroUpdates.fat += 11;
      macroUpdates.carbs += 6;
    } else {
      priceDelta += 2.0;
      macroUpdates.calories += 100;
    }
    adjustments.push(`+ Extra ${item}`);
    notes = `Chef: "Sure thing! I will add extra ${item} to your ${menuItem.name}. This adds some extra protein and healthy fats to fuel your day!"`;
  } else if (lower.includes('no ') || lower.includes('remove') || lower.includes('without')) {
    let item = 'ingredients';
    if (lower.includes('bacon')) {
      item = 'Bacon';
      priceDelta -= 1.0;
      macroUpdates.calories -= 150;
      macroUpdates.fat -= 12;
      macroUpdates.protein -= 6;
    } else if (lower.includes('bun') || lower.includes('carbs')) {
      item = 'Bread Bun (swapping with lettuce wrap)';
      macroUpdates.calories -= 180;
      macroUpdates.carbs -= 30;
    } else if (lower.includes('cheese') || lower.includes('mozzarella')) {
      item = 'Mozzarella Cheese';
      priceDelta -= 0.5;
      macroUpdates.calories -= 100;
      macroUpdates.fat -= 8;
      macroUpdates.protein -= 6;
    }
    adjustments.push(`- Remove ${item}`);
    notes = `Chef: "Absolutely. I will prepare your ${menuItem.name} without ${item}. Lighter and exactly how you like it!"`;
  } else if (lower.includes('swap') || lower.includes('substitute') || lower.includes('instead of')) {
    if (lower.includes('zucchini') || lower.includes('zoodles')) {
      adjustments.push('+ Zucchini Noodles');
      adjustments.push('- Spelt Spaghetti');
      priceDelta += 1.5;
      macroUpdates.carbs -= 45;
      macroUpdates.calories -= 160;
      notes = `Chef: "Excellent choice! Swapping standard pasta for freshly spiralized Zucchini Noodles. This drops the carbs by roughly 45g!"`;
    } else if (lower.includes('tofu') || lower.includes('vegan') || lower.includes('tempeh')) {
      adjustments.push('+ Organic Smoked Tempeh');
      adjustments.push('- Chicken/Meat');
      priceDelta += 0.5;
      macroUpdates.calories -= 50;
      macroUpdates.fat -= 2;
      macroUpdates.protein -= 8;
      notes = `Chef: "I will swap the meat in your dish for organic smoked tempeh. A fantastic plant-based upgrade!"`;
    } else {
      adjustments.push('Custom Swap');
      notes = `Chef: "I have swapped the ingredients in your ${menuItem.name} as requested. Prepared fresh!"`;
    }
  } else if (lower.includes('spicy') || lower.includes('hot')) {
    adjustments.push('+ Chili Flakes & Sriracha');
    notes = `Chef: "Spice alert! I am adding extra red chili flakes and a drizzle of house Sriracha to give your ${menuItem.name} a serious kick."`;
  }

  return {
    notes,
    ingredientAdjustments: adjustments.length > 0 ? adjustments : ['+ Custom Chef Prep'],
    priceDelta: parseFloat(priceDelta.toFixed(2)),
    macroUpdates
  };
};

const mockNutritionistChat = async (
  history: { role: 'user' | 'model'; parts: string }[],
  prompt: string,
  cartItems: CartItem[],
  userPrefs: UserProfile['preferences'],
  menuItems: MenuItem[],
  orderHistory?: Order[]
): Promise<{ response: string; cartCommands?: { action: 'add' | 'remove'; menuItemId: string; quantity: number }[] }> => {
  await new Promise(r => setTimeout(r, 650));
  const lower = prompt.toLowerCase();
  let response = '';
  let cartCommands: any[] = [];

  const orderDetails = orderHistory && orderHistory.length > 0
    ? orderHistory.map(o => `*   **${new Date(o.created_at).toLocaleDateString()}**: ${o.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')} from *${o.restaurant_name}* ($${o.total_price})`).join('\n')
    : '';

  // 1. Budget Checks (e.g. ₹300, ₹500, under $15)
  if (lower.includes('₹') || lower.includes('rs') || lower.includes('rupees') || lower.includes('budget') || lower.includes('have $') || lower.includes('under $') || lower.match(/\b\d+\s*(?:rs|rupees|inr)\b/)) {
    let budgetUSD = 20;
    if (lower.includes('₹') || lower.includes('rs') || lower.includes('rupees') || lower.includes('inr')) {
      const match = lower.match(/(?:₹|rs\.?|rupees?|inr)?\s*(\d+)\s*(?:rs\.?|rupees?|inr)?/i);
      const valStr = match ? match[1] : '300';
      const inr = parseInt(valStr) || 300;
      budgetUSD = inr / 83; // Approx 83 INR per USD
      response = `Analyzing options for a budget of **₹${inr}** (approx. **$${budgetUSD.toFixed(2)} USD**):\n\n`;
    } else {
      const match = lower.match(/under\s*\$?\s*(\d+)/) || lower.match(/\$?\s*(\d+)/);
      if (match) {
        budgetUSD = parseInt(match[1]);
        response = `Filtering healthy menu selections under **$${budgetUSD.toFixed(2)}**:\n\n`;
      }
    }

    const cheapItems = menuItems.filter(m => m.price <= budgetUSD);
    if (cheapItems.length > 0) {
      response += `Here are some healthy selections that fit your budget:\n` +
        cheapItems.map(m => `*   **${m.name}** ($${m.price.toFixed(2)}) from *${m.category}* - ${m.macros.calories} kcal`).join('\n') +
        `\n\nWould you like me to add any of these to your cart?`;
    } else {
      const cheapest = [...menuItems].sort((a, b) => a.price - b.price)[0];
      response += `All of our premium, clean-ingredient full meals start at **$${cheapest.price.toFixed(2)}** (e.g. the **${cheapest.name}**).\n\nIf you can stretch your budget slightly, these dishes are packed with clean macronutrients and healthy ingredients to keep you energized!`;
    }
  }
  // 2. Diabetic constraint
  else if (lower.includes('diabetic') || lower.includes('diabetes') || lower.includes('insulin') || lower.includes('glycemic') || lower.includes('sugar')) {
    response = `Since you are managing **diabetes**, we want to prioritize low-glycemic, low-carb options with clean proteins and healthy fats to prevent blood sugar spikes:\n\n` +
      `*   **Avocado Bacon Salmon Skillet** ($19.49) - Under 5g carbs, rich in anti-inflammatory Omega-3 fats.\n` +
      `*   **Grass-Fed Ribeye & Chimichurri** ($24.99) - Only 3g carbs, highly satiating and keto-friendly.\n` +
      `*   **Keto Carbonara (Zucchini Noodles)** ($15.99) - A comforting swap with only 9g of carbohydrates.\n\n` +
      `I recommend avoiding our flatbreads, high-carb ancient grain pastas, and sweet fruit bowls. Shall I add the **Salmon Skillet** or **Keto Carbonara** to your order?`;
  }
  // 3. Spiciness constraint (e.g. "I don't eat spicy food")
  else if ((lower.includes('spicy') || lower.includes('spice') || lower.includes('hot')) && (lower.includes('no ') || lower.includes('don\'t') || lower.includes('avoid') || lower.includes('not ') || lower.includes('limit') || lower.includes('without'))) {
    const mildItems = menuItems.filter(m => !m.description.toLowerCase().includes('spicy') && !m.description.toLowerCase().includes('chili') && !m.description.toLowerCase().includes('tandoori'));
    response = `Understood! I will steer clear of spicy seasonings to ensure a mild and digestible meal.\n\nHere are some excellent **non-spicy** choices:\n` +
      mildItems.slice(0, 3).map(m => `*   **${m.name}** ($${m.price.toFixed(2)}) - ${m.description}`).join('\n') +
      `\n\nWould you like me to add one of these to your cart?`;
  }
  // 4. Previous Orders Checks
  else if (lower.includes('previous') || lower.includes('last order') || lower.includes('history') || lower.includes('ordered before') || lower.includes('what did i order')) {
    if (orderDetails) {
      response = `Here is your recent order history:\n\n${orderDetails}\n\nWould you like to re-order the **Avocado Quinoa Buddha Bowl** or try one of our new keto dishes?`;
    } else {
      response = `I don't see any previous order history in your local database yet. Let's find something delicious to make your first order memorable! What cuisine are you in the mood for?`;
    }
  }
  // 5. Breakfast goal
  else if (lower.includes('breakfast') || lower.includes('morning') || lower.includes('early')) {
    response = `Here are some highly nutritious **breakfast options** to power your morning:\n\n` +
      `*   **Superfood Acai Energy Bowl** ($11.99) - Rich in antioxidants, topped with organic granola and almond butter.\n` +
      `*   **Green Goddess Cleansing Smoothie** ($8.99) - A refreshing cold-pressed start with cucumber, spinach, and apple juice.\n` +
      `*   **Avocado Quinoa Buddha Bowl** ($14.99) - A savory fiber-rich breakfast option.\n\n` +
      `I can add the **Acai Bowl** or **Smoothie** to your cart. Which one would you prefer?`;
  }
  // 6. Protein goal & High Protein dinner
  else if (lower.includes('protein') || lower.includes('muscle') || lower.includes('dinner')) {
    const highProteinItems = [...menuItems].sort((a, b) => b.macros.protein - a.macros.protein);
    response = `For a high-protein dinner, here are our top muscle-building meals:\n\n` +
      highProteinItems.slice(0, 3).map(m => `*   **${m.name}** (${m.macros.protein}g Protein, ${m.macros.calories} kcal) - $${m.price.toFixed(2)}`).join('\n') +
      `\n\nWould you like me to add the **Grass-Fed Ribeye** (${highProteinItems[0].macros.protein}g protein) or the **Clean Butter Chicken** (${highProteinItems[1].macros.protein}g protein) to your cart?`;
  }
  // 7. Mood checks (tired, stressed, comfort, energy)
  else if (lower.includes('mood') || lower.includes('tired') || lower.includes('stressed') || lower.includes('depressed') || lower.includes('energy') || lower.includes('comfort') || lower.includes('lazy')) {
    response = `To lift your **mood** and restore energy, I recommend comforting, anti-inflammatory, and complex carb options:\n\n` +
      `*   **Red Lentil Dahl & Sweet Potato Bowl** ($15.99) - Warm ginger, turmeric, and lentils boost serotonin and comfort the soul.\n` +
      `*   **Superfood Acai Energy Bowl** ($11.99) - Provides immediate natural energy from complex sugars, berries, and healthy fats.\n\n` +
      `Would you like to add one of these comforting meals?`;
  }
  // 8. Calories specific
  else if (lower.includes('calorie') || lower.includes('kcal') || lower.includes('low cal') || lower.includes('light')) {
    const lowCal = [...menuItems].sort((a, b) => a.macros.calories - b.macros.calories);
    response = `Here are our lighter, low-calorie selections under 500 kcal:\n\n` +
      lowCal.slice(0, 3).map(m => `*   **${m.name}** (${m.macros.calories} kcal) - P: ${m.macros.protein}g | C: ${m.macros.carbs}g`).join('\n') +
      `\n\nWould you like to add one of these to keep it light?`;
  }
  // 9. Cuisine specific
  else if (lower.includes('indian') || lower.includes('italian') || lower.includes('seafood') || lower.includes('curry') || lower.includes('pasta') || lower.includes('pizza') || lower.includes('salad')) {
    let matchedCuisine = 'Italian';
    let recs = menuItems.filter(m => m.restaurant_id === 'rest-4');
    if (lower.includes('indian') || lower.includes('curry') || lower.includes('dahl')) {
      matchedCuisine = 'Indian';
      recs = menuItems.filter(m => m.restaurant_id === 'rest-3');
    } else if (lower.includes('salad') || lower.includes('bowl')) {
      matchedCuisine = 'Fresh Salad/Bowls';
      recs = menuItems.filter(m => m.restaurant_id === 'rest-1');
    }
    response = `Craving **${matchedCuisine}**? Here are our top options:\n\n` +
      recs.slice(0, 3).map(m => `*   **${m.name}** ($${m.price.toFixed(2)}) - ${m.description}`).join('\n') +
      `\n\nWould you like me to add any of these to your cart?`;
  }
  // 10. Menu recommend standard
  else if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('what should i')) {
    if (userPrefs.diet === 'vegan') {
      const items = menuItems.filter(m => m.restaurant_id === 'rest-1');
      response = `Since your diet goal is **Vegan**, I highly recommend starting with the **Avocado Quinoa Buddha Bowl** from *Vibe & Vegans* ($14.99) which contains 14g protein and healthy fats. Another great option is the **Crispy Tempeh Burger** (26g protein).\n\nShall I add one to your cart?`;
    } else if (userPrefs.diet === 'keto') {
      response = `For a **Keto** plan, I recommend the **Grass-Fed Ribeye & Chimichurri** ($24.99) with 58g protein and only 3g carbs, or the **Avocado Bacon Salmon Skillet** ($19.49) with 44g protein and 5g carbs. Let me know if you want me to add one!`;
    } else {
      response = `I recommend starting with our signature **Clean High-Protein Butter Chicken** ($17.49) served with cauliflower rice, or the **Tuscan Garlic Shrimp Pasta** ($18.99). Both offer high protein and balanced macros. What are you in the mood for?`;
    }
  }
  // 11. Cart commands (add, remove)
  else if (lower.includes('add') || lower.includes('order') || lower.includes('get me') || lower.includes('put ')) {
    let matchedItem = menuItems.find(m => lower.includes(m.name.toLowerCase()) || m.name.toLowerCase().split(' ').some(w => w.length > 3 && lower.includes(w)));
    if (!matchedItem) {
      if (lower.includes('buddha') || lower.includes('quinoa') || lower.includes('vegan')) {
        matchedItem = menuItems.find(m => m.id === 'menu-101');
      } else if (lower.includes('steak') || lower.includes('ribeye') || lower.includes('meat')) {
        matchedItem = menuItems.find(m => m.id === 'menu-201');
      } else if (lower.includes('salmon') || lower.includes('fish')) {
        matchedItem = menuItems.find(m => m.id === 'menu-202');
      } else if (lower.includes('butter chicken') || lower.includes('curry')) {
        matchedItem = menuItems.find(m => m.id === 'menu-301');
      } else if (lower.includes('pasta') || lower.includes('shrimp')) {
        matchedItem = menuItems.find(m => m.id === 'menu-401');
      } else if (lower.includes('pizza') || lower.includes('flatbread')) {
        matchedItem = menuItems.find(m => m.id === 'menu-402');
      }
    }

    if (matchedItem) {
      cartCommands.push({
        action: 'add',
        menuItemId: matchedItem.id,
        quantity: 1
      });
      response = `I have automatically added the **${matchedItem.name}** ($${matchedItem.price}) to your cart!\n\n**Nutrition Profile**:\n*   Calories: ${matchedItem.macros.calories} kcal\n*   Protein: ${matchedItem.macros.protein}g | Carbs: ${matchedItem.macros.carbs}g | Fat: ${matchedItem.macros.fat}g\n\nLet me know if you would like me to recommend anything else!`;
    } else {
      response = `I couldn't find the exact match to add to your cart. Could you specify which dish? (e.g. Avocado Buddha Bowl, Ribeye, Salmon, Butter Chicken, or Garlic Shrimp Pasta).`;
    }
  }
  // 12. General fallback
  else {
    response = `Hi there! I'm your **NourishNow AI Personal Nutritionist**.\n\nI can suggest meals based on your **budget** (e.g. *"I have ₹300"*), **mood** (*"comfort food"*), **calories**, **protein goals**, **cuisine**, **time of day** (*"healthy breakfast"*), **health goals** (*"I am diabetic"*), or **previous orders**.\n\nHow can I help you eat better today?`;
  }

  return { response, cartCommands };
};

const mockAnalyzeReviews = async (reviews: Review[]): Promise<AISentiment> => {
  await new Promise(r => setTimeout(r, 400));
  if (reviews.length === 0) {
    return {
      sentimentScore: 80,
      positives: ['Fresh ingredients'],
      negatives: [],
      summary: 'No active reviews to analyze. Defaults to positive general rating.'
    };
  }

  const ratings = reviews.map(r => r.rating);
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const score = Math.round((avg / 5) * 100);

  const positives = new Set<string>();
  const negatives = new Set<string>();

  reviews.forEach(r => {
    const comment = r.comment.toLowerCase();
    if (comment.includes('delicious') || comment.includes('great') || comment.includes('love') || comment.includes('perfect')) {
      positives.add('Excellent taste');
    }
    if (comment.includes('fresh') || comment.includes('organic')) {
      positives.add('High ingredient freshness');
    }
    if (comment.includes('fast') || comment.includes('quick')) {
      positives.add('Quick preparation');
    }
    if (comment.includes('wait') || comment.includes('slow') || comment.includes('long')) {
      negatives.add('Preparation delay');
    }
    if (comment.includes('price') || comment.includes('expensive')) {
      negatives.add('Premium pricing');
    }
    if (comment.includes('cold') || comment.includes('dry')) {
      negatives.add('Temperature consistency');
    }
  });

  if (positives.size === 0) positives.add('Balanced nutrition');
  if (negatives.size === 0) negatives.add('None reported');

  return {
    sentimentScore: score,
    positives: Array.from(positives),
    negatives: Array.from(negatives),
    summary: `Based on customer reviews, the restaurant secures a solid ${avg.toFixed(1)} star rating. Customers are highly appreciative of the food flavor and ingredient freshness, while some noted areas of improvement around pricing and peak delivery times.`
  };
};

const mockSmartSearch = async (items: MenuItem[], query: string): Promise<{ ids: string[]; explanation: string }> => {
  await new Promise(r => setTimeout(r, 500));
  const lower = query.toLowerCase();
  let matchedIds: string[] = [];
  let explanation = '';

  if (lower.includes('vegan') || lower.includes('plant') || lower.includes('organic')) {
    matchedIds = items.filter(m => m.restaurant_id === 'rest-1').map(m => m.id);
    explanation = 'I filtered our 100% plant-based and organic dishes from Vibe & Vegans.';
  } else if (lower.includes('keto') || lower.includes('high protein') || lower.includes('meat') || lower.includes('steak')) {
    matchedIds = items.filter(m => m.macros.protein >= 30 || m.restaurant_id === 'rest-2').map(m => m.id);
    explanation = 'Showing high-protein and keto-friendly dishes containing over 30g of protein.';
  } else if (lower.includes('low carb') || lower.includes('low-carb')) {
    matchedIds = items.filter(m => m.macros.carbs <= 15).map(m => m.id);
    explanation = 'Filtered dishes containing less than 15g of carbohydrates per serving.';
  } else if (lower.includes('sweet') || lower.includes('dessert') || lower.includes('fruit')) {
    matchedIds = items.filter(m => m.category.toLowerCase().includes('dessert') || m.description.toLowerCase().includes('fruit') || m.description.toLowerCase().includes('acai')).map(m => m.id);
    explanation = 'Found items featuring natural sweetness, fruits, and healthy dessert options.';
  } else if (lower.includes('seafood') || lower.includes('fish') || lower.includes('shrimp') || lower.includes('salmon')) {
    matchedIds = items.filter(m => m.name.toLowerCase().includes('salmon') || m.name.toLowerCase().includes('shrimp') || m.name.toLowerCase().includes('fish')).map(m => m.id);
    explanation = 'Showing delicious, omega-3 rich wild seafood selections.';
  } else if (lower.includes('spicy') || lower.includes('chili') || lower.includes('hot')) {
    matchedIds = items.filter(m => m.description.toLowerCase().includes('spicy') || m.description.toLowerCase().includes('chili') || m.description.toLowerCase().includes('tandoori')).map(m => m.id);
    explanation = 'Showing dishes prepared with warming spices and chili profiles.';
  } else {
    // Keyword match
    matchedIds = items.filter(m => 
      m.name.toLowerCase().includes(lower) || 
      m.description.toLowerCase().includes(lower) ||
      m.category.toLowerCase().includes(lower)
    ).map(m => m.id);
    explanation = matchedIds.length > 0 
      ? `Found matches containing "${query}" in our menu catalog.`
      : 'No direct matches found. Try searching for "vegan", "high protein", "low carb", or "spicy".';
  }

  return { ids: matchedIds, explanation };
};

// ==========================================
// PUBLIC EXPORTS (DUAL ROUTE ORCHESTRATOR)
// ==========================================

export const customizeDish = async (menuItem: MenuItem, prompt: string): Promise<OrderItemCustomization> => {
  if (isRealGemini) {
    try {
      return await realCustomizeDish(menuItem, prompt);
    } catch (e) {
      console.warn('Real Gemini API call failed, falling back to mock customizer.', e);
      return await mockCustomizeDish(menuItem, prompt);
    }
  } else {
    return await mockCustomizeDish(menuItem, prompt);
  }
};

export const nutritionistChat = async (
  history: { role: 'user' | 'model'; parts: string }[],
  prompt: string,
  cartItems: CartItem[],
  userPrefs: UserProfile['preferences'],
  menuItems: MenuItem[],
  orderHistory?: Order[]
): Promise<{ response: string; cartCommands?: { action: 'add' | 'remove'; menuItemId: string; quantity: number }[] }> => {
  if (isRealGemini) {
    try {
      return await realNutritionistChat(history, prompt, cartItems, userPrefs, menuItems, orderHistory);
    } catch (e) {
      console.warn('Real Gemini API call failed, falling back to mock chat.', e);
      return await mockNutritionistChat(history, prompt, cartItems, userPrefs, menuItems, orderHistory);
    }
  } else {
    return await mockNutritionistChat(history, prompt, cartItems, userPrefs, menuItems, orderHistory);
  }
};

export const analyzeReviews = async (reviews: Review[]): Promise<AISentiment> => {
  if (isRealGemini) {
    try {
      return await realAnalyzeReviews(reviews);
    } catch (e) {
      console.warn('Real Gemini API call failed, falling back to mock review analyzer.', e);
      return await mockAnalyzeReviews(reviews);
    }
  } else {
    return await mockAnalyzeReviews(reviews);
  }
};

export const smartSearch = async (items: MenuItem[], query: string): Promise<{ ids: string[]; explanation: string }> => {
  if (isRealGemini) {
    try {
      return await realSmartSearch(items, query);
    } catch (e) {
      console.warn('Real Gemini API call failed, falling back to mock search.', e);
      return await mockSmartSearch(items, query);
    }
  }
};

// ==========================================
// RECOMMENDATION ENGINE TYPES & IMPLEMENTATION
// ==========================================

export interface RecommendationContext {
  orderHistory: Order[];
  currentTime: string;
  weather: string;
  budget: number; // in USD
  calories: number;
  protein: number;
  festival: string;
  mood: string;
  healthGoal: string;
}

export interface RecommendationResult {
  menuItemId: string;
  confidenceScore: number;
  explanation: string;
}

const realRecommendationEngine = async (
  menuItems: MenuItem[],
  context: RecommendationContext
): Promise<RecommendationResult[]> => {
  if (!ai) throw new Error('Gemini API is not initialized');
  const model = ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const menuDetails = menuItems.map(m => 
    `ID: ${m.id} | Name: ${m.name} | Price: $${m.price} | Category: ${m.category} | Macros: Cal ${m.macros.calories}, P ${m.macros.protein}g, C ${m.macros.carbs}g, F ${m.macros.fat}g | Description: ${m.description}`
  ).join('\n');

  const historyDetails = context.orderHistory.length > 0
    ? context.orderHistory.map(o => `Items: ${o.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}`).join('\n')
    : 'No previous orders';

  const systemInstruction = `You are the AI Recommendation Engine for NourishNow AI.
Your job is to analyze the available menu items, historical user behavior, environmental context, and goals, and output personalized recommendations.

Context provided:
- Current Time: ${context.currentTime}
- Weather: ${context.weather}
- Budget: $${context.budget} USD
- Calorie target: ${context.calories} kcal
- Protein target: ${context.protein}g
- Active Festival: ${context.festival}
- User Mood: ${context.mood}
- Health Goal: ${context.healthGoal}
- Previous Orders: ${historyDetails}

You must select the top 3-4 menu items that fit best.
Consider:
1. Budget (price <= budget).
2. Health goal (e.g., low carbs for Diabetes, high protein/calories for Muscle Gain, low calorie for Weight Loss).
3. Weather (refreshing options for Sunny/Hot, warm/hearty options for Rainy/Cold/Monsoon).
4. Time of day (breakfast vs. lunch/dinner).
5. Mood (comfort foods vs. energetic/cleansing foods).
6. Festival (highlight celebratory/festive flavors if a festival is active).

For every recommendation, you must write a short, highly specific, and personalized explanation of WHY it was suggested, explicitly referencing these factors.
You must also assign a confidence score (0 to 100) based on how well it satisfies the constraints.

You MUST respond ONLY with a JSON array of recommendation objects matching this schema:
[
  {
    "menuItemId": "menu-101",
    "confidenceScore": 95,
    "explanation": "Because it matches your diabetes control goal with only 5g carbs, fits within your $20 budget, and provides warming comfort on this rainy monsoon day."
  }
]`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `Generate recommendations from this menu list:\n${menuDetails}` }] }],
    systemInstruction
  });

  const responseText = result.response.text();
  return JSON.parse(cleanJSONResponse(responseText));
};

const mockRecommendationEngine = async (
  menuItems: MenuItem[],
  context: RecommendationContext
): Promise<RecommendationResult[]> => {
  await new Promise(r => setTimeout(r, 800));
  
  // Calculate a score for each menu item based on context
  const scoredItems = menuItems.map(item => {
    let score = 50; // base score
    const factors: string[] = [];

    // 1. Budget check
    if (item.price <= context.budget) {
      score += 15;
      factors.push(`priced at $${item.price.toFixed(2)} which fits your $${context.budget} budget`);
    } else {
      score -= 20;
      factors.push(`slightly exceeds your budget of $${context.budget}`);
    }

    // 2. Health Goal & Macros
    if (context.healthGoal.toLowerCase().includes('diabet') || context.healthGoal.toLowerCase().includes('low carb')) {
      if (item.macros.carbs <= 15) {
        score += 20;
        factors.push(`supports diabetes/low-carb management with only ${item.macros.carbs}g net carbs`);
      } else {
        score -= 15;
      }
    } else if (context.healthGoal.toLowerCase().includes('muscle') || context.healthGoal.toLowerCase().includes('protein')) {
      if (item.macros.protein >= 30) {
        score += 20;
        factors.push(`provides a high-protein boost of ${item.macros.protein}g protein for muscle recovery`);
      }
    } else if (context.healthGoal.toLowerCase().includes('loss') || context.healthGoal.toLowerCase().includes('weight')) {
      if (item.macros.calories <= 500) {
        score += 15;
        factors.push(`aligns with weight loss at a light ${item.macros.calories} kcal`);
      }
    }

    // 3. Time of Day
    const hour = parseInt(context.currentTime.split(':')[0]) || 12;
    if (hour < 11) { // Morning
      if (item.category.toLowerCase().includes('breakfast') || item.name.toLowerCase().includes('smoothie') || item.name.toLowerCase().includes('bowl') || item.name.toLowerCase().includes('acai')) {
        score += 15;
        factors.push(`ideal morning option for breakfast`);
      }
    } else if (hour >= 18) { // Dinner
      if (item.category.toLowerCase().includes('mains') || item.name.toLowerCase().includes('steak') || item.name.toLowerCase().includes('salmon') || item.name.toLowerCase().includes('chicken')) {
        score += 15;
        factors.push(`makes for a satisfying, nutrient-dense dinner option`);
      }
    }

    // 4. Weather
    const weather = context.weather.toLowerCase();
    if (weather.includes('rain') || weather.includes('cold') || weather.includes('monsoon')) {
      if (item.description.toLowerCase().includes('spic') || item.description.toLowerCase().includes('warm') || item.name.toLowerCase().includes('curry') || item.name.toLowerCase().includes('dahl') || item.name.toLowerCase().includes('steak') || item.name.toLowerCase().includes('pasta')) {
        score += 15;
        factors.push(`perfect warm and cozy dish for a ${context.weather} day`);
      }
    } else if (weather.includes('sun') || weather.includes('hot') || weather.includes('warm')) {
      if (item.name.toLowerCase().includes('smoothie') || item.name.toLowerCase().includes('salad') || item.name.toLowerCase().includes('acai')) {
        score += 15;
        factors.push(`refreshing and hydrating for the ${context.weather} weather`);
      }
    }

    // 5. Mood
    const mood = context.mood.toLowerCase();
    if (mood.includes('tired') || mood.includes('stress') || mood.includes('lazy')) {
      if (item.name.toLowerCase().includes('dahl') || item.name.toLowerCase().includes('pasta') || item.name.toLowerCase().includes('curry')) {
        score += 10;
        factors.push(`offers warm comfort to help ease your ${context.mood} mood`);
      }
    } else if (mood.includes('energetic') || mood.includes('happy')) {
      if (item.name.toLowerCase().includes('bowl') || item.name.toLowerCase().includes('burger')) {
        score += 10;
        factors.push(`matches your high-energy mood with wholesome whole foods`);
      }
    }

    // 6. Previous Orders
    const orderedBefore = context.orderHistory.some(o => 
      o.items.some(i => i.menuItem.name.toLowerCase() === item.name.toLowerCase())
    );
    if (orderedBefore) {
      score += 12;
      factors.push(`recommends a trusted favorite you ordered previously`);
    }

    // 7. Festival
    if (context.festival && context.festival.toLowerCase() !== 'none') {
      if (item.name.toLowerCase().includes('butter') || item.name.toLowerCase().includes('lamb') || item.category.toLowerCase().includes('dessert')) {
        score += 12;
        factors.push(`celebrates the ${context.festival} festive season with rich, traditional flavors`);
      }
    }

    // Cap confidence score between 65 and 98
    const confidenceScore = Math.max(65, Math.min(98, score));

    // Compile explanation
    let explanation = `Recommended because it ${factors.slice(0, 3).join(', and ')}.`;
    if (factors.length === 0) {
      explanation = `Highly rated option matching your active diet goal (${context.healthGoal}) and budget.`;
    }

    return {
      menuItemId: item.id,
      confidenceScore,
      explanation
    };
  });

  // Sort and return top 4
  return scoredItems
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 4);
};

export const getAIRecommendations = async (
  menuItems: MenuItem[],
  context: RecommendationContext
): Promise<RecommendationResult[]> => {
  if (isRealGemini) {
    try {
      return await realRecommendationEngine(menuItems, context);
    } catch (e) {
      console.warn('Real Gemini Recommendation API failed, falling back to mock engine.', e);
      return await mockRecommendationEngine(menuItems, context);
    }
  } else {
    return await mockRecommendationEngine(menuItems, context);
  }
};

// ==========================================
// HEALTH INSIGHTS ENGINE TYPES & IMPLEMENTATION
// ==========================================

export interface HealthInsight {
  type: 'swap' | 'warning' | 'kudos' | 'suggestion';
  title: string;
  description: string;
  originalFood?: string;
  replacementFood?: string;
  calorieDiff?: number;
  proteinDiff?: number;
  impactScore: number; // 0-100 scale
}

export interface IntakeLog {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  sodium: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string; // YYYY-MM-DD
}

const realHealthInsights = async (
  logs: IntakeLog[],
  userPrefs: UserProfile['preferences'],
  menuItems: MenuItem[]
): Promise<HealthInsight[]> => {
  if (!ai) throw new Error('Gemini API is not initialized');
  const model = ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const logDetails = logs.map(l => 
    `- ${l.mealType}: ${l.name} | Cal: ${l.calories}kcal, P: ${l.protein}g, C: ${l.carbs}g, F: ${l.fat}g, Sugar: ${l.sugar}g, Fiber: ${l.fiber}g, Sodium: ${l.sodium}mg`
  ).join('\n') || 'No meals logged yet today';

  const menuDetails = menuItems.map(m => 
    `Name: ${m.name} | Price: $${m.price} | Category: ${m.category} | Macros: Cal ${m.macros.calories}, P ${m.macros.protein}g, C ${m.macros.carbs}g, F ${m.macros.fat}g`
  ).slice(0, 15).join('\n');

  const systemInstruction = `You are the AI Nutrition Coach for NourishNow AI.
Your job is to analyze the user's logged meals for today, their preferences (Diet: ${userPrefs.diet}, Target Calories: ${userPrefs.targetCalories}kcal, Allergies: ${userPrefs.allergies.join(', ') || 'None'}), and identify actionable health improvements.

You MUST generate 3 to 4 insights. At least one must be a food swap recommendation (type: 'swap') suggesting a healthier option from our menu list to replace a less healthy item in their logs.
For swaps, specify:
- originalFood: what they logged
- replacementFood: the recommended healthier menu item
- calorieDiff: difference in calories (must be negative, e.g., -280)
- proteinDiff: difference in protein (e.g., +12)

Types of insights allowed:
1. 'swap': Replaces a high-carb/high-calorie/high-fat logged item with a healthier choice.
2. 'warning': Alerts if a limit is exceeded (e.g., high sugar, high sodium, or exceeding calorie budget).
3. 'kudos': Positive reinforcement if they met goals (e.g. high protein, low carb, or hitting calorie target closely).
4. 'suggestion': Healthy addition (e.g. "Add a Green Cleansing Smoothie to increase fiber").

You MUST respond ONLY with a JSON array of insight objects matching this schema:
[
  {
    "type": "swap",
    "title": "Smart Protein Swap",
    "description": "Swap the Spelt Pasta with our Low-Carb Zucchini Carbonara to save calories and carbs while keeping satisfying Italian flavors.",
    "originalFood": "Grass-Fed Ribeye & Chimichurri", // example original
    "replacementFood": "Avocado Bacon Salmon Skillet",   // example replacement
    "calorieDiff": -150,
    "proteinDiff": 14,
    "impactScore": 85
  }
]`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `Logged Meals:\n${logDetails}\n\nAvailable Menu items for swaps:\n${menuDetails}` }] }],
    systemInstruction
  });

  const responseText = result.response.text();
  return JSON.parse(cleanJSONResponse(responseText));
};

const mockHealthInsights = async (
  logs: IntakeLog[],
  userPrefs: UserProfile['preferences'],
  menuItems: MenuItem[]
): Promise<HealthInsight[]> => {
  await new Promise(r => setTimeout(r, 600));

  const insights: HealthInsight[] = [];
  const totalCalories = logs.reduce((sum, l) => sum + l.calories, 0);
  const totalProtein = logs.reduce((sum, l) => sum + l.protein, 0);
  const totalCarbs = logs.reduce((sum, l) => sum + l.carbs, 0);
  const totalSugar = logs.reduce((sum, l) => sum + l.sugar, 0);
  const totalSodium = logs.reduce((sum, l) => sum + l.sodium, 0);

  // 1. Swap Insight (Look for high calorie/carb logs)
  const hasHeavyItem = logs.find(l => l.calories > 400 && (l.carbs > 40 || l.fat > 30));
  if (hasHeavyItem) {
    insights.push({
      type: 'swap',
      title: 'Smart Curation Swap',
      description: `Swap the ${hasHeavyItem.name} with our Avocado Quinoa Buddha Bowl. It offers complex grains and healthy monounsaturated fats instead of refined carbs.`,
      originalFood: hasHeavyItem.name,
      replacementFood: 'Avocado Quinoa Buddha Bowl',
      calorieDiff: -220,
      proteinDiff: 6,
      impactScore: 88
    });
  } else {
    insights.push({
      type: 'swap',
      title: 'Nutritious Swap',
      description: 'Swap your side of regular French Fries with a Garden Kale Salad to save carbs and add rich micronutrients.',
      originalFood: 'French Fries',
      replacementFood: 'Garden Kale Salad',
      calorieDiff: -280,
      proteinDiff: 12,
      impactScore: 92
    });
  }

  // 2. Warning Insight
  if (totalCalories > (userPrefs.targetCalories || 2000)) {
    insights.push({
      type: 'warning',
      title: 'Calorie Limit Reached',
      description: `You have consumed ${totalCalories} kcal today, which exceeds your target of ${userPrefs.targetCalories || 2000} kcal. Consider a lighter dinner or snack.`,
      impactScore: 80
    });
  } else if (totalSodium > 2000) {
    insights.push({
      type: 'warning',
      title: 'High Sodium Intake',
      description: `Your sodium intake today is ${totalSodium}mg, approaching the recommended 2,300mg daily limit. Drink plenty of water and limit added salt for the rest of the day.`,
      impactScore: 75
    });
  } else if (totalSugar > 40) {
    insights.push({
      type: 'warning',
      title: 'Sugar Alert',
      description: `You logged ${totalSugar}g of sugar today. Consuming less refined sugar will stabilize your energy levels and prevent mid-day crashes.`,
      impactScore: 78
    });
  }

  // 3. Kudos Insight
  if (totalProtein >= 50) {
    insights.push({
      type: 'kudos',
      title: 'Exceptional Protein Intake',
      description: `Great job! You have logged ${totalProtein}g of protein today, which is excellent for muscle protein synthesis and maintaining lean mass.`,
      impactScore: 90
    });
  } else if (logs.length > 0 && totalCarbs < 50 && userPrefs.diet === 'low-carb') {
    insights.push({
      type: 'kudos',
      title: 'Keto/Low-Carb Compliance',
      description: 'Superb! You kept net carbs under 50g today, successfully remaining in alignment with your Low-Carb preference.',
      impactScore: 95
    });
  }

  // 4. Suggestion Insight
  const totalFiber = logs.reduce((sum, l) => sum + l.fiber, 0);
  if (totalFiber < 15) {
    insights.push({
      type: 'suggestion',
      title: 'Boost Daily Fiber',
      description: 'Your fiber intake is a bit low today. Try adding a Green Goddess Cleansing Smoothie to your next meal to easily secure an extra 5g of digestive fiber.',
      impactScore: 85
    });
  } else {
    insights.push({
      type: 'suggestion',
      title: 'Optimize Micronutrients',
      description: 'Add a handful of raw pumpkin seeds or walnuts to your morning snack to boost magnesium and Omega-3 intake.',
      impactScore: 70
    });
  }

  return insights;
};

export const getAIHealthInsights = async (
  logs: IntakeLog[],
  userPrefs: UserProfile['preferences'],
  menuItems: MenuItem[]
): Promise<HealthInsight[]> => {
  if (isRealGemini) {
    try {
      return await realHealthInsights(logs, userPrefs, menuItems);
    } catch (e) {
      console.warn('Real Gemini Health Insights failed, using mock engine.', e);
      return await mockHealthInsights(logs, userPrefs, menuItems);
    }
  } else {
    return await mockHealthInsights(logs, userPrefs, menuItems);
  }
};

// ==========================================
// MONTHLY ANALYTICS & REPORT GENERATOR
// ==========================================

export interface MonthlyReportResult {
  executiveSummary: string;
  nutritionMilestones: string[];
  spendingInsights: string;
  recommendations: string[];
}

const realMonthlyReport = async (
  orders: Order[],
  userPrefs: UserProfile['preferences'],
  avgCalories: number,
  avgProtein: number,
  avgCarbs: number,
  avgFat: number,
  avgHealthScore: number,
  weightHistory: { date: string; weight: number }[]
): Promise<MonthlyReportResult> => {
  if (!ai) throw new Error('Gemini API is not initialized');
  const model = ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const totalSpent = orders.reduce((sum, o) => sum + o.total_price, 0);
  const orderCount = orders.length;
  const avgOrderPrice = orderCount > 0 ? (totalSpent / orderCount).toFixed(2) : '0';

  const orderStats = orders.map(o => 
    `- Order on ${new Date(o.created_at).toLocaleDateString()}: $${o.total_price} | Restaurant: ${o.restaurant_name}`
  ).join('\n') || 'No orders logged this month';

  const weightDetails = weightHistory.map(w => 
    `- Date: ${w.date} | Weight: ${w.weight}kg`
  ).join('\n') || 'No weight records';

  const systemInstruction = `You are the Executive Chief Nutritionist at NourishNow AI.
Your job is to write a comprehensive monthly progress report based on the user's data:
- User Preferences: Diet: ${userPrefs.diet}, Target Calories: ${userPrefs.targetCalories}kcal
- Monthly Averages: Calories ${avgCalories}kcal, Protein ${avgProtein}g, Carbs ${avgCarbs}g, Fat ${avgFat}g, Avg Health Score ${avgHealthScore}/100
- Order History: Total Orders: ${orderCount}, Total Spent: $${totalSpent.toFixed(2)}, Avg Order Price: $${avgOrderPrice}
- Weight Timeline:
${weightDetails}

Provide:
1. An executiveSummary (2-3 sentences) detailing their overall diet, compliance, and milestones.
2. A list of 3 nutritionMilestones (e.g. "Achieved low-carb diet compliance 82% of the time", "Gradually decreased average weight by 1.8kg").
3. A spendingInsights summary (2 sentences) relating their food ordering behavior to their nutrition targets (e.g. "Your favorite kitchen was The Spice Route, where you ordered high-protein dishes...").
4. A list of 3 concrete recommendations for next month (e.g. "Limit high-sodium items", "Increase fiber by adding plant-based smoothies").

You MUST respond ONLY with a JSON object matching this schema:
{
  "executiveSummary": "...",
  "nutritionMilestones": ["...", "...", "..."],
  "spendingInsights": "...",
  "recommendations": ["...", "...", "..."]
}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `Order History:\n${orderStats}\n\nWeight Log:\n${weightDetails}` }] }],
    systemInstruction
  });

  const responseText = result.response.text();
  return JSON.parse(cleanJSONResponse(responseText));
};

const mockMonthlyReport = async (
  orders: Order[],
  userPrefs: UserProfile['preferences'],
  avgCalories: number,
  avgProtein: number,
  avgCarbs: number,
  avgFat: number,
  avgHealthScore: number,
  weightHistory: { date: string; weight: number }[]
): Promise<MonthlyReportResult> => {
  await new Promise(r => setTimeout(r, 600));

  const totalSpent = orders.reduce((sum, o) => sum + o.total_price, 0);
  const orderCount = orders.length;
  const avgOrderPrice = orderCount > 0 ? (totalSpent / orderCount).toFixed(2) : '0';

  const isLowCarb = userPrefs.diet === 'low-carb';
  
  return {
    executiveSummary: `You had a solid month of nutritional alignment, averaging a Health Score of ${avgHealthScore}/100. By closely matching your target calorie limits (${avgCalories} kcal actual vs ${userPrefs.targetCalories || 2000} kcal target), you maintained stable metabolic energy levels and consistent physical performance.`,
    nutritionMilestones: [
      `Maintained average protein intake at ${avgProtein}g, supporting lean muscle synthesis.`,
      isLowCarb 
        ? `Successfully limited net carbs to ${avgCarbs}g per day, maintaining therapeutic ketosis.` 
        : `Balanced carbs at ${avgCarbs}g per day with a high complex carbohydrate ratio.`,
      `Tracked weight consistently, observing a steady downward trend from ${weightHistory[0]?.weight || 72}kg to ${weightHistory[weightHistory.length - 1]?.weight || 70}kg.`
    ],
    spendingInsights: `You placed ${orderCount} healthy orders this month, spending a total of $${totalSpent.toFixed(2)} with an average order value of $${avgOrderPrice}. Your ordering habits heavily favored high-quality, high-protein curries and keto salads, helping you hit macros easily while ordering out.`,
    recommendations: [
      `Incorporate a plant-based green smoothie once a day to elevate dietary fiber and boost gut health.`,
      `Reduce high-sodium dishes (such as Butter Chicken) to twice a week to maintain optimal arterial pressure.`,
      `Introduce a 15-minute fasted walking habit in the mornings to further accelerate fat oxidization.`
    ]
  };
};

export const getAIMonthlyReport = async (
  orders: Order[],
  userPrefs: UserProfile['preferences'],
  avgCalories: number,
  avgProtein: number,
  avgCarbs: number,
  avgFat: number,
  avgHealthScore: number,
  weightHistory: { date: string; weight: number }[]
): Promise<MonthlyReportResult> => {
  if (isRealGemini) {
    try {
      return await realMonthlyReport(orders, userPrefs, avgCalories, avgProtein, avgCarbs, avgFat, avgHealthScore, weightHistory);
    } catch (e) {
      console.warn('Real Gemini Monthly Report failed, using mock engine.', e);
      return await mockMonthlyReport(orders, userPrefs, avgCalories, avgProtein, avgCarbs, avgFat, avgHealthScore, weightHistory);
    }
  } else {
    return await mockMonthlyReport(orders, userPrefs, avgCalories, avgProtein, avgCarbs, avgFat, avgHealthScore, weightHistory);
  }
};


