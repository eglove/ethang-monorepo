import {
  Component,
  computed,
  signal
} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {UserComponent} from './user/user.component.js';
import {DUMMY_USERS} from './user/dummy-users.js';
import {NavigationComponent} from './navigation/navigation.component.js';
import {TasksComponent} from './tasks/tasks.component.js';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent, UserComponent, TasksComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  users = DUMMY_USERS;
  selectedUserId = signal<string | undefined>(undefined);
  selectedUser = computed(() => {
    return this.users.find(user => {
      return user.id === this.selectedUserId()
    });
  })

  onSelectUser(id: string) {
    this.selectedUserId.set(id);
  }
}
