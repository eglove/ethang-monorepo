import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import isNil from "lodash/isNil.js";
import { Check, LucideAngularModule, Trash2 } from "lucide-angular";
import ms from "ms";

import {
  MainLayoutComponent,
} from "../../layouts/main-layout/main-layout.component";
import { RoutineService } from "./routine.service";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MainLayoutComponent,
    ReactiveFormsModule,
    LucideAngularModule,
  ],
  selector: "app-todo",
  styles: "",
  templateUrl: "./routine.component.html",
})
export class RoutineComponent {
  public routineForm = new FormGroup({
    interval: new FormControl(""),
    recurs: new FormControl(0),
    text: new FormControl(""),
  });

  public readonly routineService = inject(RoutineService);

  protected readonly Check = Check;

  protected readonly ms = ms;

  protected readonly Trash2 = Trash2;

  public async handleSubmit() {
    const formValue = this.routineForm.value;

    if (
      isNil(formValue.interval) ||
      isNil(formValue.text) ||
      isNil(formValue.recurs)
    ) {
      return;
    }

    await this.routineService.addRoutineItem({
      interval: formValue.interval,
      recurs: formValue.recurs,
      text: formValue.text,
    });
    this.routineForm.reset();
  }
}
