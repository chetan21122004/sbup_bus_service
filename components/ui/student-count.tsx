import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import type { Database } from '@/lib/supabase';

type Stop = Database['stops'];

interface StudentCountProps {
  stop: Stop;
}

export function StudentCount({ stop }: StudentCountProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('student_counts')
        .insert({
          stop_id: stop.id,
          count: count,
        });

      if (error) throw error;
      setCount(0);
    } catch (err) {
      console.error('Error updating student count:', err);
      setError('Failed to update student count');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Update Student Count</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="count">Number of Students at {stop.name}</Label>
            <Input
              id="count"
              type="number"
              min="0"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 0)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Count'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 