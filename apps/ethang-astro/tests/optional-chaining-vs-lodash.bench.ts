/* eslint-disable @typescript-eslint/no-unnecessary-condition,sonar/no-duplicate-string,@typescript-eslint/no-unused-expressions */
import find from "lodash/find.js";
import get from "lodash/get.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import split from "lodash/split.js";
import { bench, describe } from "vitest";

// Define types for our objects
type ArrayItem = {
  id: string;
  value: number;
};

type ArrayObject = {
  items?: ArrayItem[];
};

type LargeObject = Record<
  string,
  {
    nested: NestedValue;
  }
>;

type NestedObject = {
  next?: NestedObject;
  value?: string;
};

type NestedValue = {
  data: {
    info: string;
  };
  value: number;
};

// Define types for our objects
type SimpleObject = {
  user?: {
    profile?: {
      name?: string;
      settings?: {
        notifications?: {
          email?: boolean;
          sms?: boolean;
        };
        theme?: string;
      };
    };
  };
};

// Custom get implementation for comparison
const customGet = <T, D = undefined>(
  object: Record<string, unknown>,
  path: string | string[],
  defaultValue?: D,
): D | T | undefined => {
  // Skip processing if object is null or undefined
  if (isNil(object)) {
    return defaultValue;
  }

  const keys = isArray(path) ? path : split(path, ".");

  // Skip processing if path is empty
  if (0 === keys.length) {
    return defaultValue;
  }

  // @ts-expect-error ignore
  let result: T = object;

  for (const key of keys) {
    // Check if result is an object or array that can have properties
    if (isNil(result) || !isObject(result)) {
      return defaultValue;
    }

    // Safe access to the property
    // @ts-expect-error ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    result = result[key];
  }

  // Return the result or default value
  return isNil(result) ? defaultValue : result;
};

// Test data structures
const simpleObject: SimpleObject = {
  user: {
    profile: {
      name: "John",
      settings: {
        notifications: {
          email: true,
          sms: false,
        },
        theme: "dark",
      },
    },
  },
};

const arrayObject: ArrayObject = {
  items: [
    { id: "a1", value: 100 },
    { id: "a2", value: 200 },
    { id: "a3", value: 300 },
  ],
};

const largeObject: LargeObject = (() => {
  const object: LargeObject = {};
  for (let index = 0; 1000 > index; index += 1) {
    object[`prop${index}`] = {
      nested: {
        data: {
          info: `Item ${index}`,
        },
        value: index,
      },
    };
  }
  return object;
})();

// Create objects with varying path depths to test O(n) complexity
const createNestedObject = (depth: number): NestedObject => {
  const object: NestedObject = { value: "found" };
  let current = object;

  for (let index = 0; index < depth; index += 1) {
    current.next = {};
    current = current.next;
    if (index === depth - 1) {
      current.value = "found";
    }
  }

  return object;
};

// Create paths of varying lengths
const createPath = (depth: number): string[] => {
  const path: string[] = ["next"];
  for (let index = 1; index < depth; index += 1) {
    path.push("next");
  }
  path.push("value");
  return path;
};

// Create string paths of varying lengths
const createStringPath = (depth: number): string => {
  let path = "next";
  for (let index = 1; index < depth; index += 1) {
    path += ".next";
  }
  path += ".value";
  return path;
};

// Objects with different nesting depths
const depthObjects: Record<string, NestedObject> = {
  depth10: createNestedObject(10),
  depth100: createNestedObject(100),
  depth20: createNestedObject(20),
  depth5: createNestedObject(5),
  depth50: createNestedObject(50),
};

// Benchmark tests
// Path constants to avoid duplication
const THEME_PATH = "user.profile.settings.theme";
const EMAIL_PATH = "user.profile.settings.notifications.email";

describe("Simple property access", () => {
  bench("Optional chaining", () => {
    simpleObject?.user?.profile?.settings?.theme;
  });

  bench("lodash.get", () => {
    get(simpleObject, THEME_PATH);
  });

  bench("Custom get", () => {
    customGet<string>(simpleObject, THEME_PATH);
  });
});

describe("Deep nested property access", () => {
  bench("Optional chaining", () => {
    simpleObject?.user?.profile?.settings?.notifications?.email;
  });

  bench("lodash.get", () => {
    get(simpleObject, EMAIL_PATH);
  });

  bench("Custom get", () => {
    customGet<boolean>(simpleObject, EMAIL_PATH);
  });
});

