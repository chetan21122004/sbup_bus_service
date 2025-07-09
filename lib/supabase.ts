import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxkpcqtqflahhfrsrvbw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4a3BjcXRxZmxhaGhmcnNydmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODc0MTMsImV4cCI6MjA2NzQ2MzQxM30.dOhKGo6lDp3VtmB8v3AK63f7fyLO6eKll16nhq4g93Q';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  users: {
    id: number;
    email: string;
    password: string;
    role: 'student' | 'driver' | 'admin';
    name: string;
    driver_number?: string;
    created_at: string;
    active_route_id?: number | null;
  };
  routes: {
    id: number;
    name: string;
    shift_number: 1 | 2 | 3;
    shift_timing?: string;
    start_time: string;
    departure_time: string;
    vehicle_number: string;
    driver_id: number | null;
    driver_name?: string;
    driver_mobile?: string;
    created_at: string;
    status: 'inactive' | 'active' | 'completed';
  };
  stops: {
    id: number;
    route_id: number;
    name: string;
    sequence_number: number;
    pickup_time?: string;
    created_at: string;
  };
  bus_locations: {
    id: number;
    route_id: number;
    latitude: number;
    longitude: number;
    updated_at: string;
    current_stop_id?: number | null;
    last_updated?: string;
  };
  student_counts: {
    id: number;
    stop_id: number;
    count: number;
    created_at: string;
  };
}; 