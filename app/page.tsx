"use client"

import { useState, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, Bus } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import type { Database } from '@/lib/supabase'

const routes = [
  {
    id: "route-1",
    name: "Katraj - Hinjawadi",
    color: "bg-blue-500",
    stops: ["Katraj Chowk", "Bharati Vidyapeeth", "Warje", "Kothrud", "Baner", "Hinjawadi"],
  },
  {
    id: "route-2",
    name: "Pune Station - Wakad",
    color: "bg-green-500",
    stops: ["Pune Station", "Shivajinagar", "Aundh", "Baner", "Balewadi", "Wakad"],
  },
  {
    id: "route-3",
    name: "Hadapsar - Pimpri",
    color: "bg-purple-500",
    stops: ["Hadapsar", "Kharadi", "Viman Nagar", "Yerawada", "Kalyani Nagar", "Pimpri"],
  },
  {
    id: "route-4",
    name: "Sinhgad Road - Chinchwad",
    color: "bg-orange-500",
    stops: ["Sinhgad Road", "Vadgaon", "Kothrud", "Paud Road", "Akurdi", "Chinchwad"],
  },
  {
    id: "route-5",
    name: "Camp - Ravet",
    color: "bg-red-500",
    stops: ["Camp Area", "MG Road", "Deccan", "Shivajinagar", "Aundh", "Ravet"],
  },
]

const shifts = [
  { id: "shift-1", name: "Shift I", startTime: "08:00 AM", departureTime: "12:45 PM" },
  { id: "shift-2", name: "Shift II", startTime: "10:00 AM", departureTime: "03:45 PM" },
  { id: "shift-3", name: "Shift III", startTime: "12:15 PM", departureTime: "05:30 PM" },
]

type Route = Database['routes']

async function getRoutes() {
  const { data: routes } = await supabase
    .from('routes')
    .select('*')
    .order('shift_number');
  
  return routes || [];
}

export default async function HomePage() {
  const routes = await getRoutes();

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">SBUP Bus Tracker</h1>
          <p className="text-gray-500 mt-2">Select your route to start tracking</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route: Route) => (
            <Card key={route.id}>
              <CardHeader>
                <CardTitle>Route {route.name}</CardTitle>
                <CardDescription>
                  Shift {route.shift_number} - {route.vehicle_number}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Start Time:</span>
                      <span>{route.start_time}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Departure:</span>
                      <span>{route.departure_time}</span>
                    </div>
                  </div>
                  <Link href={`/track/${route.id}`}>
                    <Button className="w-full">Track Bus</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
