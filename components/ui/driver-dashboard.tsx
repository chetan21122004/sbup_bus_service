'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Bus, MapPin, Navigation, CheckCircle, AlertCircle, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Database } from '@/lib/supabase';

type Route = Database['routes'];

type Stop = {
  id: number;
  name: string;
  sequence_number: number;
  route_id: number;
};

export function DriverDashboard() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [currentStop, setCurrentStop] = useState<Stop | null>(null);
  const [nextStop, setNextStop] = useState<Stop | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all routes and active route
  useEffect(() => {
    const fetchDriverData = async () => {
      if (!user || user.role !== 'driver') return;

      try {
        // Get all available routes
        const { data: allRoutes, error: routesError } = await supabase
          .from('routes')
          .select('*')
          .order('name');

        if (routesError) throw routesError;
        setRoutes(allRoutes || []);

        // Check if driver has an active route
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('active_route_id')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;

        if (userData?.active_route_id) {
          const { data: activeRouteData, error: activeRouteError } = await supabase
            .from('routes')
            .select('*')
            .eq('id', userData.active_route_id)
            .single();

          if (activeRouteError) throw activeRouteError;
          setActiveRoute(activeRouteData);
          setSelectedRoute(activeRouteData);

          // If route is active, fetch stops and current location
          if (activeRouteData.status === 'active') {
            setIsTracking(true);
            await fetchStops(activeRouteData.id);
            await fetchCurrentLocation(activeRouteData.id);
          }
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
        setError('Failed to load routes. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load driver data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDriverData();
  }, [user]);

  // Fetch stops for a route
  const fetchStops = async (routeId: number) => {
    try {
      const { data: stopsData, error: stopsError } = await supabase
        .from('stops')
        .select('*')
        .eq('route_id', routeId)
        .order('sequence_number');

      if (stopsError) throw stopsError;
      
      if (!stopsData || stopsData.length === 0) {
        toast({
          title: 'Warning',
          description: 'No stops found for this route. Please contact an administrator.',
          variant: 'destructive',
        });
        return;
      }
      
      setStops(stopsData);

      // Get current location to determine current/next stop
      const { data: locationData, error: locationError } = await supabase
        .from('bus_locations')
        .select('current_stop_id')
        .eq('route_id', routeId)
        .single();

      if (locationError && locationError.code !== 'PGRST116') throw locationError;

      if (locationData?.current_stop_id) {
        const currentStopIndex = stopsData.findIndex(stop => stop.id === locationData.current_stop_id);
        if (currentStopIndex !== -1) {
          setCurrentStop(stopsData[currentStopIndex]);
          if (currentStopIndex < stopsData.length - 1) {
            setNextStop(stopsData[currentStopIndex + 1]);
          }
        }
      } else if (stopsData && stopsData.length > 0) {
        // If no current stop, set first stop as current
        setCurrentStop(stopsData[0]);
        if (stopsData.length > 1) {
          setNextStop(stopsData[1]);
        }
      }
    } catch (error) {
      console.error('Error fetching stops:', error);
      toast({
        title: 'Error',
        description: 'Failed to load route stops',
        variant: 'destructive',
      });
    }
  };

  // Fetch current location
  const fetchCurrentLocation = async (routeId: number) => {
    try {
      const { data, error } = await supabase
        .from('bus_locations')
        .select('*')
        .eq('route_id', routeId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Update current/next stop based on location data
        if (data.current_stop_id && stops.length > 0) {
          const currentStopIndex = stops.findIndex(stop => stop.id === data.current_stop_id);
          if (currentStopIndex !== -1) {
            setCurrentStop(stops[currentStopIndex]);
            if (currentStopIndex < stops.length - 1) {
              setNextStop(stops[currentStopIndex + 1]);
            } else {
              setNextStop(null);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  // Start tracking
  const startTracking = async () => {
    if (!selectedRoute || !user) return;

    try {
      setLoading(true);
      setError(null);

      // Check if route is already active
      const { data: routeData, error: routeCheckError } = await supabase
        .from('routes')
        .select('status, driver_id')
        .eq('id', selectedRoute.id)
        .single();

      if (routeCheckError) throw routeCheckError;

      if (routeData.status === 'active') {
        if (routeData.driver_id && routeData.driver_id !== user.id) {
          setError('This route is already active with another driver');
          return;
        }
      }

      // First assign this route to the current driver and update driver info
      const { error: assignError } = await supabase
        .from('routes')
        .update({ 
          driver_id: user.id,
          driver_name: user.name,
          driver_mobile: user.driver_number
        })
        .eq('id', selectedRoute.id);

      if (assignError) throw assignError;

      // Update route status to active
      const { error: routeError } = await supabase
        .from('routes')
        .update({ status: 'active' })
        .eq('id', selectedRoute.id);

      if (routeError) throw routeError;

      // Update driver's active route
      const { error: userError } = await supabase
        .from('users')
        .update({ active_route_id: selectedRoute.id })
        .eq('id', user.id);

      if (userError) throw userError;

      // Get first stop
      await fetchStops(selectedRoute.id);

      // Initialize bus location
      if (stops.length > 0) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Create or update bus location
            const { error: locationError } = await supabase
              .from('bus_locations')
              .upsert({
                route_id: selectedRoute.id,
                latitude,
                longitude,
                current_stop_id: stops[0].id,
                last_updated: new Date().toISOString()
              });

            if (locationError) throw locationError;

            setActiveRoute(selectedRoute);
            setIsTracking(true);
            
            toast({
              title: 'Success',
              description: 'Bus tracking started successfully',
            });
            
            // Start location tracking
            startLocationUpdates();
          },
          (error) => {
            console.error('Geolocation error:', error);
            toast({
              title: 'Location Error',
              description: 'Could not access your location. Please enable location services.',
              variant: 'destructive',
            });
          }
        );
      }
    } catch (error) {
      console.error('Error starting tracking:', error);
      setError('Failed to start bus tracking. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to start bus tracking',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update location periodically
  const startLocationUpdates = () => {
    // Start periodic location updates
    const locationInterval = setInterval(() => {
      if (!isTracking || !selectedRoute) {
        clearInterval(locationInterval);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Update bus location
            await supabase
              .from('bus_locations')
              .upsert({
                route_id: selectedRoute.id,
                latitude,
                longitude,
                current_stop_id: currentStop?.id,
                last_updated: new Date().toISOString()
              });
          } catch (error) {
            console.error('Error updating location:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }, 10000); // Update every 10 seconds

    // Clean up on unmount
    return () => clearInterval(locationInterval);
  };

  // Move to next stop
  const moveToNextStop = async () => {
    if (!nextStop || !selectedRoute) return;

    try {
      setCurrentStop(nextStop);
      
      // Find the stop after next
      const nextStopIndex = stops.findIndex(stop => stop.id === nextStop.id);
      if (nextStopIndex < stops.length - 1) {
        setNextStop(stops[nextStopIndex + 1]);
      } else {
        setNextStop(null);
      }

      // Update current stop in database
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          await supabase
            .from('bus_locations')
            .upsert({
              route_id: selectedRoute.id,
              latitude,
              longitude,
              current_stop_id: nextStop.id,
              last_updated: new Date().toISOString()
            });

          toast({
            title: 'Arrived',
            description: `Bus arrived at ${nextStop.name}`,
          });
        }
      );
    } catch (error) {
      console.error('Error updating stop:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bus location',
        variant: 'destructive',
      });
    }
  };

  // End trip
  const endTrip = async () => {
    if (!selectedRoute) return;

    try {
      setLoading(true);

      // Update route status to completed
      const { error: routeError } = await supabase
        .from('routes')
        .update({ status: 'completed' })
        .eq('id', selectedRoute.id);

      if (routeError) throw routeError;

      // Clear driver's active route
      const { error: userError } = await supabase
        .from('users')
        .update({ active_route_id: null })
        .eq('id', user?.id);

      if (userError) throw userError;

      setActiveRoute(null);
      setIsTracking(false);
      setCurrentStop(null);
      setNextStop(null);

      toast({
        title: 'Trip Completed',
        description: 'The bus trip has been marked as completed',
      });
    } catch (error) {
      console.error('Error ending trip:', error);
      toast({
        title: 'Error',
        description: 'Failed to end trip',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'driver') {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Only drivers can access this dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <p>Loading driver dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            Driver Dashboard
          </CardTitle>
          <CardDescription>
            Select any route to start a trip and track your journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isTracking ? (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Active Trip</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Route:</span>
                    <span className="font-medium">{activeRoute?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vehicle:</span>
                    <span className="font-medium">{activeRoute?.vehicle_number || 'Not assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shift:</span>
                    <span className="font-medium">Shift {activeRoute?.shift_number} ({activeRoute?.shift_timing})</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Current Location</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">Current Stop:</span>
                    </div>
                    <Badge variant="outline">{currentStop?.name || 'Not set'}</Badge>
                  </div>
                  
                  {nextStop && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        <span className="font-medium">Next Stop:</span>
                      </div>
                      <Badge variant="outline">{nextStop.name}</Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {nextStop && (
                  <Button 
                    onClick={moveToNextStop} 
                    className="flex-1"
                    variant="outline"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Arrived at {nextStop.name}
                  </Button>
                )}
                <Button 
                  onClick={endTrip} 
                  className="flex-1"
                  variant={nextStop ? "outline" : "default"}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  End Trip
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Any Route</label>
                <Select
                  value={selectedRoute?.id.toString() || ''}
                  onValueChange={(value) => {
                    const route = routes.find(r => r.id.toString() === value);
                    setSelectedRoute(route || null);
                    setError(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id.toString()}>
                        {route.name} (Shift {route.shift_number} - {route.shift_timing})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRoute && (
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Route Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Route:</span>
                      <span className="font-medium">{selectedRoute.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vehicle:</span>
                      <span className="font-medium">{selectedRoute.vehicle_number || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shift:</span>
                      <span className="font-medium">Shift {selectedRoute.shift_number} ({selectedRoute.shift_timing})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Start Time:</span>
                      <span className="font-medium">{selectedRoute.start_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Departure Time:</span>
                      <span className="font-medium">{selectedRoute.departure_time}</span>
                    </div>
                    {selectedRoute.driver_name && (
                      <div className="flex justify-between">
                        <span>Driver:</span>
                        <span className="font-medium">{selectedRoute.driver_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={selectedRoute.status === 'active' ? 'default' : 'outline'}>
                        {selectedRoute.status === 'active' ? 'Active' : 
                         selectedRoute.status === 'completed' ? 'Completed' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={startTracking} 
                disabled={!selectedRoute || loading}
                className="w-full"
              >
                <Bus className="mr-2 h-4 w-4" />
                Start Trip
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 