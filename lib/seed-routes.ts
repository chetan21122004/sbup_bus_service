'use server';

import { supabase } from './supabase';
import { routesData } from './routes-data';
import { stopsData, shiftTimings } from './stops-data';

export async function seedRoutes() {
  try {
    // Check if routes already exist
    const { data: existingRoutes, error: checkError } = await supabase
      .from('routes')
      .select('count');
    
    if (checkError) {
      throw checkError;
    }
    
    // If routes already exist, don't seed again
    if (existingRoutes && existingRoutes[0]?.count > 0) {
      console.log('Routes already seeded, skipping...');
      return { success: true, message: 'Routes already exist' };
    }
    
    // Insert routes data
    const { error: insertError } = await supabase
      .from('routes')
      .insert(routesData.map(route => ({
        name: route.name,
        shift_number: route.shift_number,
        shift_timing: route.shift_timing,
        start_time: route.start_time,
        departure_time: route.departure_time,
        vehicle_number: route.vehicle_number,
        driver_name: route.driver_name,
        driver_mobile: route.driver_mobile,
        status: route.status
      })));
    
    if (insertError) {
      throw insertError;
    }
    
    // Insert stops for each route and shift
    for (const routeName in stopsData) {
      // Get all routes with this name across different shifts
      const { data: routes, error: routesError } = await supabase
        .from('routes')
        .select('id, shift_number')
        .eq('name', routeName);
      
      if (routesError) throw routesError;
      
      if (routes && routes.length > 0) {
        // For each route (across different shifts)
        for (const route of routes) {
          const stops = stopsData[routeName];
          const shiftNumber = route.shift_number;
          
          // Insert stops with shift-specific timing adjustments if available
          for (const stop of stops) {
            let pickup_time = stop.pickup_time;
            
            // Apply shift-specific timing if available
            if (shiftNumber > 1 && shiftTimings[shiftNumber]) {
              if (shiftTimings[shiftNumber][stop.name]) {
                pickup_time = shiftTimings[shiftNumber][stop.name];
              } else if (shiftTimings[shiftNumber][routeName]) {
                // Adjust first stop time based on route start time
                if (stop.sequence_number === 1) {
                  pickup_time = shiftTimings[shiftNumber][routeName];
                }
              }
              
              // Adjust final stop time if specified
              if (stop.name === "SBUP Campus" && shiftTimings[shiftNumber]["SBUP Campus"]) {
                pickup_time = shiftTimings[shiftNumber]["SBUP Campus"];
              }
            }
            
            // Insert the stop with appropriate timing and coordinates
            await supabase.from('stops').insert({
              route_id: route.id,
              name: stop.name,
              sequence_number: stop.sequence_number,
              pickup_time: pickup_time,
              latitude: stop.latitude,
              longitude: stop.longitude
            });
          }
        }
      }
    }
    
    return { success: true, message: 'Routes seeded successfully' };
  } catch (error) {
    console.error('Error seeding routes:', error);
    return { success: false, message: 'Failed to seed routes', error };
  }
}

export async function getRoutesByShift(shiftNumber: number) {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('shift_number', shiftNumber)
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error(`Error getting routes for shift ${shiftNumber}:`, error);
    return { success: false, data: [], error };
  }
}

export async function getAllShifts() {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('shift_number, shift_timing')
      .order('shift_number')
      .limit(1000);
    
    if (error) {
      throw error;
    }
    
    // Get unique shifts
    const uniqueShifts = Array.from(
      new Set(data.map(item => item.shift_number))
    ).map(shiftNumber => {
      const shiftItem = data.find(item => item.shift_number === shiftNumber);
      return {
        number: shiftNumber,
        timing: shiftItem?.shift_timing
      };
    });
    
    return { success: true, data: uniqueShifts };
  } catch (error) {
    console.error('Error getting all shifts:', error);
    return { success: false, data: [], error };
  }
} 