import { bench, describe } from 'vitest';
import get from 'lodash/get.js';

// Custom get implementation for comparison
function customGet(obj, path, defaultValue) {
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return defaultValue;
    }
  }
  return result;
}

// Test data structures
const simpleObject = {
  user: {
    profile: {
      name: 'John',
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          sms: false
        }
      }
    }
  }
};

const arrayObject = {
  items: [
    { id: 'a1', value: 100 },
    { id: 'a2', value: 200 },
    { id: 'a3', value: 300 }
  ]
};

const largeObject = (() => {
  const obj = {};
  for (let i = 0; i < 1000; i++) {
    obj[`prop${i}`] = {
      nested: {
        value: i,
        data: {
          info: `Item ${i}`
        }
      }
    };
  }
  return obj;
})();

// Create objects with varying path depths to test O(n) complexity
function createNestedObject(depth) {
  let obj = { value: 'found' };
  let current = obj;

  for (let i = 0; i < depth; i++) {
    current.next = {};
    current = current.next;
    if (i === depth - 1) {
      current.value = 'found';
    }
  }

  return obj;
}

// Create paths of varying lengths
function createPath(depth) {
  const path = ['next'];
  for (let i = 1; i < depth; i++) {
    path.push('next');
  }
  path.push('value');
  return path;
}

// Create string paths of varying lengths
function createStringPath(depth) {
  let path = 'next';
  for (let i = 1; i < depth; i++) {
    path += '.next';
  }
  path += '.value';
  return path;
}

// Objects with different nesting depths
const depthObjects = {
  depth5: createNestedObject(5),
  depth10: createNestedObject(10),
  depth20: createNestedObject(20),
  depth50: createNestedObject(50),
  depth100: createNestedObject(100)
};

// Benchmark tests
describe('Simple property access', () => {
  bench('Optional chaining', () => {
    const theme = simpleObject?.user?.profile?.settings?.theme;
    return theme;
  });

  bench('lodash.get', () => {
    const theme = get(simpleObject, 'user.profile.settings.theme');
    return theme;
  });

  bench('Custom get', () => {
    const theme = customGet(simpleObject, 'user.profile.settings.theme');
    return theme;
  });
});

describe('Deep nested property access', () => {
  bench('Optional chaining', () => {
    const email = simpleObject?.user?.profile?.settings?.notifications?.email;
    return email;
  });

  bench('lodash.get', () => {
    const email = get(simpleObject, 'user.profile.settings.notifications.email');
    return email;
  });

  bench('Custom get', () => {
    const email = customGet(simpleObject, 'user.profile.settings.notifications.email');
    return email;
  });
});

describe('Array access', () => {
  bench('Optional chaining with find', () => {
    const value = arrayObject?.items?.find(item => item.id === 'a2')?.value;
    return value;
  });

  bench('lodash.get with array path', () => {
    // This is not a direct equivalent, but shows lodash.get's capability with array paths
    const value = get(arrayObject, 'items[1].value');
    return value;
  });
});

describe('Non-existent property access', () => {
  bench('Optional chaining', () => {
    const missing = simpleObject?.user?.profile?.nonExistent?.value;
    return missing;
  });

  bench('lodash.get', () => {
    const missing = get(simpleObject, 'user.profile.nonExistent.value');
    return missing;
  });

  bench('Custom get', () => {
    const missing = customGet(simpleObject, 'user.profile.nonExistent.value');
    return missing;
  });
});

describe('Default value handling', () => {
  bench('Optional chaining with nullish coalescing', () => {
    const value = simpleObject?.user?.profile?.nonExistent?.value ?? 'default';
    return value;
  });

  bench('lodash.get with default', () => {
    const value = get(simpleObject, 'user.profile.nonExistent.value', 'default');
    return value;
  });

  bench('Custom get with default', () => {
    const value = customGet(simpleObject, 'user.profile.nonExistent.value', 'default');
    return value;
  });
});

describe('Large object access', () => {
  const randomIndex = Math.floor(Math.random() * 1000);
  const path = `prop${randomIndex}.nested.data.info`;

  bench('Optional chaining', () => {
    const info = largeObject?.[`prop${randomIndex}`]?.nested?.data?.info;
    return info;
  });

  bench('lodash.get', () => {
    const info = get(largeObject, path);
    return info;
  });

  bench('Custom get', () => {
    const info = customGet(largeObject, path);
    return info;
  });
});

describe('Dynamic path access', () => {
  const path = ['user', 'profile', 'settings', 'theme'];

  bench('lodash.get with array path', () => {
    const theme = get(simpleObject, path);
    return theme;
  });

  bench('Custom get with array path', () => {
    const theme = customGet(simpleObject, path);
    return theme;
  });

  // Optional chaining can't handle dynamic paths directly
  // This is just for comparison, using a hardcoded equivalent
  bench('Optional chaining (hardcoded equivalent)', () => {
    const theme = simpleObject?.user?.profile?.settings?.theme;
    return theme;
  });
});

// O(n) complexity tests - how performance scales with path depth
describe('O(n) complexity - Path depth of 5', () => {
  const obj = depthObjects.depth5;
  const arrayPath = createPath(5);
  const stringPath = createStringPath(5);

  bench('Optional chaining', () => {
    const value = obj?.next?.next?.next?.next?.next?.value;
    return value;
  });

  bench('lodash.get with string path', () => {
    const value = get(obj, stringPath);
    return value;
  });

  bench('lodash.get with array path', () => {
    const value = get(obj, arrayPath);
    return value;
  });

  bench('Custom get with string path', () => {
    const value = customGet(obj, stringPath);
    return value;
  });
});

describe('O(n) complexity - Path depth of 10', () => {
  const obj = depthObjects.depth10;
  const arrayPath = createPath(10);
  const stringPath = createStringPath(10);

  // Optional chaining becomes unwieldy at this depth
  bench('lodash.get with string path', () => {
    const value = get(obj, stringPath);
    return value;
  });

  bench('lodash.get with array path', () => {
    const value = get(obj, arrayPath);
    return value;
  });

  bench('Custom get with string path', () => {
    const value = customGet(obj, stringPath);
    return value;
  });
});

describe('O(n) complexity - Path depth of 20', () => {
  const obj = depthObjects.depth20;
  const arrayPath = createPath(20);
  const stringPath = createStringPath(20);

  bench('lodash.get with string path', () => {
    const value = get(obj, stringPath);
    return value;
  });

  bench('lodash.get with array path', () => {
    const value = get(obj, arrayPath);
    return value;
  });

  bench('Custom get with string path', () => {
    const value = customGet(obj, stringPath);
    return value;
  });
});

describe('O(n) complexity - Path depth of 50', () => {
  const obj = depthObjects.depth50;
  const arrayPath = createPath(50);
  const stringPath = createStringPath(50);

  bench('lodash.get with string path', () => {
    const value = get(obj, stringPath);
    return value;
  });

  bench('lodash.get with array path', () => {
    const value = get(obj, arrayPath);
    return value;
  });

  bench('Custom get with string path', () => {
    const value = customGet(obj, stringPath);
    return value;
  });
});

describe('O(n) complexity - Path depth of 100', () => {
  const obj = depthObjects.depth100;
  const arrayPath = createPath(100);
  const stringPath = createStringPath(100);

  bench('lodash.get with string path', () => {
    const value = get(obj, stringPath);
    return value;
  });

  bench('lodash.get with array path', () => {
    const value = get(obj, arrayPath);
    return value;
  });

  bench('Custom get with string path', () => {
    const value = customGet(obj, stringPath);
    return value;
  });
});
