import {dummyTasks} from './dummy-tasks.js';
import {NewTask} from './task/task.model.js';
import {Injectable, signal} from '@angular/core';

@Injectable({providedIn: 'root'})
export class TasksService {
  private tasks = signal(dummyTasks);

  constructor() {
    const localTasks = localStorage.getItem('tasks');

    if (localTasks) {
      this.tasks.set(JSON.parse(localTasks));
    }
  }

  getUserTasks(userId: string) {
    return this.tasks().filter(task => {
      return task.userId === userId;
    })
  }

  addTask(taskData: NewTask, userId: string) {
    this.tasks.set([
      ...this.tasks(),
      {
        ...taskData,
        id: this.tasks().length.toString(),
        userId,
      }
    ]);
    this.saveTasks();
  }

  removeTask(id: string) {
    this.tasks.set(this.tasks().filter(task => {
      return task.id !== id;
    }));
    this.saveTasks();
  }

  private saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks()));
  }
}
