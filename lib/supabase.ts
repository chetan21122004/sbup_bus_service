import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxkpcqtqflahhfrsrvbw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4a3BjcXRxZmxhaGhmcnNydmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODc0MTMsImV4cCI6MjA2NzQ2MzQxM30.dOhKGo6lDp3VtmB8v3AK63f7fyLO6eKll16nhq4g93Q';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  users: {
    id: number;
    email: string;
    role: 'student' | 'driver';
    name: string;
    created_at: string;
  };
  routes: {
    id: number;
    name: string;
    shift_number: 1 | 2 | 3;
    start_time: string;
    departure_time: string;
    vehicle_number: string;
    driver_id: number;
    created_at: string;
  };
  stops: {
    id: number;
    route_id: number;
    name: string;
    sequence_number: number;
    created_at: string;
  };
  bus_locations: {
    id: number;
    route_id: number;
    latitude: number;
    longitude: number;
    updated_at: string;
  };
  student_counts: {
    id: number;
    stop_id: number;
    count: number;
    created_at: string;
  };
}; 