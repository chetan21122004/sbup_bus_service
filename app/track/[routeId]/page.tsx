"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { BusTracker } from '@/components/ui/bus-tracker'
import type { Database } from '@/lib/supabase'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Route = Database['routes'];

export default function TrackPage() {
  const params = useParams()
  const routeId = Number(params.routeId)
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [route, setRoute] = useState<Route | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        // Fetch route details
        const { data: routeData, error: routeError } = await supabase
          .from('routes')
          .select('*')
          .eq('id', routeId)
          .single();

        if (routeError) {
          throw routeError;
        }

        if (routeData) {
          setRoute(routeData as Route);
        } else {
          setError('Route not found');
        }
      } catch (err) {
        console.error('Error fetching route:', err);
        setError('Failed to load route data');
      } finally {
        setLoading(false);
      }
    };

    if (routeId) {
      fetchRouteData();
    }
  }, [routeId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Loading...</h1>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-center items-center h-40">
                <p>Loading route information...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Error</h1>
            </div>
          </div>
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Route not found'}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt for unauthenticated users
  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{route.name}</h1>
              <p className="text-gray-500">
                Shift {route.shift_number} - {route.start_time}
              </p>
            </div>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold">Login Required</h2>
                <p>Please log in to track buses and access all features.</p>
                <div className="flex justify-center gap-4">
                  <Link href={`/login?redirect=/track/${routeId}`}>
                    <Button>Login</Button>
                  </Link>
                  <Link href={`/signup?redirect=/track/${routeId}`}>
                    <Button variant="outline">Sign Up</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Route Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Route:</span>
                  <span className="font-medium">{route.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shift:</span>
                  <span className="font-medium">{route.shift_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Start Time:</span>
                  <span className="font-medium">{route.start_time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Departure Time:</span>
                  <span className="font-medium">{route.departure_time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vehicle Number:</span>
                  <span className="font-medium">{route.vehicle_number}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{route.name}</h1>
            <p className="text-gray-500">
              Shift {route.shift_number} - {route.start_time}
            </p>
          </div>
        </div>

        {/* Bus Tracker */}
        <BusTracker routeId={routeId} />
      </div>
    </div>
  );
}
