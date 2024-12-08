import {Component, input, output} from '@angular/core';
import {Task} from './task.model.js';

@Component({
  selector: 'app-task',
  imports: [
  ],
  templateUrl: './task.component.html',
  styleUrl: './task.component.css'
})
export class TaskComponent {
  task = input.required<Task>();
  complete = output<string>();

  onComplete() {
    this.complete.emit(this.task().id);
  }
}
