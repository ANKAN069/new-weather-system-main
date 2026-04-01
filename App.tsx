
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, 
  Droplets, 
  Wind, 
  Sun, 
  Leaf, 
  TrendingUp, 
  Activity,
  MapPin,
  CalendarDays,
  Zap,
  Search,
  Loader2,
  Moon,
  Umbrella,
  AlertTriangle,
  Thermometer,
  Snowflake,
  HeartHandshake,
  TreeDeciduous
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import WeatherScene from './components/3d/WeatherScene';
import { GlassCard, StatItem } from './components/DashboardCards';
import GHGChart from './components/GHGChart';
import { generateWeatherInsight, calculatePlantBenefits, predictGHGTrends, fetchWeatherAndForecast, fetchNatureAdvice } from './services/geminiService';
import { WeatherCondition, WeatherData, Plant, AnalysisResult, ForecastDay, NatureAdvice } from './types';

// Constants
const PLANT_TYPES = [
  { id: '1', name: 'Snake Plant', type: 'Succulent', co2Absorption: 0.8, o2Emission: 0.7 },
  { id: '2', name: 'Spider Plant', type: 'Herbaceous', co2Absorption: 0.6, o2Emission: 0.6 },
  { id: '3', name: 'Peace Lily', type: 'Flowering', co2Absorption: 0.9, o2Emission: 0.8 },
  { id: '4', name: 'Aloe Vera', type: 'Succulent', co2Absorption: 0.5, o2Emission: 0.5 },
  { id: '5', name: 'Areca Palm', type: 'Palm', co2Absorption: 1.2, o2Emission: 1.1 },
];

const INITIAL_FORECAST: ForecastDay[] = Array(15).fill({
    day: '--', condition: WeatherCondition.Sunny, high: 0, low: 0, rainChance: 0 
});

