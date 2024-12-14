import {Component, signal, output, inject, input} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TasksService} from '../tasks.service.js';

@Component({
  selector: 'app-new-task',
  imports: [
    FormsModule,
  ],
  templateUrl: './new-task.component.html',
  styleUrl: './new-task.component.css'
})
export class NewTaskComponent {
  private taskService = inject(TasksService);

  userId = input.required<string>();

  isOpen = signal(false)
  enteredTitle = signal('');
  enteredSummary = signal('');
  enteredDate = signal('');

  openModal() {
    this.isOpen.set(true);
  }

  closeModal() {
    this.isOpen.set(false);
  }

  onSubmit() {
    this.taskService.addTask({
      title: this.enteredTitle(),
      summary: this.enteredSummary(),
      dueDate: this.enteredDate(),
    }, this.userId())
    this.closeModal();
  }
}
