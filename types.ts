
export enum WeatherCondition {
  Sunny = 'Sunny',
  Rainy = 'Rainy',
  Cloudy = 'Cloudy',
  Stormy = 'Stormy',
}

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number; // Celsius
  humidity: number; // %
  windSpeed: number; // km/h
  spm: number; // Suspended Particulate Matter
  rainfall: number; // mm
  location: string;
  isDay: boolean; // New: Tracks day/night cycle
  clothingAdvice: string; // New: Specific advice like "Carry umbrella"
  tomorrowSummary: string; // New: Text summary for tomorrow
}

export interface ForecastDay {
  day: string;
  condition: WeatherCondition;
  high: number;
  low: number;
  rainChance: number;
}

export interface GHGData {
  source: string;
  co2: number;
  methane: number;
  nitrousOxide: number;
  timestamp: string;
}

export interface Plant {
  id: string;
  name: string;
  type: string;
  co2Absorption: number; // arbitrary units per hour
  o2Emission: number; // arbitrary units per hour
}

export interface AnalysisResult {
  loading: boolean;
  text: string;
  error?: string;
}

export interface NatureAdvice {
  recommendedPlants: { name: string; benefit: string; type: 'Outdoor' | 'Indoor' }[];
  ecoTips: string[];
}
