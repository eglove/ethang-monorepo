import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  selector: "app-multi-step-form",
  styleUrl: "./multi-step-form.component.css",
  templateUrl: "./multi-step-form.component.html",
})
export class MultiStepFormComponent {}
