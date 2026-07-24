import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { query } from '@/lib/db';

const CATEGORIES_LIST = [
  { id: 1, name: 'Plumbing' },
  { id: 2, name: 'Electrical Work' },
  { id: 3, name: 'Carpentry' },
  { id: 4, name: 'Masonry' },
  { id: 5, name: 'Tailoring' },
  { id: 6, name: 'Hairdressing' },
  { id: 7, name: 'Painting' },
  { id: 8, name: 'Welding' },
  { id: 9, name: 'Mechanics' },
  { id: 10, name: 'Fashion Design' }
];

const REGIONS_LIST = [
  'Greater Accra', 'Ashanti', 'Eastern', 'Western', 'Central', 'Volta', 'Northern',
  'Upper East', 'Upper West', 'Bono', 'Bono East', 'Ahafo', 'Savannah', 'North East',
  'Oti', 'Western North'
];

function getAiClient() {
  if (process.env.USE_GEMINI_API !== 'true') return null;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith('your_')) return null;

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'skillsconnect-ghana' }
    }
  });
}

function getOpenRouterConfig() {
  if (process.env.USE_OPENROUTER_API !== 'true') return null;

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith('your_')) return null;

  return {
    apiKey,
    model: process.env.OPENROUTER_MODEL || 'openrouter/free'
  };
}

function getAgentRouterConfig() {
  if (process.env.USE_AGENTROUTER_API !== 'true') return null;

  const apiKey = process.env.AGENTROUTER_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith('your_')) return null;

  return {
    apiKey,
    url: process.env.AGENTROUTER_API_URL?.trim() || 'https://api.agentrouter.com/v1/chat/completions',
    model: process.env.AGENTROUTER_MODEL || 'gpt-4o-mini'
  };
}

function parseProviderChatResponse(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI provider returned an empty response.');

  const jsonText = content.match(/\{[\s\S]*\}/)?.[0] || content;
  return JSON.parse(jsonText);
}

function findMatch(text, values) {
  const normalized = text.toLowerCase();
  return values.find((value) => normalized.includes(value.toLowerCase())) || null;
}

