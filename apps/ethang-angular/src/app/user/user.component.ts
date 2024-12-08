import {
  Component,
  input,
  output,
} from '@angular/core';
import {LucideAngularModule, User as UserIcon} from 'lucide-angular';
import {User} from './user.model.js'

@Component({
  selector: 'app-user',
  imports: [
    LucideAngularModule,
  ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent {
  readonly UserIcon = UserIcon;
  user = input.required<User>();
  selected = input.required<boolean>();
  select = output<string>();

  onSelectUser() {
    this.select.emit(this.user().id);
  }
}
