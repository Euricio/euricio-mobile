import { useState, useEffect, useCallback } from 'react';
import { getTasks, updateTaskStatus, Task } from '../lib/api/tasks';

export function useTasks(statusFilter?: Task['status']) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await getTasks(statusFilter);
    if (err) {
      setError(err.message);
    } else {
      setTasks((data as Task[]) ?? []);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const completeTask = useCallback(async (id: string) => {
    const { error: err } = await updateTaskStatus(id, 'done');
    if (!err) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'done' as const } : t)));
    }
    return err;
  }, []);

  return { tasks, loading, error, refetch: fetchTasks, completeTask };
}