function buildLocalMatch(message) {
  const categoryKeywords = [
    ['plumber', 'plumbing'],
    ['electrician', 'electrical work'],
    ['carpenter', 'carpentry'],
    ['mason', 'masonry'],
    ['tailor', 'tailoring'],
    ['hairdresser', 'hairdressing'],
    ['painter', 'painting'],
    ['welder', 'welding'],
    ['mechanic', 'mechanics'],
    ['fashion', 'fashion design']
  ];
  const normalized = message.toLowerCase();
  const categoryMatch = categoryKeywords.find(([keyword]) => normalized.includes(keyword));
  const category = categoryMatch
    ? CATEGORIES_LIST.find((item) => item.name.toLowerCase() === categoryMatch[1])
    : null;
  const region = findMatch(message, REGIONS_LIST);
  const district = ['East Legon', 'Kumasi', 'Tema', 'Osu', 'Madina', 'Bantama', 'Accra']
    .find((place) => normalized.includes(place.toLowerCase())) || null;

  return {
    category_id: category?.id || null,
    category_name: category?.name || null,
    region,
    district,
    ai_reply: category
      ? `Akwaaba! I matched your request to ${category.name}${region ? ` in ${region}` : ''}. Here are verified professionals you can contact.`
      : 'Akwaaba! Please tell me which trade you need, such as plumbing, electrical work, carpentry, or tailoring, and your Ghanaian location.'
  };
}

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Please enter a valid message'
      }, { status: 400 });
    }

    const cleanMessage = message.trim().slice(0, 1000);
    let parsedResult;
    let source = 'local';
    const ai = getAiClient();
    const openRouter = getOpenRouterConfig();
    const agentrouter = getAgentRouterConfig();

    // Use local matching when no external AI provider is configured or available.
    if (!ai && !openRouter && !agentrouter) {
      parsedResult = buildLocalMatch(cleanMessage);
    }

    // Build the prompt for Gemini, OpenRouter, or AgentRouter when a credential is available.
    const systemPrompt = `You are "Akwaaba AI", the intelligent local artisan matcher for SkillsConnect Ghana.
Your job is to analyze the customer's description of their domestic job or service requirement, and map it to:
1. One of our 10 professional trade categories.
2. One of the 16 standard regions of Ghana.
3. Identify specific districts or neighborhoods (like East Legon, Kumasi, Tema, Osu, Madina, Bantama, etc.) if mentioned.

Our 10 valid categories and their exact IDs:
${CATEGORIES_LIST.map(c => `- ID ${c.id}: "${c.name}"`).join('\n')}

Our 16 valid regions in Ghana:
${REGIONS_LIST.map(r => `- "${r}"`).join('\n')}

Be friendly, professional, and use a pleasant local Ghanaian conversational tone (e.g. use "Akwaaba", "Chale", "No problem at all", "we've got you covered"). Explain what you found and how we can help.
If the customer's request is vague or doesn't specify a trade, set category_id/category_name to null and ask them to clarify what service they need.`;

    if (agentrouter) {
      try {
        const response = await fetch(agentrouter.url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${agentrouter.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: agentrouter.model,
            messages: [
              { role: 'system', content: `${systemPrompt}\nReturn only valid JSON with these keys: category_id, category_name, region, district, ai_reply.` },
              { role: 'user', content: cleanMessage }
            ]
          })
        });

        if (!response.ok) throw new Error(`AgentRouter request failed with status ${response.status}.`);
        parsedResult = parseProviderChatResponse(await response.json());
        source = 'agentrouter';
      } catch (error) {
        console.warn('AgentRouter unavailable, using local matcher:', error.message);
        parsedResult = buildLocalMatch(cleanMessage);
      }
    } else if (openRouter) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouter.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://127.0.0.1:3000',
            'X-Title': 'SkillsConnect Ghana'
          },
          body: JSON.stringify({
            model: openRouter.model,
            messages: [
              { role: 'system', content: `${systemPrompt}\nReturn only valid JSON with these keys: category_id, category_name, region, district, ai_reply.` },
              { role: 'user', content: cleanMessage }
            ],
            response_format: { type: 'json_object' }
          })
        });

        if (!response.ok) throw new Error(`OpenRouter request failed with status ${response.status}.`);
        parsedResult = parseProviderChatResponse(await response.json());
        source = 'openrouter';
      } catch (error) {
        console.warn('OpenRouter unavailable, using local matcher:', error.message);
        parsedResult = buildLocalMatch(cleanMessage);
      }
    } else if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: cleanMessage,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category_id: { type: Type.INTEGER, description: "The matched category ID (1-10) or null if not detected" },
                category_name: { type: Type.STRING, description: "The exact matching category name or null if not detected" },
                region: { type: Type.STRING, description: "The exact matched region of Ghana from the list, or null if not detected" },
                district: { type: Type.STRING, description: "Any district, suburb, or neighborhood named in the message, or null if not detected" },
                ai_reply: { type: Type.STRING, description: "A friendly, warm local-style reply explaining what was detected and introducing the matches." }
              },
              required: ["category_id", "category_name", "region", "district", "ai_reply"]
            }
          }
        });

        parsedResult = JSON.parse(response.text.trim());
        source = 'gemini';
      } catch (error) {
        console.warn('Gemini unavailable, using local matcher:', error.message);
        parsedResult = buildLocalMatch(cleanMessage);
      }
    }

    // Execute actual database lookup based on extracted criteria
    let matchedArtisans = [];
    let queryConditions = ['u.is_active = 1', 'ap.is_approved = 1'];
    let queryParams = [];

    if (parsedResult.category_id) {
      queryConditions.push('ap.category_id = ?');
      queryParams.push(parsedResult.category_id);
    }

    if (parsedResult.region) {
      queryConditions.push('u.region = ?');
      queryParams.push(parsedResult.region);
    }

    const whereClause = queryConditions.length > 0 ? 'WHERE ' + queryConditions.join(' AND ') : '';

    if (parsedResult.category_id) {
      const sql = `
        SELECT 
          u.user_id, u.full_name, u.email, u.phone, u.region, u.district, u.profile_photo,
          ap.profile_id, ap.category_id, ap.bio, ap.years_experience, ap.average_rating, ap.total_reviews, ap.profile_views, ap.is_approved, ap.service_areas
        FROM users u
        INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
        ${whereClause}
        ORDER BY ap.average_rating DESC, ap.total_reviews DESC
        LIMIT 5
      `;

      const results = await query(sql, queryParams);

      matchedArtisans = results.map(artisan => {
        let areaArray = [];
        if (artisan.service_areas) {
          areaArray = artisan.service_areas.split(',').map(s => s.trim()).filter(Boolean);
        }
        return {
          ...artisan,
          service_areas: areaArray
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        category_id: parsedResult.category_id,
        category_name: parsedResult.category_name,
        region: parsedResult.region,
        district: parsedResult.district,
        reply: parsedResult.ai_reply,
        matchedArtisans,
        source
      }
    });

  } catch (error) {
    console.error('AI Matchmaker API Error:', error);
    const fallback = buildLocalMatch('');
    return NextResponse.json({
      success: true,
      data: {
        ...fallback,
        reply: 'The AI service is temporarily unavailable, so I used local SkillsConnect matching. Please specify a trade and location for a more precise result.',
        matchedArtisans: [],
        source: 'local'
      }
    });
  }
}
