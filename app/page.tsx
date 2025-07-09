"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Users, Bus, AlertCircle } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DriverDashboard } from "@/components/ui/driver-dashboard"
import { Toaster } from "@/components/ui/toaster"
import { seedRoutes } from "@/lib/seed-routes"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { Database } from '@/lib/supabase'

type Route = Database['routes']

export default function HomePage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentShift, setCurrentShift] = useState<number | null>(null);
  const [shifts, setShifts] = useState<{number: number, timing: string}[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Seed routes and fetch data
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // First try to seed routes
        await seedRoutes();
        
        // Then fetch all shifts
        const { data: shiftsData, error: shiftsError } = await supabase
          .from('routes')
          .select('shift_number, shift_timing')
          .order('shift_number');
        
        if (shiftsError) throw shiftsError;
        
        // Get unique shifts
        const uniqueShifts = Array.from(
          new Set(shiftsData.map(item => item.shift_number))
        ).map(shiftNumber => {
          const shiftItem = shiftsData.find(item => item.shift_number === shiftNumber);
          return {
            number: shiftNumber,
            timing: shiftItem?.shift_timing || ''
          };
        });
        
        setShifts(uniqueShifts);
        
        // Default to the first shift
        if (uniqueShifts.length > 0) {
          setCurrentShift(uniqueShifts[0].number);
          
          // Fetch routes for the first shift
          const { data: routesData, error: routesError } = await supabase
            .from('routes')
            .select('*')
            .eq('shift_number', uniqueShifts[0].number)
            .order('name');
          
          if (routesError) throw routesError;
          setRoutes(routesData || []);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to load routes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Function to change the current shift
  const handleShiftChange = async (shiftNumber: number) => {
    try {
      setLoading(true);
      setCurrentShift(shiftNumber);
      
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('shift_number', shiftNumber)
        .order('name');
      
      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes for shift:', error);
      setError('Failed to load routes for this shift.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[50vh]">
        <p>Loading...</p>
      </div>
    );
  }

  // Show driver dashboard for drivers
  if (user?.role === 'driver') {
    return (
      <div className="container mx-auto p-4">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">SBUP Bus Tracker</h1>
            <p className="text-gray-500 mt-2">Driver Dashboard</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">Go to the driver dashboard to manage your routes:</p>
              <Link href="/driver">
                <Button className="w-full">
                  <Bus className="mr-2 h-4 w-4" />
                  Driver Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Toaster />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full px-2 py-4 mx-auto sm:px-4">
      <div className="space-y-4">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">SBUP Bus Tracker</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-base sm:text-lg">Select your route to start tracking</p>
          {user && (
            <div className="mt-1 sm:mt-2">
              <p className="text-xs sm:text-sm">Welcome, {user.name} ({user.role})</p>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!user && (
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center space-y-2 sm:space-y-4">
                <p className="text-sm sm:text-base">Please log in to track buses and access all features.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                  <Link href="/login">
                    <Button className="w-full sm:w-auto h-12 text-base">Login</Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="outline" className="w-full sm:w-auto h-12 text-base">Sign Up</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shift selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-4 sm:mb-6">
          {shifts.map((shift) => (
            <Button
              key={shift.number}
              variant={currentShift === shift.number ? "default" : "outline"}
              className="h-10 px-4 text-sm sm:text-base rounded-full shadow-sm"
              onClick={() => handleShiftChange(shift.number)}
            >
              Shift {shift.number} ({shift.timing})
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {routes.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No routes available for this shift.</p>
            </div>
          ) : (
            routes.map((route: Route) => (
              <Card key={route.id} className="rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow bg-white dark:bg-card">
                <CardContent className="p-4 sm:p-6 flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <Bus className="h-5 w-5 text-primary" />
                      {route.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-4 w-4" /> Start: {route.start_time}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-4 w-4" /> Departure: {route.departure_time}
                    </div>
                    {route.driver_name && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Driver:</span>
                        <span className="font-medium">{route.driver_name}</span>
                      </div>
                    )}
                  </div>
                  <Link href={`/track/${route.id}`} className="mt-2">
                    <Button className="w-full h-11 text-base rounded-lg" disabled={route.status === 'completed'}>
                      {route.status === 'active' ? 'Track Now' : 
                        route.status === 'completed' ? 'Trip Completed' : 'View Route'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <Toaster />
    </div>
  )
}
