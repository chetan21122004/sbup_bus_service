'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bus, User } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'driver'>('student');
  const [driverNumber, setDriverNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const { signup, user, loading } = useAuth();

  // Check if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push(redirectPath);
    }
  }, [user, loading, router, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (role === 'driver' && !driverNumber) {
        setError('Driver number is required');
        setIsLoading(false);
        return;
      }

      const { error: signupError } = await signup({ 
        email, 
        password, 
        name, 
        role,
        driver_number: role === 'driver' ? driverNumber : undefined 
      });

      if (signupError) {
        setError(signupError.message);
        setIsLoading(false);
        return;
      }

      // If signup successful, redirect to home page or specified redirect path
      router.push(redirectPath);
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // If still checking auth state, show loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is already logged in, don't render the signup form
  if (user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bus className="w-8 h-8 text-primary" />
            <CardTitle className="text-2xl font-bold">SBUP Bus Tracker</CardTitle>
          </div>
          <CardDescription className="text-center">
            Enter your details to sign up for SBUP Bus Tracker
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Role</Label>
              <RadioGroup
                defaultValue="student"
                value={role}
                onValueChange={(value) => setRole(value as 'student' | 'driver')}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="student"
                  className={`flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                    role === 'student' ? 'border-primary' : ''
                  }`}
                >
                  <RadioGroupItem value="student" id="student" className="sr-only" />
                  <User className="mb-2 h-6 w-6" />
                  <span>Student</span>
                </Label>
                <Label
                  htmlFor="driver"
                  className={`flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                    role === 'driver' ? 'border-primary' : ''
                  }`}
                >
                  <RadioGroupItem value="driver" id="driver" className="sr-only" />
                  <Bus className="mb-2 h-6 w-6" />
                  <span>Driver</span>
                </Label>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
            {role === 'driver' && (
              <div className="space-y-2">
                <Label htmlFor="driverNumber">Driver Number</Label>
                <Input
                  id="driverNumber"
                  placeholder="Enter your driver number"
                  value={driverNumber}
                  onChange={(e) => setDriverNumber(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            )}
            {error && (
              <div className="text-sm text-red-500 dark:text-red-400">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </Button>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 