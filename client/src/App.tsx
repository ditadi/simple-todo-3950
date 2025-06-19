
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Task, CreateTaskInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsLoading(true);
    try {
      const taskInput: CreateTaskInput = { title: newTaskTitle.trim() };
      const newTask = await trpc.createTask.mutate(taskInput);
      setTasks((prev: Task[]) => [...prev, newTask]);
      setNewTaskTitle('');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (taskId: number, currentCompleted: boolean) => {
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id: taskId,
        completed: !currentCompleted
      });
      setTasks((prev: Task[]) =>
        prev.map((task: Task) =>
          task.id === taskId ? updatedTask : task
        )
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Todo List</h1>

      <form onSubmit={handleAddTask} className="mb-6">
        <div className="flex gap-2">
          <Input
            value={newTaskTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewTaskTitle(e.target.value)
            }
            placeholder="Add a new task..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !newTaskTitle.trim()}>
            {isLoading ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No tasks yet. Add one above!</p>
        ) : (
          tasks.map((task: Task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 border rounded-md hover:bg-gray-50 transition-colors"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => handleToggleTask(task.id, task.completed)}
                className="flex-shrink-0"
              />
              <span
                className={`flex-1 ${
                  task.completed
                    ? 'line-through text-gray-500'
                    : 'text-gray-800'
                }`}
              >
                {task.title}
              </span>
            </div>
          ))
        )}
      </div>

      {tasks.length > 0 && (
        <div className="mt-4 pt-4 border-t text-sm text-gray-500 text-center">
          {tasks.filter((task: Task) => !task.completed).length} of {tasks.length} tasks remaining
        </div>
      )}
    </div>
  );
}

export default App;
