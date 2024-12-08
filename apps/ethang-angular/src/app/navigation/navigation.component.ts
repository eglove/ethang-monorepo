import { Component } from '@angular/core';
import {LucideAngularModule, Menu} from 'lucide-angular';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css',
  standalone: true,
  imports: [
    LucideAngularModule
  ]
})
export class NavigationComponent {
  readonly MenuIcon = Menu;
  public opened = false;
}
