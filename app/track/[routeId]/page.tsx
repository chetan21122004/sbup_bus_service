"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Phone, User, MapPin, Users, Clock, Bus, Navigation } from "lucide-react"
import Link from "next/link"

const routeData = {
  "route-1": {
    name: "Katraj - Hinjawadi",
    color: "bg-blue-500",
    stops: ["Katraj Chowk", "Bharati Vidyapeeth", "Warje", "Kothrud", "Baner", "Hinjawadi"],
    driver: { name: "Rajesh Kumar", phone: "+91 98765 43210", vehicle: "MH 12 AB 1234" },
  },
  "route-2": {
    name: "Pune Station - Wakad",
    color: "bg-green-500",
    stops: ["Pune Station", "Shivajinagar", "Aundh", "Baner", "Balewadi", "Wakad"],
    driver: { name: "Suresh Patil", phone: "+91 98765 43211", vehicle: "MH 12 CD 5678" },
  },
  "route-3": {
    name: "Hadapsar - Pimpri",
    color: "bg-purple-500",
    stops: ["Hadapsar", "Kharadi", "Viman Nagar", "Yerawada", "Kalyani Nagar", "Pimpri"],
    driver: { name: "Amit Sharma", phone: "+91 98765 43212", vehicle: "MH 12 EF 9012" },
  },
  "route-4": {
    name: "Sinhgad Road - Chinchwad",
    color: "bg-orange-500",
    stops: ["Sinhgad Road", "Vadgaon", "Kothrud", "Paud Road", "Akurdi", "Chinchwad"],
    driver: { name: "Prakash Jadhav", phone: "+91 98765 43213", vehicle: "MH 12 GH 3456" },
  },
  "route-5": {
    name: "Camp - Ravet",
    color: "bg-red-500",
    stops: ["Camp Area", "MG Road", "Deccan", "Shivajinagar", "Aundh", "Ravet"],
    driver: { name: "Ganesh Desai", phone: "+91 98765 43214", vehicle: "MH 12 IJ 7890" },
  },
}

const shifts = {
  "shift-1": { name: "Shift I", startTime: "08:00 AM", departureTime: "12:45 PM" },
  "shift-2": { name: "Shift II", startTime: "10:00 AM", departureTime: "03:45 PM" },
  "shift-3": { name: "Shift III", startTime: "12:15 PM", departureTime: "05:30 PM" },
}

export default function TrackPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const routeId = params.routeId as string
  const shiftId = searchParams.get("shift") || "shift-1"

  const route = routeData[routeId as keyof typeof routeData]
  const shift = shifts[shiftId as keyof typeof shifts]

  const [currentStopIndex, setCurrentStopIndex] = useState(1)
  const [studentCounts, setStudentCounts] = useState<{ [key: string]: number }>({})
  const [selectedStop, setSelectedStop] = useState<string | null>(null)
  const [studentCount, setStudentCount] = useState("")
  const [isMoving, setIsMoving] = useState(true)

  // Simulate bus movement
  useEffect(() => {
    if (!isMoving) return

    const interval = setInterval(() => {
      setCurrentStopIndex((prev) => {
        if (prev >= route.stops.length - 1) {
          setIsMoving(false)
          return prev
        }
        return prev + 1
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [isMoving, route.stops.length])

  const handleStudentCountSubmit = () => {
    if (selectedStop && studentCount) {
      setStudentCounts((prev) => ({
        ...prev,
        [selectedStop]: Number.parseInt(studentCount),
      }))
      setSelectedStop(null)
      setStudentCount("")
    }
  }

  if (!route) {
    return <div>Route not found</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{route.name}</h1>
            <p className="text-gray-600">
              {shift.name} - {shift.startTime}
            </p>
          </div>
          <Badge className="ml-auto" variant={isMoving ? "default" : "secondary"}>
            {isMoving ? "En Route" : "Arrived"}
          </Badge>
        </div>

        {/* Driver Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Driver Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{route.driver.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{route.driver.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-gray-500" />
                <span>{route.driver.vehicle}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Tracking */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Live Bus Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Metro-style Progress */}
            <div className="relative">
              {/* Desktop View */}
              <div className="hidden md:flex items-center justify-between mb-8">
                {route.stops.map((stop, index) => (
                  <div key={index} className="flex flex-col items-center relative">
                    {/* Connection Line */}
                    {index < route.stops.length - 1 && (
                      <div
                        className={`absolute top-6 left-6 w-full h-1 ${
                          index < currentStopIndex ? route.color : "bg-gray-300"
                        }`}
                        style={{ width: "calc(100vw / 6)" }}
                      />
                    )}

                    {/* Stop Circle */}
                    <div
                      className={`relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center ${
                        index <= currentStopIndex
                          ? `${route.color} border-white text-white`
                          : "bg-white border-gray-300 text-gray-500"
                      }`}
                    >
                      {index === currentStopIndex && isMoving && (
                        <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-20" />
                      )}
                      <MapPin className="w-5 h-5" />
                    </div>

                    {/* Stop Name */}
                    <div className="mt-2 text-center max-w-20">
                      <div
                        className={`text-sm font-medium ${
                          index === currentStopIndex ? "text-blue-600" : "text-gray-600"
                        }`}
                      >
                        {stop}
                      </div>
                      {studentCounts[stop] && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {studentCounts[stop]} students
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {route.stops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-4">
                    {/* Stop Circle */}
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        index <= currentStopIndex
                          ? `${route.color} border-white text-white`
                          : "bg-white border-gray-300 text-gray-500"
                      }`}
                    >
                      {index === currentStopIndex && isMoving && (
                        <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-20" />
                      )}
                      <MapPin className="w-4 h-4" />
                    </div>

                    {/* Connection Line */}
                    {index < route.stops.length - 1 && (
                      <div
                        className={`absolute left-4 mt-8 w-0.5 h-8 ${
                          index < currentStopIndex ? route.color : "bg-gray-300"
                        }`}
                      />
                    )}

                    {/* Stop Info */}
                    <div className="flex-1">
                      <div className={`font-medium ${index === currentStopIndex ? "text-blue-600" : "text-gray-600"}`}>
                        {stop}
                      </div>
                      {studentCounts[stop] && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {studentCounts[stop]} students waiting
                        </Badge>
                      )}
                    </div>

                    {/* Report Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedStop(stop)}>
                          <Users className="w-4 h-4 mr-1" />
                          Report
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Report Students at {stop}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Number of students waiting:</label>
                            <Input
                              type="number"
                              placeholder="Enter count"
                              value={studentCount}
                              onChange={(e) => setStudentCount(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <Button onClick={handleStudentCountSubmit} className="w-full">
                            Submit Count
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Status */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Bus className="w-5 h-5" />
                <span className="font-medium">
                  {isMoving
                    ? `Bus is approaching ${route.stops[currentStopIndex]}`
                    : `Bus has arrived at ${route.stops[currentStopIndex]}`}
                </span>
              </div>
              <div className="text-sm text-blue-600 mt-1">
                Stop {currentStopIndex + 1} of {route.stops.length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Schedule Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Departure from Campus</div>
                <div className="font-medium">{shift.departureTime}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Estimated Arrival</div>
                <div className="font-medium">{isMoving ? "In Transit" : "Arrived"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