describe("Array access", () => {
  bench("Optional chaining with find", () => {
    const foundItem = find(arrayObject.items, (item) => "a2" === item.id);
    foundItem?.value;
  });

  bench("lodash.get with array path", () => {
    // This is not a direct equivalent, but shows lodash.get's capability with array paths
    get(arrayObject, "items[1].value");
  });
});

describe("Non-existent property access", () => {
  bench("Optional chaining", () => {
    // @ts-expect-error - nonExistent property doesn't exist on profile
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    simpleObject?.user?.profile?.nonExistent?.value;
  });

  bench("lodash.get", () => {
    get(simpleObject, "user.profile.nonExistent.value");
  });

  bench("Custom get", () => {
    customGet<unknown>(simpleObject, "user.profile.nonExistent.value");
  });
});

describe("Default value handling", () => {
  bench("Optional chaining with nullish coalescing", () => {
    // @ts-expect-error - nonExistent property doesn't exist on profile
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    simpleObject?.user?.profile?.nonExistent?.value ?? "default";
  });

  bench("lodash.get with default", () => {
    get(simpleObject, "user.profile.nonExistent.value", "default");
  });

  bench("Custom get with default", () => {
    customGet<unknown, string>(
      simpleObject,
      "user.profile.nonExistent.value",
      "default",
    );
  });
});

describe("Large object access", () => {
  // Using a fixed index for consistent benchmarking
  const fixedIndex = 500;
  const path = `prop${fixedIndex}.nested.data.info`;

  bench("Optional chaining", () => {
    const propertyKey = `prop${fixedIndex}`;
    largeObject?.[propertyKey]?.nested?.data?.info;
  });

  bench("lodash.get", () => {
    get(largeObject, path);
  });

  bench("Custom get", () => {
    customGet<string>(largeObject, path);
  });
});

describe("Dynamic path access", () => {
  const path = ["user", "profile", "settings", "theme"];

  bench("lodash.get with array path", () => {
    get(simpleObject, path);
  });

  bench("Custom get with array path", () => {
    customGet<string>(simpleObject, path);
  });

  // Optional chaining can't handle dynamic paths directly
  // This is just for comparison, using a hardcoded equivalent
  bench("Optional chaining (hardcoded equivalent)", () => {
    simpleObject?.user?.profile?.settings?.theme;
  });
});

// O(n) complexity tests - how performance scales with path depth
describe("O(n) complexity - Path depth of 5", () => {
  const object = depthObjects.depth5;
  const arrayPath = createPath(5);
  const stringPath = createStringPath(5);

  bench("Optional chaining", () => {
    object?.next?.next?.next?.next?.next?.value;
  });

  bench("lodash.get with string path", () => {
    get(object, stringPath);
  });

  bench("lodash.get with array path", () => {
    get(object, arrayPath);
  });

  bench("Custom get with string path", () => {
    customGet<string>(object, stringPath);
  });
});

describe("O(n) complexity - Path depth of 10", () => {
  const object = depthObjects.depth10;
  const arrayPath = createPath(10);
  const stringPath = createStringPath(10);

  // Optional chaining becomes unwieldy at this depth
  bench("lodash.get with string path", () => {
    get(object, stringPath);
  });

  bench("lodash.get with array path", () => {
    get(object, arrayPath);
  });

  bench("Custom get with string path", () => {
    customGet<string>(object, stringPath);
  });
});

describe("O(n) complexity - Path depth of 20", () => {
  const object = depthObjects.depth20;
  const arrayPath = createPath(20);
  const stringPath = createStringPath(20);

  bench("lodash.get with string path", () => {
    get(object, stringPath);
  });

  bench("lodash.get with array path", () => {
    get(object, arrayPath);
  });

  bench("Custom get with string path", () => {
    customGet<string>(object, stringPath);
  });
});

describe("O(n) complexity - Path depth of 50", () => {
  const object = depthObjects.depth50;
  const arrayPath = createPath(50);
  const stringPath = createStringPath(50);

  bench("lodash.get with string path", () => {
    get(object, stringPath);
  });

  bench("lodash.get with array path", () => {
    get(object, arrayPath);
  });

  bench("Custom get with string path", () => {
    customGet<string>(object, stringPath);
  });
});

describe("O(n) complexity - Path depth of 100", () => {
  const object = depthObjects.depth100;
  const arrayPath = createPath(100);
  const stringPath = createStringPath(100);

  bench("lodash.get with string path", () => {
    get(object, stringPath);
  });

  bench("lodash.get with array path", () => {
    get(object, arrayPath);
  });

  bench("Custom get with string path", () => {
    customGet<string>(object, stringPath);
  });
});
