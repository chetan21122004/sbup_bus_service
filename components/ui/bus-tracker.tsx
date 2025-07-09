'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';
import { Card } from './card';
import { Progress } from './progress';
import { Badge } from './badge';
import { Bus, Clock, MapPin } from 'lucide-react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { StudentCount } from './student-count';

interface Stop {
  id: number;
  route_id: number;
  name: string;
  sequence_number: number;
  pickup_time?: string;
  created_at: string;
}

interface BusLocation {
  id: number;
  route_id: number;
  latitude: number;
  longitude: number;
  updated_at: string;
  current_stop_id?: number | null;
  last_updated?: string;
}

interface Route {
  id: number;
  name: string;
  shift_number: 1 | 2 | 3;
  start_time: string;
  departure_time: string;
  vehicle_number: string;
  driver_id: number | null;
  created_at: string;
  status?: 'inactive' | 'active' | 'completed';
}

interface BusTrackerProps {
  routeId: number;
}

export function BusTracker({ routeId }: BusTrackerProps) {
  const [stops, setStops] = useState<Stop[]>([]);
  const [currentLocation, setCurrentLocation] = useState<BusLocation | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<{ name: string; driver_number: string } | null>(null);
  const [currentStopId, setCurrentStopId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        // Fetch route details with driver info
        const { data: routeData, error: routeError } = await supabase
          .from('routes')
          .select(`
            *,
            driver:driver_id (
              name,
              driver_number
            )
          `)
          .eq('id', routeId)
          .single();

        if (routeError) throw routeError;
        
        if (routeData) {
          setRoute(routeData as Route);
          if (routeData.driver) {
            setDriver(routeData.driver as { name: string; driver_number: string });
          }
        }

        // Fetch stops for the route
        const { data: stopsData, error: stopsError } = await supabase
          .from('stops')
          .select('*')
          .eq('route_id', routeId)
          .order('sequence_number');

        if (stopsError) throw stopsError;
        if (stopsData) setStops(stopsData);

        // Fetch current bus location
        const { data: locationData, error: locationError } = await supabase
          .from('bus_locations')
          .select('*')
          .eq('route_id', routeId)
          .single();

        if (locationError && locationError.code !== 'PGRST116') throw locationError;
        
        if (locationData) {
          setCurrentLocation(locationData as BusLocation);
          setCurrentStopId(locationData.current_stop_id || null);
        }

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
              const newLocation = payload.new as BusLocation;
              setCurrentLocation(newLocation);
              setCurrentStopId(newLocation.current_stop_id || null);
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
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-40">
          <p>Loading bus tracker...</p>
        </div>
      </Card>
    );
  }

  // Calculate progress based on current stop
  const calculateProgress = () => {
    if (!currentStopId || stops.length === 0) return 0;
    
    const currentStopIndex = stops.findIndex(stop => stop.id === currentStopId);
    if (currentStopIndex === -1) return 0;
    
    return ((currentStopIndex + 1) / stops.length) * 100;
  };

  const getNextStop = () => {
    if (!currentStopId || stops.length === 0) return null;
    
    const currentStopIndex = stops.findIndex(stop => stop.id === currentStopId);
    if (currentStopIndex === -1 || currentStopIndex >= stops.length - 1) return null;
    
    return stops[currentStopIndex + 1];
  };

  const nextStop = getNextStop();
  const progress = calculateProgress();

  return (
    <div className="w-full max-w-full px-2 py-4 mx-auto space-y-4">
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="sticky top-0 z-10 bg-white dark:bg-card pb-2">
            <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              Route: {route?.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Shift {route?.shift_number} - Vehicle: {route?.vehicle_number}
            </p>
            {driver && (
              <div className="mt-1 text-xs sm:text-sm">
                <p>Driver: {driver.name}</p>
                <p>Contact: {driver.driver_number}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm text-gray-500">
              <span>{stops[0]?.name}</span>
              <span>{stops[stops.length - 1]?.name}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[320px] space-y-1">
              {stops.map((stop) => {
                const isCurrentStop = stop.id === currentStopId;
                const isPastStop = stops.findIndex(s => s.id === stop.id) < stops.findIndex(s => s.id === currentStopId);
                return (
                  <div
                    key={stop.id}
                    className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-0 ${isCurrentStop ? 'bg-primary/10 dark:bg-primary/20 rounded-lg' : ''}`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${
                        isCurrentStop
                          ? 'bg-primary animate-pulse'
                          : isPastStop
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                      }`} />
                      <span className={`text-sm sm:text-base ${isCurrentStop ? 'font-medium' : ''}`}>
                        {stop.name}
                      </span>
                      {stop.pickup_time && (
                        <span className="ml-2 text-xs text-gray-500">{stop.pickup_time}</span>
                      )}
                    </div>
                    <StudentCount stopId={stop.id} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 