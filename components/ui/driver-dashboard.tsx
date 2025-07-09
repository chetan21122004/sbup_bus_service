'use client';

import { useState, useEffect, useRef } from 'react';
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
import { getAllShifts } from '@/lib/seed-routes';

type Route = Database['routes'];

type Stop = {
  id: number;
  name: string;
  sequence_number: number;
  route_id: number;
  pickup_time?: string;
  latitude?: number;
  longitude?: number;
};

export function DriverDashboard() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<{ number: number; timing: string }[]>([]);
  const [selectedShift, setSelectedShift] = useState<number | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [currentStop, setCurrentStop] = useState<Stop | null>(null);
  const [nextStop, setNextStop] = useState<Stop | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{latitude: number, longitude: number} | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkStopProximityRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all shifts on mount
  useEffect(() => {
    const fetchShifts = async () => {
      const { success, data } = await getAllShifts();
      if (success) setShifts(data);
    };
    fetchShifts();
  }, []);

  // Fetch routes for selected shift
  useEffect(() => {
    if (selectedShift == null) {
      setRoutes([]);
      setSelectedRoute(null);
      return;
    }
    const fetchRoutes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('shift_number', selectedShift)
        .order('name');
      if (!error) setRoutes(data || []);
      setSelectedRoute(null);
      setLoading(false);
    };
    fetchRoutes();
  }, [selectedShift]);

  // Fetch all routes and active route
  useEffect(() => {
    const fetchDriverData = async () => {
      if (!user || user.role !== 'driver') return;

      try {
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
          setSelectedShift(activeRouteData.shift_number);

          // If route is active, fetch stops and current location
          if (activeRouteData.status === 'active') {
            setIsTracking(true);
            await fetchStops(activeRouteData.id);
            await fetchCurrentLocation(activeRouteData.id);
            startLocationUpdates();
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

    // Clean up intervals on unmount
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      if (checkStopProximityRef.current) {
        clearInterval(checkStopProximityRef.current);
      }
    };
  }, [user]);

  // Fetch stops when route is selected
  useEffect(() => {
    if (selectedRoute && !isTracking) {
      fetchStops(selectedRoute.id);
    }
  }, [selectedRoute]);

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
    if (!selectedRoute || !selectedShift || !user) {
      setError("Please select both shift and route before starting the trip");
      return;
    }

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
            setCurrentPosition({ latitude, longitude });
            
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

  // Calculate distance between two points in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  };

  // Check if driver is near a stop
  const checkStopProximity = () => {
    if (!currentPosition || !nextStop || !nextStop.latitude || !nextStop.longitude) return;
    
    const distance = calculateDistance(
      currentPosition.latitude, 
      currentPosition.longitude, 
      nextStop.latitude, 
      nextStop.longitude
    );
    
    // If within 100 meters of the next stop
    if (distance <= 0.1) {
      moveToNextStop();
    }
  };

  // Update location periodically
  const startLocationUpdates = () => {
    // Clear any existing intervals
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }
    if (checkStopProximityRef.current) {
      clearInterval(checkStopProximityRef.current);
    }

    // Start periodic location updates
    locationIntervalRef.current = setInterval(() => {
      if (!isTracking || !selectedRoute) {
        if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
        if (checkStopProximityRef.current) clearInterval(checkStopProximityRef.current);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentPosition({ latitude, longitude });
          
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
    }, 5000); // Update every 5 seconds

    // Check proximity to stops
    checkStopProximityRef.current = setInterval(checkStopProximity, 10000); // Check every 10 seconds
  };

  // Move to next stop
  const moveToNextStop = async () => {
    if (!nextStop || !selectedRoute) return;

    try {
      setCurrentStop(nextStop);
      
      // Find the stop after next
      const nextStopIndex = stops.findIndex(stop => stop.id === nextStop.id);
      
      // Check if this is the last stop (SBUP Campus)
      const isFinalStop = nextStop.name === "SBUP Campus" || nextStopIndex === stops.length - 1;
      
      if (nextStopIndex < stops.length - 1 && !isFinalStop) {
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
          
          // If this is the final stop (SBUP Campus), end the trip automatically
          if (isFinalStop) {
            await endTrip();
          }
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

      // Clear intervals
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      if (checkStopProximityRef.current) {
        clearInterval(checkStopProximityRef.current);
        checkStopProximityRef.current = null;
      }

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
    <div className="w-full max-w-full px-2 py-4 mx-auto space-y-4">
      <Card className="p-4 sm:p-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Bus className="h-5 w-5" />
            Driver Dashboard
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Select shift, then route to start a trip and track your journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isTracking && (
            <div className="bg-muted p-3 rounded-lg mb-2">
              <h3 className="text-sm font-medium mb-2">Start a New Trip:</h3>
              <ol className="list-decimal list-inside text-xs space-y-1 text-gray-600">
                <li>Select your shift</li>
                <li>Select your route</li>
                <li>Click "Start Trip" button</li>
              </ol>
            </div>
          )}

          {/* Shift selector */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">1. Select Shift</label>
            <Select
              value={selectedShift?.toString() || ''}
              onValueChange={(value) => {
                setSelectedShift(Number(value));
                setSelectedRoute(null); // Reset route selection when shift changes
                setError(null);
              }}
              disabled={isTracking} // Only disable when tracking is active
            >
              <SelectTrigger className="w-full h-12 text-base rounded-lg">
                <SelectValue placeholder="Select a shift" />
              </SelectTrigger>
              <SelectContent>
                {shifts.map((shift) => (
                  <SelectItem key={shift.number} value={shift.number.toString()} className="text-base">
                    Shift {shift.number} ({shift.timing})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Route selector */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">2. Select Route</label>
            <Select
              value={selectedRoute?.id.toString() || ''}
              onValueChange={(value) => {
                const route = routes.find(r => r.id.toString() === value);
                setSelectedRoute(route || null);
                setError(null);
              }}
              disabled={selectedShift == null || isTracking} // Only disable when no shift selected or tracking is active
            >
              <SelectTrigger className="w-full h-12 text-base rounded-lg">
                <SelectValue placeholder={selectedShift == null ? 'Select a shift first' : 'Select a route'} />
              </SelectTrigger>
              <SelectContent>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={route.id.toString()} className="text-base">
                    {route.name} (Shift {route.shift_number} - {route.shift_timing})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Trip button */}
          {!isTracking && (
            <Button
              className="w-full h-12 text-base rounded-lg bg-primary text-white mt-2"
              onClick={startTracking}
              disabled={loading || !selectedRoute || !selectedShift}
            >
              <Bus className="mr-2 h-5 w-5" /> 3. Start Trip
            </Button>
          )}

          {isTracking && activeRoute && (
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <h3 className="font-medium mb-1 text-base">Active Trip</h3>
              <div className="flex flex-col gap-1 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span>Route:</span>
                  <span className="font-medium">{activeRoute.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vehicle:</span>
                  <span className="font-medium">{activeRoute.vehicle_number || 'Not assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shift:</span>
                  <span className="font-medium">Shift {activeRoute.shift_number} ({activeRoute.shift_timing})</span>
                </div>
              </div>
            </div>
          )}

          {/* Train-like route visualization */}
          {selectedRoute && stops.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-base mb-3">Route Map</h4>
              <div className="relative py-4 px-2">
                {/* Horizontal line representing the route */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 transform -translate-y-1/2"></div>
                
                {/* Stops as circles on the line */}
                <div className="flex justify-between relative">
                  {stops.map((stop, idx) => (
                    <div key={stop.id} className="flex flex-col items-center">
                      <div 
                        className={`w-5 h-5 rounded-full flex items-center justify-center z-10 ${
                          currentStop?.id === stop.id 
                            ? 'bg-primary border-2 border-white' 
                            : idx < (stops.findIndex(s => s.id === currentStop?.id) || 0)
                            ? 'bg-green-500' 
                            : nextStop?.id === stop.id
                            ? 'bg-amber-500'
                            : 'bg-gray-300'
                        }`}
                      ></div>
                      
                      {/* Stop name below the circle */}
                      <div className={`text-[10px] sm:text-xs mt-1 max-w-[60px] text-center ${
                        currentStop?.id === stop.id ? 'font-bold' : ''
                      }`}>
                        {stop.name}
                      </div>
                      
                      {/* Bus icon at current position */}
                      {currentStop?.id === stop.id && (
                        <div className="absolute -top-6">
                          <Bus className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stops list */}
          {selectedRoute && stops.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="font-medium text-base">Stops</h4>
              <div className="overflow-x-auto min-w-[320px] space-y-1">
                {stops.map((stop, idx) => (
                  <div key={stop.id} className={`flex items-center justify-between py-2 px-3 border-b border-gray-100 last:border-0 ${currentStop?.id === stop.id ? 'bg-primary/10 dark:bg-primary/20 rounded-lg' : ''}`}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        currentStop?.id === stop.id 
                          ? 'bg-primary text-white' 
                          : nextStop?.id === stop.id
                          ? 'bg-amber-500 text-white'
                          : idx < (stops.findIndex(s => s.id === currentStop?.id) || 0)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm sm:text-base font-medium">{stop.name}</span>
                        {stop.pickup_time && (
                          <span className="text-xs text-gray-500">Pickup: {stop.pickup_time}</span>
                        )}
                      </div>
                    </div>
                    
                    {isTracking && currentStop?.id === stop.id && nextStop && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Current Stop
                      </Badge>
                    )}
                    
                    {isTracking && nextStop?.id === stop.id && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Next Stop
                      </Badge>
                    )}
                    
                    {isTracking && idx < (stops.findIndex(s => s.id === currentStop?.id) || 0) && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Completed
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current stop info */}
          {isTracking && currentStop && (
            <div className="mt-4 space-y-2">
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Current Stop:</p>
                    <p className="text-base">{currentStop.name}</p>
                  </div>
                  {nextStop && (
                    <div className="text-right">
                      <p className="text-sm font-medium">Next Stop:</p>
                      <p className="text-base">{nextStop.name}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Manual controls for testing */}
              <div className="flex justify-end">
                {nextStop && (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={moveToNextStop}
                    className="text-xs"
                  >
                    <MapPin className="h-3.5 w-3.5 mr-1" /> Mark Arrival (Manual)
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 