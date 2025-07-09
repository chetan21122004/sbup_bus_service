'use server';

import { supabase } from './supabase';
import { routesData } from './routes-data';
import { stopsData } from './stops-data';

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
    
    // Insert stops for each route
    for (const routeName in stopsData) {
      const { data: route, error: routeError } = await supabase
        .from('routes')
        .select('id')
        .eq('name', routeName)
        .single();
      if (routeError) throw routeError;
      const stops = stopsData[routeName];
      for (const stop of stops) {
        await supabase.from('stops').insert({
          route_id: route.id,
          name: stop.name,
          sequence_number: stop.sequence_number,
          pickup_time: stop.pickup_time
        });
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