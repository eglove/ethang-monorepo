import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  selector: "app-code-block",
  styles: "",
  templateUrl: "./code-block.component.html",
})
export class CodeBlockComponent {
  public readonly code = input.required<
    (
      | {
        class?: string;
        value: string;
      }
      | string
    )[]
  >();

  protected readonly Object = Object;
}
