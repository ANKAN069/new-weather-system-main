
import { GoogleGenAI, Type } from "@google/genai";
import { WeatherData, Plant, ForecastDay, WeatherCondition, NatureAdvice } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to ensure enum validity
const sanitizeCondition = (cond: string): WeatherCondition => {
  // Normalize string (title case)
  if (!cond) return WeatherCondition.Sunny;
  
  // Map common API terms to our Enum
  const lower = cond.toLowerCase();
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) return WeatherCondition.Rainy;
  if (lower.includes('storm') || lower.includes('thunder')) return WeatherCondition.Stormy;
  if (lower.includes('cloud') || lower.includes('overcast') || lower.includes('fog') || lower.includes('mist')) return WeatherCondition.Cloudy;
  if (lower.includes('sun') || lower.includes('clear') || lower.includes('fair')) return WeatherCondition.Sunny;

  // Default checks
  const valid = Object.values(WeatherCondition);
  const match = valid.find(v => v.toLowerCase() === lower);
  return match || WeatherCondition.Sunny;
};

// Helper to clean JSON output from a text response
const parseJSONFromText = (text: string): any => {
  try {
    // Remove markdown code blocks if present
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    // Sometimes the model adds text before or after
    const firstBracket = clean.indexOf('{');
    const lastBracket = clean.lastIndexOf('}');
    if (firstBracket !== -1 && lastBracket !== -1) {
      clean = clean.substring(firstBracket, lastBracket + 1);
    }
    return JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini response:", text);
    return null;
  }
};

export const fetchWeatherAndForecast = async (location: string, dateTimeStr: string): Promise<{ current: WeatherData, forecast: ForecastDay[] } | null> => {
  try {
    // Using Google Search Grounding to get REAL data
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Use Google Search to find the CURRENT weather and 15-day forecast for location: "${location}".
        Current User Time Context: "${dateTimeStr}".

        Task:
        1. Search for current temperature, humidity, wind, rain, and AQI.
        2. **CRITICAL**: Determine if it is currently Day or Night at "${location}" based on sunset/sunrise times there.
        3. Determine specific clothing/accessory advice (e.g., "Carry an umbrella", "Wear a heavy coat", "T-shirt weather").
        4. Get a 1-sentence summary for TOMORROW's weather.
        5. Compile 15-day forecast.

        Output strict JSON:
        {
          "current": {
            "temperature": number (Celsius),
            "humidity": number (0-100),
            "windSpeed": number (km/h),
            "spm": number (AQI),
            "rainfall": number (mm),
            "condition": "Sunny" | "Rainy" | "Cloudy" | "Stormy",
            "isDay": boolean (true if sun is up, false if night),
            "clothingAdvice": "string (Short, actionable tip)",
            "tomorrowSummary": "string (Brief forecast for tomorrow)"
          },
          "forecast": [
            {
              "day": "Mon",
              "condition": "Sunny" | "Rainy" | "Cloudy" | "Stormy",
              "high": number,
              "low": number,
              "rainChance": number
            }
            ... (15 days)
          ]
        }
      `,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const rawData = parseJSONFromText(response.text || "{}");
    
    if (!rawData || !rawData.current || !rawData.forecast) {
        console.error("Invalid data structure received from Gemini", rawData);
        return null;
    }

    const weatherData: WeatherData = {
      location: location,
      condition: sanitizeCondition(rawData.current.condition),
      temperature: rawData.current.temperature,
      humidity: rawData.current.humidity,
      windSpeed: rawData.current.windSpeed,
      spm: rawData.current.spm,
      rainfall: rawData.current.rainfall,
      isDay: rawData.current.isDay !== undefined ? rawData.current.isDay : true,
      clothingAdvice: rawData.current.clothingAdvice || "Check forecast before going out.",
      tomorrowSummary: rawData.current.tomorrowSummary || "Expect similar weather tomorrow."
    };

    const forecastData: ForecastDay[] = rawData.forecast.map((d: any) => ({
      ...d,
      condition: sanitizeCondition(d.condition)
    }));

    return { current: weatherData, forecast: forecastData };

  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
};

export const generateWeatherInsight = async (data: WeatherData): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are an expert climate scientist.
        
        Context for ${data.location}:
        Condition: ${data.condition} (${data.isDay ? 'Day' : 'Night'})
        Temp: ${data.temperature}°C
        Tomorrow: ${data.tomorrowSummary}

        Provide a "Connect with My Weather" actionable tip for lifestyle/health/environment.
        Keep it under 2 sentences.
      `,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "No insight available.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate insight at this time.";
  }
};

export const calculatePlantBenefits = async (plants: Plant[], roomSize: string): Promise<string> => {
  try {
    const plantNames = plants.map(p => p.name).join(", ");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Room Size: ${roomSize}.
        Plants: ${plantNames}.

        Estimate indoor air quality impact (CO2 absorption, O2 emission).
        Verdict: Are these sufficient?
        Return Markdown.
      `,
    });
    return response.text || "Calculation failed.";
  } catch (error) {
    console.error("Gemini Plant Error:", error);
    return "Unable to calculate plant benefits.";
  }
};

export const predictGHGTrends = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a simulated, realistic daily report of Greenhouse Gas (GHG) trends for an urban city. Mention CO2, Methane, and NO2 levels. Compare it to the 'safe' limits and predict the trend for tomorrow. Keep it concise.",
    });
    return response.text || "No data.";
  } catch (error) {
    return "Error fetching GHG trends.";
  }
};

export const fetchNatureAdvice = async (weather: WeatherData): Promise<NatureAdvice | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Context: Location is "${weather.location}". 
        Weather Conditions: Humidity ${weather.humidity}%, Wind ${weather.windSpeed}km/h, SPM (Air Quality) is ${weather.spm}.
        
        Task:
        1. Suggest 4 specific plants (mix of Indoor/Outdoor) that are resilient to this weather and help filter pollutants like DUST and SMOKE (especially if SPM is high).
        2. Provide 3 actionable tips for the user to "Improve Nature" in their local area given these conditions.

        Output JSON:
        {
          "recommendedPlants": [
            { "name": "Plant Name", "type": "Indoor" | "Outdoor", "benefit": "Why it helps with dust/smoke/weather" }
          ],
          "ecoTips": [ "Tip 1", "Tip 2", "Tip 3" ]
        }
      `,
      config: {
        responseMimeType: "application/json"
      }
    });

    return parseJSONFromText(response.text || "{}");
  } catch (error) {
    console.error("Nature Advice Error:", error);
    return null;
  }
};
