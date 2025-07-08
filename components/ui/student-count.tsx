'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from './button';
import { Users } from 'lucide-react';
import { Badge } from './badge';
import { toast } from './use-toast';
import type { Database } from '@/lib/supabase';

interface StudentCountProps {
  stopId: number;
}

export function StudentCount({ stopId }: StudentCountProps) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  // Fetch current count when component mounts
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data, error } = await supabase
          .from('student_counts')
          .select('count')
          .eq('stop_id', stopId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching student count:', error);
        } else if (data) {
          setCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching student count:', error);
      }
    };

    fetchCount();
  }, [stopId]);

  // Update student count
  const updateCount = async (newCount: number) => {
    if (newCount < 0) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('student_counts')
        .insert({
          stop_id: stopId,
          count: newCount,
        });

      if (error) throw error;
      
      setCount(newCount);
      setShowInput(false);
      toast({
        title: 'Count Updated',
        description: `Student count at this stop updated to ${newCount}`,
      });
    } catch (error) {
      console.error('Error updating student count:', error);
      toast({
        title: 'Error',
        description: 'Failed to update student count',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (showInput) {
    return (
      <div className="flex items-center space-x-1">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-6 w-6"
          disabled={loading}
          onClick={() => updateCount(Math.max(0, (count || 0) - 1))}
        >
          -
        </Button>
        <Badge variant="outline" className="px-2 py-0">
          {count || 0}
        </Badge>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-6 w-6"
          disabled={loading}
          onClick={() => updateCount((count || 0) + 1)}
        >
          +
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-gray-400"
          disabled={loading}
          onClick={() => setShowInput(false)}
        >
          ✓
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-2 text-xs"
      onClick={() => setShowInput(true)}
    >
      <Users className="h-3 w-3 mr-1" />
      {count !== null ? count : '0'}
    </Button>
  );
} 