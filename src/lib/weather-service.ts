import { WeatherForecast } from './types';
import { prisma } from './data';
import { kelvinToFahrenheit, metersPerSecondToMph } from './conversion-constants';
import { safeAverage } from './math-utils';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface OpenWeatherResponse {
  dt: number;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  pop: number; // Probability of precipitation
}

export interface OpenWeatherForecastResponse {
  list: OpenWeatherResponse[];
}

// kelvinToFahrenheit now imported from conversion-constants

/**
 * Get user's location using IP-based geolocation
 * Falls back to a default location if detection fails
 */
export async function getUserLocation(): Promise<{ lat: number; lon: number }> {
  try {
    // Use ipapi for IP-based geolocation
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) throw new Error('Failed to get location');
    
    const data = await response.json();
    return {
      lat: data.latitude || 40.7128, // Default to NYC
      lon: data.longitude || -74.0060
    };
  } catch (error) {
    console.error('Error getting location:', error);
    // Default to New York City
    return { lat: 40.7128, lon: -74.0060 };
  }
}

/**
 * Fetch weather forecast from OpenWeather API
 */
export async function fetchWeatherForecast(
  lat: number,
  lon: number,
  days: number = 7
): Promise<WeatherForecast[]> {
  if (!OPENWEATHER_API_KEY) {
    console.warn('OpenWeather API key not configured');
    return generateMockWeatherForecast(days);
  }

  try {
    // Use 5-day/3-hour forecast API (free tier)
    const url = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.statusText}`);
    }

    const data: OpenWeatherForecastResponse = await response.json();
    
    // Group forecasts by day and aggregate
    const forecastsByDay = new Map<string, OpenWeatherResponse[]>();
    
    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!forecastsByDay.has(dateKey)) {
        forecastsByDay.set(dateKey, []);
      }
      forecastsByDay.get(dateKey)!.push(item);
    });

    // Convert to WeatherForecast format
    const forecasts: WeatherForecast[] = [];
    
    forecastsByDay.forEach((dayForecasts, dateKey) => {
      const temps = dayForecasts.map(f => f.main.temp);
      const high = Math.max(...temps);
      const low = Math.min(...temps);
      const avgTemp = safeAverage(temps); // Safe average
      
      // Get most common weather condition using one-pass frequency map (O(n) instead of O(n²))
      const conditionCounts = new Map<string, number>();
      dayForecasts.forEach(f => {
        const cond = f.weather[0].main;
        conditionCounts.set(cond, (conditionCounts.get(cond) || 0) + 1);
      });
      const condition = Array.from(conditionCounts.entries())
        .reduce((max, curr) => curr[1] > max[1] ? curr : max, ['Clear', 0])[0];
      
      // Average precipitation probability (use API pop when available)
      const precipProbabilities = dayForecasts.map(f => f.pop || 0);
      const avgPrecip = safeAverage(precipProbabilities);
      
      // Calculate averages with 1 dp retention
      const avgHumidity = safeAverage(dayForecasts.map(f => f.main.humidity));
      const avgWindSpeedMps = safeAverage(dayForecasts.map(f => f.wind.speed));
      
      forecasts.push({
        date: new Date(dateKey),
        temperature: {
          high: kelvinToFahrenheit(high),
          low: kelvinToFahrenheit(low),
          current: kelvinToFahrenheit(avgTemp)
        },
        condition,
        description: dayForecasts[0].weather[0].description,
        precipitation: Math.round(avgPrecip * 100), // Convert to percentage
        humidity: Math.round(avgHumidity),
        windSpeed: metersPerSecondToMph(avgWindSpeedMps), // Precise conversion with 1dp
        icon: dayForecasts[0].weather[0].icon
      });
    });

    // Cache weather data in database
    await cacheWeatherData(forecasts, lat, lon);
    
    return forecasts.slice(0, days);
  } catch (error) {
    console.error('Error fetching weather:', error);
    return generateMockWeatherForecast(days);
  }
}

/**
 * Cache weather data in the database
 */
async function cacheWeatherData(
  forecasts: WeatherForecast[],
  lat: number,
  lon: number
): Promise<void> {
  try {
    for (const forecast of forecasts) {
      await prisma.weatherCache.upsert({
        where: {
          date: forecast.date
        },
        update: {
          latitude: lat,
          longitude: lon,
          temperature: forecast.temperature,
          condition: forecast.condition,
          description: forecast.description,
          precipitation: forecast.precipitation,
          humidity: forecast.humidity,
          windSpeed: forecast.windSpeed,
          icon: forecast.icon,
          fetchedAt: new Date()
        },
        create: {
          date: forecast.date,
          latitude: lat,
          longitude: lon,
          temperature: forecast.temperature,
          condition: forecast.condition,
          description: forecast.description,
          precipitation: forecast.precipitation,
          humidity: forecast.humidity,
          windSpeed: forecast.windSpeed,
          icon: forecast.icon
        }
      });
    }
  } catch (error) {
    console.error('Error caching weather data:', error);
  }
}

/**
 * Get cached weather data from database
 */
export async function getCachedWeatherForecast(
  startDate: Date,
  endDate: Date
): Promise<WeatherForecast[] | null> {
  try {
    const cached = await prisma.weatherCache.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        fetchedAt: {
          gte: new Date(Date.now() - 3600000) // Only use cache from last hour
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    if (cached.length === 0) return null;

    return cached.map(c => ({
      date: c.date,
      temperature: c.temperature as { high: number; low: number; current: number },
      condition: c.condition,
      description: c.description || undefined,
      precipitation: c.precipitation,
      humidity: c.humidity || undefined,
      windSpeed: c.windSpeed || undefined,
      icon: c.icon || undefined
    }));
  } catch (error) {
    console.error('Error getting cached weather:', error);
    return null;
  }
}

/**
 * Generate mock weather data for development/fallback
 */
function generateMockWeatherForecast(days: number): WeatherForecast[] {
  const forecasts: WeatherForecast[] = [];
  const conditions = ['Clear', 'Clouds', 'Rain', 'Sunny', 'Partly Cloudy'];
  const icons = ['01d', '02d', '03d', '09d', '10d'];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const baseTemp = 65 + Math.random() * 20;
    
    forecasts.push({
      date,
      temperature: {
        high: Math.round(baseTemp + 5 + Math.random() * 5),
        low: Math.round(baseTemp - 5 - Math.random() * 5),
        current: Math.round(baseTemp)
      },
      condition,
      description: condition.toLowerCase(),
      precipitation: Math.round(Math.random() * 50),
      humidity: Math.round(40 + Math.random() * 40),
      windSpeed: Math.round(5 + Math.random() * 15),
      icon: icons[Math.floor(Math.random() * icons.length)]
    });
  }
  
  return forecasts;
}
