
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    expect(result).toEqual([]);
  });

  it('should return all tasks', async () => {
    // Create test tasks
    await db.insert(tasksTable)
      .values([
        { title: 'First task', completed: false },
        { title: 'Second task', completed: true }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBeDefined();
    expect(result[0].completed).toBeDefined();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return tasks ordered by created_at descending', async () => {
    // Create tasks with slight delay to ensure different timestamps
    await db.insert(tasksTable)
      .values({ title: 'First task', completed: false })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({ title: 'Second task', completed: true })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Second task'); // Most recent first
    expect(result[1].title).toEqual('First task');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should include all task fields', async () => {
    await db.insert(tasksTable)
      .values({ title: 'Test task', completed: true })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    const task = result[0];
    expect(task.id).toBeDefined();
    expect(task.title).toEqual('Test task');
    expect(task.completed).toEqual(true);
    expect(task.created_at).toBeInstanceOf(Date);
  });
});
