import type { WeatherData, SunData, LocationData, WeatherContext } from './types';

// OpenWeatherMap API interfaces
interface OpenWeatherResponse {
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg?: number;
  };
  rain?: {
    '1h'?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  name: string;
}

interface OpenWeatherAQIResponse {
  list: Array<{
    main: {
      aqi: number;
    };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
  }>;
}

interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

/**
 * Get user's current location using browser geolocation API
 */
export async function getCurrentLocation(): Promise<GeolocationCoords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        // Fallback to a default location (San Francisco) if geolocation fails
        console.warn('Geolocation failed, using default location:', error.message);
        resolve({
          latitude: 37.7749,
          longitude: -122.4194,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

/**
 * Convert Kelvin to Fahrenheit
 */
function kelvinToFahrenheit(kelvin: number): number {
  return Math.round((kelvin - 273.15) * 9/5 + 32);
}

/**
 * Convert meters per second to miles per hour
 */
function mpsToMph(mps: number): number {
  return Math.round(mps * 2.237);
}

/**
 * Calculate minutes until sunset/sunrise
 */
function calculateMinutesTo(targetTime: Date): number {
  const now = new Date();
  const diffMs = targetTime.getTime() - now.getTime();
  return Math.round(diffMs / (1000 * 60));
}

/**
 * Determine time of day category
 */
function getTimeOfDay(now: Date, sunrise: Date, sunset: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = now.getHours();
  const isAfterSunrise = now > sunrise;
  const isBeforeSunset = now < sunset;

  if (!isAfterSunrise || !isBeforeSunset) {
    return 'night';
  } else if (hour < 12) {
    return 'morning';
  } else if (hour < 17) {
    return 'afternoon';
  } else {
    return 'evening';
  }
}

/**
 * Calculate rain probability from cloud coverage and other factors
 */
function estimateRainProbability(data: OpenWeatherResponse): number {
  const cloudCover = data.clouds.all;
  const hasRainData = data.rain && data.rain['1h'];
  const humidity = data.main.humidity;
  
  if (hasRainData && data.rain!['1h']! > 0) {
    return Math.min(95, cloudCover + 20);
  }
  
  // Estimate based on cloud cover and humidity
  const baseProb = cloudCover * 0.6;
  const humidityBonus = humidity > 80 ? 15 : humidity > 60 ? 5 : 0;
  
  return Math.min(100, Math.round(baseProb + humidityBonus));
}

/**
 * Get mock weather data for development/testing
 */
function getMockWeatherData(): WeatherData {
  // Create realistic mock data that changes based on time of day
  const hour = new Date().getHours();
  const isEvening = hour >= 17 && hour <= 20;
  const isHot = hour >= 11 && hour <= 16;
  
  return {
    feelsLike: isHot ? 82 : isEvening ? 68 : 55,
    temperature: isHot ? 78 : isEvening ? 65 : 52,
    humidity: isEvening ? 45 : 60,
    precipitation: isEvening ? 5 : 15,
    windSpeed: isEvening ? 8 : 12,
    aqi: 45,
    uvIndex: isHot ? 8 : 3,
    visibility: 10,
    description: isHot ? 'Clear' : isEvening ? 'Partly cloudy' : 'Overcast',
    icon: isHot ? '01d' : isEvening ? '02d' : '03d'
  };
}

/**
 * Fetch current weather data for given coordinates
 */
export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  
  console.log('API Key exists:', !!apiKey);
  console.log('API Key first 10 chars:', apiKey ? apiKey.substring(0, 10) : 'undefined');
  
  if (!apiKey) {
    console.warn('No OpenWeatherMap API key found, using mock data');
    return getMockWeatherData();
  }

  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  console.log('Weather URL:', weatherUrl.replace(apiKey, '[REDACTED]'));
  
  try {
    const response = await fetch(weatherUrl);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      console.warn('Weather API failed, falling back to mock data');
      return getMockWeatherData();
    }
    
    const data: OpenWeatherResponse = await response.json();
    
    return {
      feelsLike: kelvinToFahrenheit(data.main.feels_like),
      temperature: kelvinToFahrenheit(data.main.temp),
      humidity: data.main.humidity,
      precipitation: estimateRainProbability(data),
      windSpeed: mpsToMph(data.wind.speed),
      aqi: 50, // Will be updated by fetchAQIData
      uvIndex: 5, // Default value, would need UV API for actual data
      visibility: Math.round(data.visibility / 1609.34), // Convert meters to miles
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    console.warn('Weather API failed, falling back to mock data');
    return getMockWeatherData();
  }
}

/**
 * Fetch Air Quality Index data
 */
export async function fetchAQIData(lat: number, lon: number): Promise<number> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    console.warn('No API key, using mock AQI data');
    return 50; // Default moderate AQI
  }

  const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  
  try {
    const response = await fetch(aqiUrl);
    if (!response.ok) {
      console.warn('AQI API failed, using default value');
      return 50; // Default on error
    }
    
    const data: OpenWeatherAQIResponse = await response.json();
    
    if (data.list && data.list.length > 0) {
      // Convert OpenWeather AQI scale (1-5) to US EPA scale (0-500)
      const owmAqi = data.list[0].main.aqi;
      const aqiConversion = [0, 50, 100, 150, 200, 300];
      return aqiConversion[owmAqi] || 50;
    }
    
    return 50;
  } catch (error) {
    console.error('Error fetching AQI data:', error);
    return 50; // Default moderate AQI
  }
}

