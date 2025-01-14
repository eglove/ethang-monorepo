import { ChangeDetectionStrategy, Component } from "@angular/core";

import { CodeBlockComponent } from "../../common/code-block/code-block.component";
import { BlogLayoutComponent } from "../../layouts/blog-layout/blog-layout.component";

const objectStart = "const object = {";
const objectEnd = "};";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BlogLayoutComponent, CodeBlockComponent],
  selector: "app-looking-at-no-misused-spread",
  styles: "",
  templateUrl: "./looking-at-no-misused-spread.component.html",
})
export class LookingAtNoMisusedSpreadComponent {
  public classExample = [
    "class MyClass {",
    "  public static readonly hello = \"hello\";",
    "  public readonly world = \"world\";",
    "",
    "  public static getHello() {",
    "    return MyClass.hello;",
    "  }",
    "",
    "  public getWorld() {",
    "    return this.world;",
    "  }",
    "}",
    "",
    objectStart,
    "  ...MyClass, // Error!",
    objectEnd,
    "",
    "// { hello: \"hello\"}",
  ];

  public functionExample = [
    "const withoutProperties = () => {",
    "  return \"hello\";",
    objectEnd,
    "",
    "const withProperties = () => {",
    "  return \"hello\";",
    objectEnd,
    "withProperties.count = 1;",
    "",
    objectStart,
    "  ...withProperties, // No Error",
    "  ...withoutProperties, // Error!",
    objectEnd,
    "",
    "// { count: 1 }",
  ];

  public instanceExample = [
    objectStart,
    "  ...(new MyClass()), // Error!",
    objectEnd,
  ];

  public iterableExample = [
    "const list = [1, 2, 3];",
    "const map = new Map([[\"a\", 1], [\"b\", 2], [\"c\", 3]]);",
    "const set = new Set([1, 2, 3]);",
    "",
    objectStart,
    "  list, // No Error",
    "  list2: [...list], // No Error",
    "  map: [...map], // No Error",
    "  set: [...set], // No Error",
    "  ...list, // Error!",
    objectEnd,
  ];

  public promiseExample = [
    "const simplePromise = async () => {",
    "  return {value: 1};",
    objectEnd,
    "",
    objectStart,
    "  name: \"badPromise\",",
    "  ...simplePromise,",
    objectEnd,
    "",
    "// { name: \"badPromise\" }",
    "",
    objectStart,
    "  name: \"goodPromise\",",
    "  ...(await simplePromise()),",
    objectEnd,
    "",
    "// { name: \"goodPromise\", value: 1 }",
  ];

  public stringExample = [
    "const message = \"Hello\";",
    "",
    objectStart,
    "  message, // No Error",
    "  message2: split(message, \"\"), // No Error (Explicit intention)",
    "  message2: [...message], // Error!",
    objectEnd,
  ];
}
