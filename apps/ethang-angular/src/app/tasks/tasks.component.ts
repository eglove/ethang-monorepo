import {Component, computed, input, signal} from '@angular/core';
import {TaskComponent} from './task/task.component.js';
import {dummyTasks} from './dummy-tasks.js';

@Component({
  selector: 'app-tasks',
  imports: [
    TaskComponent,
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
})
export class TasksComponent {
  name = input.required<string>();
  userId = input.required<string>();
  tasks = signal(dummyTasks);
  selectedUserTasks = computed(() => {
    return this.tasks().filter(task => {
      return task.userId === this.userId();
    })
  })

  onCompleteTask(id: string) {
    this.tasks.set(this.tasks().filter(task => {
      return task.id !== id;
    }));
  }
}
