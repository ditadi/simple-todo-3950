
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper function to create a test task
const createTestTask = async (title: string = 'Test Task') => {
  const result = await db.insert(tasksTable)
    .values({
      title,
      completed: false
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task completion status to true', async () => {
    // Create a test task
    const testTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      completed: true
    };

    const result = await updateTask(updateInput);

    // Verify the returned task
    expect(result.id).toEqual(testTask.id);
    expect(result.title).toEqual(testTask.title);
    expect(result.completed).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update task completion status to false', async () => {
    // Create a completed test task
    const testTask = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        completed: true
      })
      .returning()
      .execute();

    const updateInput: UpdateTaskInput = {
      id: testTask[0].id,
      completed: false
    };

    const result = await updateTask(updateInput);

    // Verify the returned task
    expect(result.id).toEqual(testTask[0].id);
    expect(result.title).toEqual('Completed Task');
    expect(result.completed).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated task to database', async () => {
    // Create a test task
    const testTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      completed: true
    };

    await updateTask(updateInput);

    // Query the database to verify the update
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toEqual(testTask.id);
    expect(tasks[0].completed).toEqual(true);
    expect(tasks[0].title).toEqual(testTask.title);
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999999, // Non-existent ID
      completed: true
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/task with id 999999 not found/i);
  });
});
