"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, Bus } from "lucide-react"
import Link from "next/link"

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

export default function HomePage() {
  const [selectedShift, setSelectedShift] = useState("shift-1")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bus className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">SBUP Bus Tracker</h1>
          </div>
          <p className="text-gray-600">Track your bus in real-time across all routes</p>
        </div>

        {/* Shift Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Select Your Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shifts.map((shift) => (
                <Button
                  key={shift.id}
                  variant={selectedShift === shift.id ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setSelectedShift(shift.id)}
                >
                  <div className="font-semibold">{shift.name}</div>
                  <div className="text-sm opacity-80">Start: {shift.startTime}</div>
                  <div className="text-sm opacity-80">Departure: {shift.departureTime}</div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Routes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => (
            <Card key={route.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${route.color}`} />
                  <CardTitle className="text-lg">{route.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Route Preview */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {route.stops.map((stop, index) => (
                    <div key={index} className="flex items-center gap-1 flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-gray-300" />
                      {index < route.stops.length - 1 && <div className="w-4 h-0.5 bg-gray-300" />}
                    </div>
                  ))}
                </div>

                {/* Stop Count */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{route.stops.length} stops</span>
                </div>

                {/* Status Badge */}
                <Badge variant="secondary" className="w-fit">
                  <Users className="w-3 h-3 mr-1" />
                  Live Tracking Available
                </Badge>

                {/* Track Button */}
                <Link href={`/track/${route.id}?shift=${selectedShift}`}>
                  <Button className="w-full">Track Bus</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Bus className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">5</div>
              <div className="text-sm text-gray-600">Active Routes</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-gray-600">Daily Shifts</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">28</div>
              <div className="text-sm text-gray-600">Total Stops</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold">Live</div>
              <div className="text-sm text-gray-600">Tracking</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