function App() {
  // --- State ---
  const [time, setTime] = useState(new Date());
  const [locationInput, setLocationInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false); // Tracks if valid weather data has been loaded
  const [error, setError] = useState<string | null>(null);
  
  const [weather, setWeather] = useState<WeatherData>({
    condition: WeatherCondition.Sunny,
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    spm: 0,
    rainfall: 0,
    location: "",
    isDay: true,
    clothingAdvice: "",
    tomorrowSummary: ""
  });

  const [forecast, setForecast] = useState<ForecastDay[]>(INITIAL_FORECAST);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ghg' | 'plants'>('dashboard');
  const [geminiInsight, setGeminiInsight] = useState<AnalysisResult>({ loading: false, text: '' });
  
  // Plants & Nature State
  const [selectedPlants, setSelectedPlants] = useState<Plant[]>([]);
  const [roomSize, setRoomSize] = useState<string>("200 sq ft");
  const [plantAnalysis, setPlantAnalysis] = useState<AnalysisResult>({ loading: false, text: '' });
  const [natureAdvice, setNatureAdvice] = useState<NatureAdvice | null>(null);
  const [loadingNature, setLoadingNature] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Trigger Nature Advice when entering tab if data exists
  useEffect(() => {
    if (activeTab === 'plants' && hasLoaded && !natureAdvice && !loadingNature) {
        const loadAdvice = async () => {
            setLoadingNature(true);
            const advice = await fetchNatureAdvice(weather);
            setNatureAdvice(advice);
            setLoadingNature(false);
        };
        loadAdvice();
    }
  }, [activeTab, hasLoaded, weather, natureAdvice, loadingNature]);

  // --- Handlers ---
  const handleLocationSearch = async (searchLoc: string) => {
      if (!searchLoc.trim()) return;
      setIsSearching(true);
      setError(null);
      
      // 1. Fetch Weather & 15-Day Forecast from Gemini
      // We pass the current FULL DATE AND TIME string to ensure temperature is accurate for the specific hour
      const result = await fetchWeatherAndForecast(searchLoc, new Date().toLocaleString());
      
      if (result) {
          setWeather(result.current);
          setForecast(result.forecast);
          setGeminiInsight({ loading: false, text: '' }); // Reset insight as context changed
          setNatureAdvice(null); // Reset nature advice for new location
          setHasLoaded(true);
      } else {
          setError("Failed to retrieve weather data. Please verify the location or check your API key configuration.");
      }
      
      setIsSearching(false);
  };

  const onSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleLocationSearch(locationInput);
  };

  const handleGetInsight = useCallback(async () => {
    setGeminiInsight({ loading: true, text: '' });
    const text = await generateWeatherInsight(weather);
    setGeminiInsight({ loading: false, text });
  }, [weather]);

  const handleGetGHGReport = useCallback(async () => {
     setGeminiInsight({ loading: true, text: '' }); // Reuse insight box for GHG report in that tab
     const text = await predictGHGTrends();
     setGeminiInsight({ loading: false, text });
  }, []);

  const handlePlantAnalysis = useCallback(async () => {
    if (selectedPlants.length === 0) return;
    setPlantAnalysis({ loading: true, text: '' });
    const text = await calculatePlantBenefits(selectedPlants, roomSize);
    setPlantAnalysis({ loading: false, text });
  }, [selectedPlants, roomSize]);

  const addPlant = (plant: Plant) => {
      setSelectedPlants(prev => [...prev, plant]);
  };

  const getConditionIcon = (cond: WeatherCondition, isDay: boolean = true, size: number = 24) => {
      if (!isDay && cond === WeatherCondition.Sunny) {
          return <Moon size={size} className="text-gray-100" />;
      }
      
      switch(cond) {
          case WeatherCondition.Sunny: return <Sun size={size} className="text-yellow-400" />;
          case WeatherCondition.Rainy: return <Cloud size={size} className="text-blue-400" />;
          case WeatherCondition.Stormy: return <Zap size={size} className="text-purple-400" />;
          case WeatherCondition.Cloudy: return <Cloud size={size} className="text-gray-400" />;
          default: return <Sun size={size} />;
      }
  };

  // --- Render Helpers ---
  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Current Weather Card */}
      <GlassCard title="Current Conditions" className="lg:col-span-2">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex flex-col">
             <div className="flex items-center gap-2 text-white/70 mb-2">
                <MapPin size={16} />
                <span className="text-lg font-medium">{weather.location}</span>
             </div>
             <div className="text-6xl font-bold mb-2">{weather.temperature.toFixed(1)}°</div>
             <div className="text-xl font-medium px-3 py-1 bg-white/20 rounded-full self-start backdrop-blur-sm flex items-center gap-2">
               {getConditionIcon(weather.condition, weather.isDay, 20)}
               {(!weather.isDay && weather.condition === WeatherCondition.Sunny) ? 'Clear' : weather.condition}
             </div>
          </div>
          
          <div className="flex flex-col gap-4 w-full md:w-auto min-w-[200px]">
             {/* Alerts for Extreme Conditions */}
             {(weather.humidity > 80 || weather.windSpeed > 20 || weather.temperature > 35 || weather.temperature < 5) && (
                <div className="flex flex-wrap gap-2">
                  {weather.humidity > 80 && (
                    <div className="px-3 py-1 bg-blue-600/40 border border-blue-400/40 rounded-full text-xs font-bold text-blue-100 flex items-center gap-1 animate-pulse">
                      <Droplets size={10} /> HIGH HUMIDITY
                    </div>
                  )}
                  {weather.windSpeed > 20 && (
                    <div className="px-3 py-1 bg-slate-600/40 border border-slate-400/40 rounded-full text-xs font-bold text-slate-100 flex items-center gap-1 animate-pulse">
                      <Wind size={10} /> HIGH WIND
                    </div>
                  )}
                  {weather.temperature > 35 && (
                     <div className="px-3 py-1 bg-red-600/40 border border-red-400/40 rounded-full text-xs font-bold text-red-100 flex items-center gap-1 animate-pulse">
                       <Thermometer size={10} /> EXTREME HEAT
                     </div>
                  )}
                  {weather.temperature < 5 && (
                     <div className="px-3 py-1 bg-cyan-600/40 border border-cyan-400/40 rounded-full text-xs font-bold text-cyan-100 flex items-center gap-1 animate-pulse">
                       <Snowflake size={10} /> FREEZING
                     </div>
                  )}
                </div>
             )}

             {/* Important Advice Pill */}
             {weather.clothingAdvice && (
                 <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-start gap-3">
                    <Umbrella size={20} className="text-blue-200 mt-1 shrink-0" />
                    <div>
                        <div className="text-xs text-blue-200 font-bold uppercase">Necessary Now</div>
                        <div className="text-sm font-medium text-white">{weather.clothingAdvice}</div>
                    </div>
                 </div>
             )}

             <div className="grid grid-cols-2 gap-2">
                <StatItem label="Humidity" value={weather.humidity} unit="%" icon={<Droplets size={16} className="text-blue-300"/>} />
                <StatItem label="Wind" value={weather.windSpeed} unit="km/h" icon={<Wind size={16} className="text-gray-300"/>} />
                <StatItem label="Rain" value={weather.rainfall} unit="mm" icon={<Cloud size={16} className="text-indigo-300"/>} />
                <StatItem label="AQI" value={weather.spm} unit="" icon={<Activity size={16} className="text-yellow-300"/>} />
             </div>
          </div>
        </div>
        
        {/* Connect with My Weather */}
        <div className="mt-6 p-5 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-xl border border-blue-500/20">
             <h4 className="text-lg font-semibold text-blue-100 mb-2 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-300"/> 
                Connect with My Weather
             </h4>
             {geminiInsight.loading ? (
                 <div className="animate-pulse space-y-2">
                     <div className="h-4 bg-white/10 rounded w-3/4"></div>
                     <div className="h-4 bg-white/10 rounded w-1/2"></div>
                 </div>
             ) : (
                 <div className="text-sm leading-relaxed opacity-90 text-blue-50">
                    {geminiInsight.text ? (
                        <ReactMarkdown>{geminiInsight.text}</ReactMarkdown>
                    ) : (
                        <p className="italic text-white/50">
                            Click 'Analyze' for personalized lifestyle tips based on today's weather.
                        </p>
                    )}
                 </div>
             )}
             <button 
                onClick={handleGetInsight}
                disabled={geminiInsight.loading}
                className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg w-full md:w-auto flex items-center justify-center gap-2"
             >
                {geminiInsight.loading ? (
                    'Analyzing...' 
                ) : (
                    <>
                        <Zap size={16} />
                        Analyze with Gemini AI
                    </>
                )}
             </button>
        </div>
      </GlassCard>

      {/* Tomorrow & Climate Info */}
      <GlassCard title="Tomorrow & Impact">
         <div className="space-y-6">
             {/* Tomorrow Summary */}
             <div className="p-4 bg-indigo-900/30 rounded-xl border border-indigo-500/20">
                 <div className="flex items-center gap-2 mb-2">
                     <CalendarDays size={16} className="text-indigo-300"/>
                     <span className="text-indigo-200 font-bold text-sm uppercase">Tomorrow's Outlook</span>
                 </div>
                 <p className="text-sm text-white/90 leading-snug">
                    {weather.tomorrowSummary || "Forecast data pending..."}
                 </p>
             </div>

            {/* Carbon Sequestration */}
            <div className="p-4 bg-green-900/30 rounded-xl border border-green-500/20">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-green-200 font-medium text-sm">CO2 Absorption</span>
                    <span className="text-white font-bold">45%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-3">
                    <div className="bg-green-500 h-2.5 rounded-full transition-all duration-1000" style={{width: '45%'}}></div>
                </div>
                <div className="flex justify-between text-xs text-white/60">
                    <span>Local vegetation index: High</span>
                    <span className="text-green-400">2.4t Offset</span>
                </div>
            </div>
         </div>
      </GlassCard>

      {/* 15-Day Forecast Row */}
      <GlassCard title="15-Day Weather Forecast" className="lg:col-span-3">
          {isSearching ? (
             <div className="flex justify-center py-10">
                 <Loader2 className="animate-spin text-blue-400" size={32} />
             </div>
          ) : (
              <div className="overflow-x-auto pb-4 custom-scrollbar">
                  <div className="flex gap-4 min-w-max px-1">
                      {forecast.map((day, idx) => (
                          <div key={idx} className="flex flex-col items-center min-w-[100px] p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all hover:scale-105 cursor-pointer border border-white/5">
                              <span className="text-sm font-medium text-white/70 mb-2">{day.day}</span>
                              <div className="mb-3">{getConditionIcon(day.condition, true, 28)}</div>
                              <div className="flex flex-col items-center gap-1 text-sm w-full">
                                  <div className="flex justify-between w-full px-2">
                                      <span className="font-bold">{day.high.toFixed(0)}°</span>
                                      <span className="text-white/40">{day.low.toFixed(0)}°</span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-1 text-xs text-blue-300">
                                      <Droplets size={10} />
                                      {day.rainChance}%
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </GlassCard>
    </div>
  );

  const renderGHG = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        <GlassCard title="Greenhouse Gas Monitor" className="lg:col-span-2 h-96">
            <GHGChart />
        </GlassCard>
        <GlassCard title="Emission Analysis">
            <div className="space-y-4">
                <p className="text-sm text-white/80">
                    Real-time estimation of urban emission sources.
                </p>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm p-2 bg-red-500/10 rounded">
                        <span>Transport</span>
                        <span className="text-red-300 font-bold">High (45%)</span>
                    </div>
                    <div className="flex justify-between text-sm p-2 bg-yellow-500/10 rounded">
                        <span>Industrial</span>
                        <span className="text-yellow-300 font-bold">Moderate (30%)</span>
                    </div>
                    <div className="flex justify-between text-sm p-2 bg-green-500/10 rounded">
                        <span>Residential</span>
                        <span className="text-green-300 font-bold">Low (25%)</span>
                    </div>
                </div>
                <button 
                  onClick={handleGetGHGReport}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-bold transition-colors mt-4 shadow-lg"
                >
                    Generate Forecast Report
                </button>
                {geminiInsight.text && activeTab === 'ghg' && (
                    <div className="mt-2 p-3 bg-purple-900/30 rounded border border-purple-500/20 text-xs max-h-40 overflow-y-auto">
                        <ReactMarkdown>{geminiInsight.text}</ReactMarkdown>
                    </div>
                )}
            </div>
        </GlassCard>
    </div>
  );

  const renderPlants = () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* New AI Nature Recommendations Column */}
          <GlassCard title="Nature Restoration & Advice" className="lg:col-span-1">
              {loadingNature ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                      <Loader2 className="animate-spin text-green-400" size={32} />
                      <p className="text-sm text-white/60 text-center">Analyzing air quality and local flora...</p>
                  </div>
              ) : natureAdvice ? (
                  <div className="space-y-6 h-full overflow-y-auto custom-scrollbar pr-1">
                      
                      {/* Eco Tips Section */}
                      <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3 text-green-300">
                              <HeartHandshake size={18} />
                              <span className="font-semibold text-sm">How to Improve Nature</span>
                          </div>
                          <ul className="space-y-3">
                              {natureAdvice.ecoTips.map((tip, i) => (
                                  <li key={i} className="text-xs text-white/80 flex gap-2">
                                      <span className="text-green-400">•</span>
                                      {tip}
                                  </li>
                              ))}
                          </ul>
                      </div>

                      {/* Recommended Plants Section */}
                      <div>
                          <div className="flex items-center gap-2 mb-3 text-emerald-300">
                              <TreeDeciduous size={18} />
                              <span className="font-semibold text-sm">Recommended for Dust/Smoke</span>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                              {natureAdvice.recommendedPlants.map((plant, i) => (
                                  <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                                      <div className="flex justify-between items-start mb-1">
                                          <span className="font-bold text-sm text-white">{plant.name}</span>
                                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${plant.type === 'Indoor' ? 'bg-purple-500/30 text-purple-200' : 'bg-orange-500/30 text-orange-200'}`}>
                                              {plant.type}
                                          </span>
                                      </div>
                                      <p className="text-[11px] text-white/60 leading-snug">{plant.benefit}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="text-center text-white/40 py-10">
                      Waiting for data...
                  </div>
              )}
          </GlassCard>

          {/* Existing Indoor Simulation */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard title="Room Configuration" className="md:col-span-1">
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">Room Size (sq ft)</label>
                        <input 
                            type="text" 
                            value={roomSize} 
                            onChange={(e) => setRoomSize(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">Simulator Plants</label>
                        <div className="grid grid-cols-1 gap-2">
                            {PLANT_TYPES.map(plant => (
                                <button 
                                    key={plant.id}
                                    onClick={() => addPlant(plant)}
                                    className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/20 border border-white/10 rounded-lg transition-all group"
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold text-sm group-hover:text-green-300 transition-colors">{plant.name}</span>
                                        <span className="text-white/50 text-[10px]">{plant.type}</span>
                                    </div>
                                    <Leaf size={14} className="text-white/20 group-hover:text-green-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </GlassCard>

            <GlassCard title="Indoor Ecosystem Simulation" className="md:col-span-2">
                <div className="flex flex-col h-full">
                    <div className="flex-grow mb-6">
                        {selectedPlants.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-white/30 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                                <Leaf size={48} className="mb-4 opacity-50" />
                                <p className="font-medium">Add plants to simulate your environment</p>
                                <p className="text-sm mt-1">Calculate CO2 absorbance & O2 emission</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-3 content-start">
                                {selectedPlants.map((p, i) => (
                                    <div key={i} className="bg-gradient-to-r from-green-600/40 to-emerald-600/40 border border-green-400/30 px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-sm animate-fade-in">
                                        <Leaf size={12} className="text-green-300"/>
                                        <span>{p.name}</span>
                                        <button 
                                            className="ml-1 text-white/60 hover:text-red-300 hover:bg-red-500/20 rounded-full w-5 h-5 flex items-center justify-center transition-all"
                                            onClick={() => setSelectedPlants(prev => prev.filter((_, idx) => idx !== i))}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {plantAnalysis.text && (
                        <div className="mb-4 p-5 bg-white/5 rounded-xl text-sm max-h-60 overflow-y-auto border border-white/10">
                            <ReactMarkdown>{plantAnalysis.text}</ReactMarkdown>
                        </div>
                    )}

                    <button 
                        onClick={handlePlantAnalysis}
                        disabled={plantAnalysis.loading || selectedPlants.length === 0}
                        className="mt-auto w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-shadow shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                    >
                        {plantAnalysis.loading ? (
                            'Calculating Biometrics...'
                        ) : (
                            <>
                                <Activity size={20} />
                                Calculate CO2 Absorbance & O2 Emission
                            </>
                        )}
                    </button>
                </div>
            </GlassCard>
          </div>
      </div>
  );

  return (
    <div className="relative w-full min-h-screen text-white overflow-hidden selection:bg-blue-500/30">
      {/* 3D Background Layer */}
      <WeatherScene condition={weather.condition} isDay={weather.isDay} />

      {/* Main UI Content */}
      <div className="relative z-10 w-full h-full flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        
        {/* Header - Only shown after loading, or partially shown */}
        <header className={`flex flex-col md:flex-row justify-between items-center mb-8 transition-all duration-500 ${!hasLoaded ? 'h-[80vh] justify-center' : 'bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl gap-4'}`}>
           
           {/* Logo & Title - Centered if not loaded */}
           <div className={`flex items-center gap-4 w-full md:w-auto ${!hasLoaded ? 'flex-col mb-8' : 'justify-start'}`}>
              <div className={`p-3 bg-blue-500/20 rounded-xl border border-blue-400/10 shadow-inner transition-all ${!hasLoaded ? 'scale-150 mb-4' : ''}`}>
                 <Cloud className="text-blue-300" size={!hasLoaded ? 48 : 32} />
              </div>
              <div className={!hasLoaded ? 'text-center' : ''}>
                 <h1 className={`font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 ${!hasLoaded ? 'text-5xl mb-2' : 'text-2xl'}`}>Today's Weather</h1>
                 <p className={`text-blue-200 uppercase tracking-[0.2em] font-semibold ${!hasLoaded ? 'text-sm' : 'text-[10px]'}`}>Advanced Climate Monitor</p>
              </div>
           </div>

           {/* Search Bar - Large and Central if not loaded */}
           <div className={`flex flex-col w-full transition-all duration-500 ${!hasLoaded ? 'max-w-2xl' : 'max-w-md'}`}>
               <form onSubmit={onSearchSubmit} className="w-full relative">
                   <input 
                     type="text" 
                     value={locationInput}
                     onChange={(e) => setLocationInput(e.target.value)}
                     placeholder="enter your current location" 
                     className={`w-full bg-white/5 border ${error ? 'border-red-400/50' : 'border-white/10'} rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all shadow-xl ${!hasLoaded ? 'py-4 pl-12 pr-4 text-xl' : 'py-2.5 pl-10 pr-4'}`}
                     autoFocus={!hasLoaded}
                   />
                   <Search className={`absolute text-white/40 ${!hasLoaded ? 'left-4 top-1/2 -translate-y-1/2 w-6 h-6' : 'left-3 top-1/2 -translate-y-1/2 w-4 h-4'}`} />
                   <button 
                     type="submit"
                     disabled={isSearching}
                     className={`absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 ${!hasLoaded ? 'p-2.5' : 'p-1.5'}`}
                   >
                     {isSearching ? <Loader2 className="animate-spin" size={!hasLoaded ? 20 : 14} /> : <Search size={!hasLoaded ? 20 : 14} />}
                   </button>
               </form>
               
               {/* Error Message */}
               {error && (
                   <div className={`mt-3 flex items-center gap-2 text-red-300 text-sm bg-red-900/20 p-2 rounded-lg border border-red-500/20 animate-fade-in ${!hasLoaded ? 'justify-center' : ''}`}>
                       <AlertTriangle size={16} />
                       <span>{error}</span>
                   </div>
               )}
           </div>

           {/* Time Display - Only show when loaded or maybe simpler version */}
           {hasLoaded && (
               <div className="hidden md:flex flex-col items-end justify-center w-auto min-w-[120px] animate-fade-in">
                   <div className="text-2xl font-mono font-bold text-white tracking-widest">
                       {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </div>
                   <div className="text-xs text-blue-200 font-medium">
                       {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                   </div>
               </div>
           )}
        </header>

        {/* Main Content Area - Only Render if Loaded */}
        {hasLoaded && (
            <>
                {/* Navigation */}
                <nav className="flex space-x-2 mb-8 overflow-x-auto pb-2 hide-scrollbar animate-fade-in">
                    {[
                        { id: 'dashboard', label: 'Weather & Climate', icon: <CalendarDays size={18} /> },
                        { id: 'ghg', label: 'GHG Monitor', icon: <Activity size={18} /> },
                        { id: 'plants', label: 'Nature & Plants', icon: <Leaf size={18} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap border ${
                                activeTab === tab.id 
                                ? 'bg-white text-slate-900 border-white shadow-xl shadow-blue-900/20 scale-105' 
                                : 'bg-slate-900/30 text-white border-white/5 hover:bg-white/10 hover:border-white/20'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Tab Content */}
                <main className="flex-grow pb-10">
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'ghg' && renderGHG()}
                    {activeTab === 'plants' && renderPlants()}
                </main>
            </>
        )}

      </div>
      
      {/* Footer attribution & Status */}
      <div className="absolute bottom-2 w-full px-8 flex justify-between items-end text-[10px] text-white/20 z-20 pointer-events-none">
         <span>Powered by Gemini AI & React Three Fiber</span>
      </div>
    </div>
  );
}

export default App;
    