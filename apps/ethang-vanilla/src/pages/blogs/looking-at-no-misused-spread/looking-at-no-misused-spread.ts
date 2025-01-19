import { codeBlockTemplate } from "../../../common/code-block.js";
import { codeHighlight } from "../../../util/code-highlight.js";

const promiseExample = codeHighlight(`
const simplePromise = async () => {
  return {value: 1};
};

const object = {
  name: "badPromise",
  ...simplePromise,
};

// { name: "badPromise" }

const object = {
  name: "goodPromise",
  ...(await simplePromise()),
};

// { name: "goodPromise", value: 1 }`);

const functionExample = codeHighlight(`
const withoutProperties = () => {
  return "hello";
};

const withProperties = () => {
  return "hello";
};

withProperties.count = 1;

const object = {
  ...withProperties, // No Error
  ...withoutProperties, // Error!
};

// { count: 1 }`);

const iterableExample = codeHighlight(`
const list = [1, 2, 3];
const map = new Map([["a", 1], ["b", 2], ["c", 3]]);
const set = new Set([1, 2, 3]);

const object = {
  list, // No Error
  list2: [...list], // No Error
  map: [...map], // No Error
  set: [...set], // No Error
  ...list, // Error!
};`);

const stringExample = codeHighlight(`
const message = "Hello";

const object = {
  message, // No Error
  message2: split(message, ""), // No Error (Explicit intention)
  message2: [...message], // Error!
};
`);

const classExample = codeHighlight(`
class MyClass {
  public static readonly hello = "hello";
  public readonly world = "world";
  
  public static getHello() {
    return MyClass.hello;
  }
  
  public getWorld() {
    return this.world;
  }
}

const object = {
  ...MyClass, // Error!
};

// { hello: "hello"}`);

const instanceExample = codeHighlight(`
const object = {
  ...(new MyClass()), // Error!
};`);

export const noMisusedSpreadCodeExamples = {
  classExample: codeBlockTemplate({
    code: classExample,
  }),
  functionExample: codeBlockTemplate({
    code: functionExample,
  }),
  instanceExample: codeBlockTemplate({
    code: instanceExample,
  }),
  iterableExample: codeBlockTemplate({
    code: iterableExample,
  }),
  promiseExample: codeBlockTemplate({
    code: promiseExample,
  }),
  stringExample: codeBlockTemplate({
    code: stringExample,
  }),
};
