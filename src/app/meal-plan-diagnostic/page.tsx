'use client';

import { useAuth } from '@/context/auth-context';
import { useMealPlan } from '@/hooks/use-meal-plan';
import { useWeather } from '@/hooks/use-weather';

export default function DiagnosticPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeMealPlan, mealPlans, isLoading: mealPlanLoading } = useMealPlan();
  
  // Safely convert dates
  const startDate = activeMealPlan?.startDate ? new Date(activeMealPlan.startDate) : undefined;
  const endDate = activeMealPlan?.endDate ? new Date(activeMealPlan.endDate) : undefined;
  
  const { weatherForecast, isLoading: weatherLoading } = useWeather(startDate, endDate);

  if (authLoading) {
    return <div className="p-8">Loading auth...</div>;
  }

  if (!user) {
    return <div className="p-8">Not authenticated</div>;
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Meal Plan Diagnostic</h1>
      
      <div className="space-y-4">
        <section className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Authentication</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify({ user: { id: user.id, email: user.email }, loading: authLoading }, null, 2)}
          </pre>
        </section>

        <section className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Meal Plans</h2>
          <p>Loading: {mealPlanLoading ? 'Yes' : 'No'}</p>
          <p>Total Plans: {mealPlans?.length || 0}</p>
          <p>Active Plan: {activeMealPlan ? 'Yes' : 'No'}</p>
          {activeMealPlan && (
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto mt-2">
              {JSON.stringify({
                id: activeMealPlan.id,
                name: activeMealPlan.name,
                startDate: activeMealPlan.startDate,
                startDateType: typeof activeMealPlan.startDate,
                endDate: activeMealPlan.endDate,
                endDateType: typeof activeMealPlan.endDate,
                mealsCount: activeMealPlan.meals?.length || 0
              }, null, 2)}
            </pre>
          )}
        </section>

        <section className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Date Conversion Test</h2>
          {activeMealPlan && (
            <div className="text-sm space-y-1">
              <p>Start Date String: {String(activeMealPlan.startDate)}</p>
              <p>Start Date Object: {startDate?.toISOString()}</p>
              <p>End Date String: {String(activeMealPlan.endDate)}</p>
              <p>End Date Object: {endDate?.toISOString()}</p>
            </div>
          )}
        </section>

        <section className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Weather Forecast</h2>
          <p>Loading: {weatherLoading ? 'Yes' : 'No'}</p>
          <p>Forecast Count: {weatherForecast?.length || 0}</p>
          {weatherForecast && weatherForecast.length > 0 && (
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto mt-2">
              {JSON.stringify(weatherForecast[0], null, 2)}
            </pre>
          )}
        </section>

        <section className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Error Test</h2>
          <p>If you see this, no error was thrown</p>
        </section>
      </div>
    </div>
  );
}
