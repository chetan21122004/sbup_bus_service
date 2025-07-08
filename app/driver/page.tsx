'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DriverDashboard } from '@/components/ui/driver-dashboard';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function DriverPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [driverRoutes, setDriverRoutes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated and is a driver
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/driver');
    } else if (!loading && user && user.role !== 'driver') {
      router.push('/');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading || (!user && !loading)) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[50vh]">
        <Card className="p-6">
          <CardContent className="text-center">
            <p>{loading ? 'Loading...' : 'Redirecting to login...'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is not a driver, this shouldn't be shown (will redirect in useEffect)
  if (user?.role !== 'driver') {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Driver Dashboard</h1>
          <p className="text-gray-500 mt-2">Manage your bus routes and track your trips</p>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user.name}</CardTitle>
            <CardDescription>Driver ID: {user.driver_number}</CardDescription>
          </CardHeader>
          <CardContent>
            <DriverDashboard />
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
} 