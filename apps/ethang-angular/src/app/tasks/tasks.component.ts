import {Component, inject, input} from '@angular/core';
import {TaskComponent} from './task/task.component.js';
import {NewTaskComponent} from './new-task/new-task.component.js';
import {TasksService} from './tasks.service.js';

@Component({
  selector: 'app-tasks',
  imports: [
    TaskComponent,
    NewTaskComponent,
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
})
export class TasksComponent {
  private tasksService = inject(TasksService);

  name = input.required<string>();
  userId = input.required<string>();

  get selectedUserTasks() {
    return this.tasksService.getUserTasks(this.userId());
  }
}
