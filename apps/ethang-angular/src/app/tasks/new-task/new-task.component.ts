import {Component, signal, output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NewTask} from '../task/task.model.js';

@Component({
  selector: 'app-new-task',
  imports: [
    FormsModule,
  ],
  templateUrl: './new-task.component.html',
  styleUrl: './new-task.component.css'
})
export class NewTaskComponent {
  isOpen = signal(false)

  enteredTitle = signal('');
  enteredSummary = signal('');
  enteredDate = signal('');
  add = output<NewTask>()

  openModal() {
    this.isOpen.set(true);
  }

  closeModal() {
    this.isOpen.set(false);
  }

  onSubmit() {
    this.add.emit({
      title: this.enteredTitle(),
      summary: this.enteredSummary(),
      dueDate: this.enteredDate(),
    })
    this.closeModal();
  }
}
