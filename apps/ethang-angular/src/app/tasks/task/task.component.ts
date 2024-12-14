import {Component, inject, input} from '@angular/core';
import {Task} from './task.model.js';
import {DatePipe} from '@angular/common';
import {TasksService} from '../tasks.service.js';

@Component({
  selector: 'app-task',
  imports: [
    DatePipe
  ],
  templateUrl: './task.component.html',
  styleUrl: './task.component.css'
})
export class TaskComponent {
  private tasksService = inject(TasksService);
  task = input.required<Task>();

  onComplete() {
    this.tasksService.removeTask(this.task().id);
  }
}