/**
 * Get sun data (sunrise, sunset, etc.)
 */
export async function fetchSunData(lat: number, lon: number): Promise<SunData> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    console.warn('No API key, using mock sun data');
    // Provide reasonable defaults based on current time
    const now = new Date();
    const sunrise = new Date(now);
    sunrise.setHours(6, 30, 0, 0);
    const sunset = new Date(now);
    sunset.setHours(19, 30, 0, 0);
    
    return {
      sunrise,
      sunset,
      minutesToSunset: calculateMinutesTo(sunset),
      minutesToSunrise: calculateMinutesTo(sunrise),
      isDaytime: now > sunrise && now < sunset,
    };
  }

  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  
  try {
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      console.warn('Sun data API failed, using defaults');
      // Fallback to defaults
      const now = new Date();
      const sunrise = new Date(now);
      sunrise.setHours(6, 30, 0, 0);
      const sunset = new Date(now);
      sunset.setHours(19, 30, 0, 0);
      
      return {
        sunrise,
        sunset,
        minutesToSunset: calculateMinutesTo(sunset),
        minutesToSunrise: calculateMinutesTo(sunrise),
        isDaytime: now > sunrise && now < sunset,
      };
    }
    
    const data: OpenWeatherResponse = await response.json();
    
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);
    const now = new Date();
    
    return {
      sunrise,
      sunset,
      minutesToSunset: calculateMinutesTo(sunset),
      minutesToSunrise: calculateMinutesTo(sunrise),
      isDaytime: now > sunrise && now < sunset,
    };
  } catch (error) {
    console.error('Error fetching sun data:', error);
    console.warn('Sun data error, using defaults');
    // Fallback defaults
    const now = new Date();
    const sunrise = new Date(now);
    sunrise.setHours(6, 30, 0, 0);
    const sunset = new Date(now);
    sunset.setHours(19, 30, 0, 0);
    
    return {
      sunrise,
      sunset,
      minutesToSunset: calculateMinutesTo(sunset),
      minutesToSunrise: calculateMinutesTo(sunrise),
      isDaytime: now > sunrise && now < sunset,
    };
  }
}

/**
 * Get location information from coordinates
 */
export async function fetchLocationData(lat: number, lon: number): Promise<LocationData> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    return {
      latitude: lat,
      longitude: lon,
      city: 'Unknown',
      region: 'Unknown',
      country: 'US',
      timezone: 'America/Los_Angeles',
    };
  }

  const geocodeUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
  
  try {
    const response = await fetch(geocodeUrl);
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const location = data[0];
      return {
        latitude: lat,
        longitude: lon,
        city: location.name || 'Unknown',
        region: location.state || 'Unknown',
        country: location.country || 'US',
        timezone: 'America/Los_Angeles', // Would need timezone API for accurate data
      };
    }
    
    throw new Error('No location data found');
  } catch (error) {
    console.error('Error fetching location data:', error);
    return {
      latitude: lat,
      longitude: lon,
      city: 'Unknown',
      region: 'Unknown', 
      country: 'US',
      timezone: 'America/Los_Angeles',
    };
  }
}

/**
 * Check if current day is a weeknight (Monday-Thursday)
 */
function isWeeknight(): boolean {
  const day = new Date().getDay();
  return day >= 1 && day <= 4; // Monday = 1, Thursday = 4
}

/**
 * Get complete weather context for meal recommendations
 */
export async function getWeatherContext(coords?: GeolocationCoords): Promise<WeatherContext> {
  let location: GeolocationCoords;
  
  if (coords) {
    location = coords;
  } else {
    location = await getCurrentLocation();
  }
  
  try {
    // Fetch all data in parallel for better performance
    const [weatherData, sunData, locationData, aqi] = await Promise.all([
      fetchWeatherData(location.latitude, location.longitude),
      fetchSunData(location.latitude, location.longitude),
      fetchLocationData(location.latitude, location.longitude),
      fetchAQIData(location.latitude, location.longitude),
    ]);
    
    // Update weather data with AQI
    weatherData.aqi = aqi;
    
    const now = new Date();
    const timeOfDay = getTimeOfDay(now, sunData.sunrise, sunData.sunset);
    
    return {
      weather: weatherData,
      sun: sunData,
      location: locationData,
      isWeeknight: isWeeknight(),
      timeOfDay,
    };
  } catch (error) {
    console.error('Error getting weather context:', error);
    throw new Error('Failed to get weather context');
  }
}

/**
 * Client-side wrapper for getting weather context
 */
export async function getClientWeatherContext(): Promise<WeatherContext | null> {
  try {
    const location = await getCurrentLocation();
    return await getWeatherContext(location);
  } catch (error) {
    console.error('Error getting client weather context:', error);
    return null;
  }
}