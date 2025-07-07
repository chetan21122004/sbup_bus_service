import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';
import { Card } from './card';
import { Progress } from './progress';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface Stop {
  id: number;
  route_id: number;
  name: string;
  sequence_number: number;
  created_at: string;
  latitude: number;
  longitude: number;
}

type BusLocation = Database['bus_locations'];
type Route = Database['routes'];

interface BusTrackerProps {
  routeId: number;
}

export function BusTracker({ routeId }: BusTrackerProps) {
  const [stops, setStops] = useState<Stop[]>([]);
  const [currentLocation, setCurrentLocation] = useState<BusLocation | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        // Fetch route details
        const { data: routeData } = await supabase
          .from('routes')
          .select('*')
          .eq('id', routeId)
          .single();

        if (routeData) setRoute(routeData);

        // Fetch stops for the route
        const { data: stopsData } = await supabase
          .from('stops')
          .select('*')
          .eq('route_id', routeId)
          .order('sequence_number');

        if (stopsData) setStops(stopsData as Stop[]);

        // Subscribe to real-time bus location updates
        const subscription = supabase
          .channel('bus_locations')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'bus_locations',
              filter: `route_id=eq.${routeId}`,
            },
            (payload: RealtimePostgresChangesPayload<BusLocation>) => {
              setCurrentLocation(payload.new as BusLocation);
            }
          )
          .subscribe();

        setLoading(false);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error fetching route data:', error);
        setLoading(false);
      }
    };

    fetchRouteData();
  }, [routeId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const calculateProgress = () => {
    if (!currentLocation || stops.length === 0) return 0;
    
    // Find the last passed stop based on GPS coordinates
    // This is a simplified calculation - you might want to use a more sophisticated
    // algorithm based on your specific needs
    const passedStops = stops.filter((stop, index) => {
      if (index === 0) return true;
      const prevStop = stops[index - 1];
      return (
        currentLocation.latitude >= Math.min(prevStop.latitude, stop.latitude) &&
        currentLocation.latitude <= Math.max(prevStop.latitude, stop.latitude) &&
        currentLocation.longitude >= Math.min(prevStop.longitude, stop.longitude) &&
        currentLocation.longitude <= Math.max(prevStop.longitude, stop.longitude)
      );
    });

    return (passedStops.length / stops.length) * 100;
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">
            Route: {route?.name}
          </h3>
          <p className="text-sm text-gray-500">
            Shift {route?.shift_number} - Vehicle: {route?.vehicle_number}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{stops[0]?.name}</span>
            <span>{stops[stops.length - 1]?.name}</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Stops:</h4>
          <div className="space-y-1">
            {stops.map((stop) => (
              <div
                key={stop.id}
                className="flex items-center space-x-2"
              >
                <div className={`w-2 h-2 rounded-full ${
                  calculateProgress() >= (stop.sequence_number / stops.length) * 100
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`} />
                <span className="text-sm">{stop.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
} 