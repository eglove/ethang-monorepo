import { RuleTester } from "eslint";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { parser as tsParser } from "typescript-eslint";

import { preferEffectDateTimeRule } from "./prefer-effect-datetime.ts";

const pluginDirectory = import.meta.dirname;
const packageRoot = path.resolve(pluginDirectory, "..", "..");

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 2024,
      project: [path.join(packageRoot, "tsconfig.test.json")],
      sourceType: "module",
      tsconfigRootDir: packageRoot,
      warnOnUnsupportedTypeScriptVersion: false
    }
  }
});

// Each test must use a unique fixture file path. Sharing a single path
// across tests causes TypeScript's program cache to return stale type
// information when the file content changes between tests. The fixture
// approach is also required because `parserOptions.project` is set: the
// typescript-eslint parser needs a real on-disk filename to load the
// program — without it, every test fails with "fatal parsing error".
//
// Fixtures live in a sibling `.fixtures/` directory so the rules/ folder
// stays clean and the tsconfig can exclude them with a single glob.
const fixture = (name: string) => {
  const filePath = path.join(
    pluginDirectory,
    ".fixtures",
    `${name}.fixture.ts`
  );
  return { code: "", filename: filePath };
};

const runWith = (name: string, code: string) => {
  const { filename } = fixture(name);
  writeFileSync(filename, `${code}\n`);
};

ruleTester.run("prefer-effect-datetime", preferEffectDateTimeRule as never, {
  invalid: [
    // ---------------- new Date(...) ----------------
    {
      before() {
        runWith("new-date-bare", "const now = new Date();");
      },
      ...fixture("new-date-bare"),
      code: "const now = new Date();",
      errors: [{ messageId: "preferNewDate" }]
    },
    {
      before() {
        runWith("new-date-epoch", "const now = new Date(1700000000000);");
      },
      ...fixture("new-date-epoch"),
      code: "const now = new Date(1700000000000);",
      errors: [{ messageId: "preferNewDate" }]
    },
    {
      before() {
        runWith("new-date-parts", "const d = new Date(2024, 0, 15);");
      },
      ...fixture("new-date-parts"),
      code: "const d = new Date(2024, 0, 15);",
      errors: [{ messageId: "preferNewDate" }]
    },
    {
      before() {
        runWith(
          "new-date-many-parts",
          "const d = new Date(2024, 0, 15, 12, 30, 0, 0);"
        );
      },
      ...fixture("new-date-many-parts"),
      code: "const d = new Date(2024, 0, 15, 12, 30, 0, 0);",
      errors: [{ messageId: "preferNewDate" }]
    },
    {
      before() {
        runWith("new-date-string", "const d = new Date('2024-01-15');");
      },
      ...fixture("new-date-string"),
      code: "const d = new Date('2024-01-15');",
      errors: [{ messageId: "preferNewDate" }]
    },
    {
      before() {
        runWith(
          "new-date-from-date-arg",
          "function fn(arg: Date) { return new Date(arg); }"
        );
      },
      ...fixture("new-date-from-date-arg"),
      code: "function fn(arg: Date) { return new Date(arg); }",
      errors: [{ messageId: "preferDateType" }, { messageId: "preferNewDate" }]
    },

    // ---------------- Date(...) / Date.now / Date.parse / Date.UTC ----------------
    {
      before() {
        runWith("date-call", "const d = Date();");
      },
      ...fixture("date-call"),
      code: "const d = Date();",
      errors: [{ messageId: "preferDateStatic" }]
    },
    {
      before() {
        runWith("date-now", "const ms = Date.now();");
      },
      ...fixture("date-now"),
      code: "const ms = Date.now();",
      errors: [{ messageId: "preferDateStatic" }]
    },
    {
      before() {
        runWith("date-parse", "const ts = Date.parse('2024-01-15');");
      },
      ...fixture("date-parse"),
      code: "const ts = Date.parse('2024-01-15');",
      errors: [{ messageId: "preferDateStatic" }]
    },
    {
      before() {
        runWith("date-utc-2-arg", "const utc = Date.UTC(2024, 0, 15);");
      },
      ...fixture("date-utc-2-arg"),
      code: "const utc = Date.UTC(2024, 0, 15);",
      errors: [{ messageId: "preferDateStatic" }]
    },
    {
      before() {
        runWith(
          "date-utc-many-arg",
          "const utc = Date.UTC(2024, 0, 15, 12, 30);"
        );
      },
      ...fixture("date-utc-many-arg"),
      code: "const utc = Date.UTC(2024, 0, 15, 12, 30);",
      errors: [{ messageId: "preferDateStatic" }]
    },

    // ---------------- Temporal.* ----------------
    {
      before() {
        runWith("temporal-now", "const now = Temporal.Now.instant();");
      },
      ...fixture("temporal-now"),
      code: "const now = Temporal.Now.instant();",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      before() {
        runWith(
          "temporal-plain-date",
          "const d = Temporal.PlainDate.from('2024-01-15');"
        );
      },
      ...fixture("temporal-plain-date"),
      code: "const d = Temporal.PlainDate.from('2024-01-15');",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      before() {
        runWith(
          "temporal-zoned",
          "const z = Temporal.ZonedDateTime.from({ timeZone: 'UTC', plainDateTime: { year: 2024, month: 1, day: 1 } });"
        );
      },
      ...fixture("temporal-zoned"),
      code: "const z = Temporal.ZonedDateTime.from({ timeZone: 'UTC', plainDateTime: { year: 2024, month: 1, day: 1 } });",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      before() {
        runWith(
          "temporal-duration",
          "const dur = Temporal.Duration.from({ hours: 1 });"
        );
      },
      ...fixture("temporal-duration"),
      code: "const dur = Temporal.Duration.from({ hours: 1 });",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      before() {
        runWith(
          "temporal-timezone",
          "const tz = Temporal.TimeZone.from('UTC');"
        );
      },
      ...fixture("temporal-timezone"),
      code: "const tz = Temporal.TimeZone.from('UTC');",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      before() {
        runWith(
          "temporal-plain-time",
          "const t = Temporal.PlainTime.from('12:30');"
        );
      },
      ...fixture("temporal-plain-time"),
      code: "const t = Temporal.PlainTime.from('12:30');",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      before() {
        runWith(
          "temporal-instant",
          "const i = Temporal.Instant.fromEpochMilliseconds(1);"
        );
      },
      ...fixture("temporal-instant"),
      code: "const i = Temporal.Instant.fromEpochMilliseconds(1);",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      before() {
        runWith(
          "temporal-calendar",
          "const c = Temporal.Calendar.from('iso8601');"
        );
      },
      ...fixture("temporal-calendar"),
      code: "const c = Temporal.Calendar.from('iso8601');",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      before() {
        runWith(
          "temporal-plain-date-time",
          "const d = Temporal.PlainDateTime.from('2024-01-15T12:30');"
        );
      },
      ...fixture("temporal-plain-date-time"),
      code: "const d = Temporal.PlainDateTime.from('2024-01-15T12:30');",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      before() {
        runWith("temporal-unmapped-property", "const x = Temporal.Foo;");
      },
      ...fixture("temporal-unmapped-property"),
      code: "const x = Temporal.Foo;",
      errors: [
        {
          data: { target: "DateTime.make" },
          messageId: "preferTemporal"
        }
      ]
    },

    // ---------------- instanceof Date ----------------
    {
      before() {
        runWith("instanceof-date-if", "if (value instanceof Date) {}");
      },
      ...fixture("instanceof-date-if"),
      code: "if (value instanceof Date) {}",
      errors: [{ messageId: "preferDateInstanceof" }]
    },
    {
      before() {
        runWith(
          "instanceof-date-const",
          "const isDate = value instanceof Date;"
        );
      },
      ...fixture("instanceof-date-const"),
      code: "const isDate = value instanceof Date;",
      errors: [{ messageId: "preferDateInstanceof" }]
    },

    // ---------------- `Date` as a type reference ----------------
    {
      before() {
        runWith("date-param-type", "function fn(arg: Date): void {}");
      },
      ...fixture("date-param-type"),
      code: "function fn(arg: Date): void {}",
      errors: [{ messageId: "preferDateType" }]
    },
    {
      before() {
        runWith("date-array-type", "const arr: Array<Date> = [];");
      },
      ...fixture("date-array-type"),
      code: "const arr: Array<Date> = [];",
      errors: [{ messageId: "preferDateType" }]
    },
    {
      before() {
        runWith("date-as-cast", "const d = something as Date;");
      },
      ...fixture("date-as-cast"),
      code: "const d = something as Date;",
      errors: [{ messageId: "preferDateType" }]
    },
    {
      before() {
        runWith("date-angle-cast", "const d = <Date>something;");
      },
      ...fixture("date-angle-cast"),
      code: "const d = <Date>something;",
      errors: [{ messageId: "preferDateType" }]
    },
    {
      before() {
        runWith(
          "date-qualified-name-type",
          "const d: Foo.Date = new Foo.Date();"
        );
      },
      ...fixture("date-qualified-name-type"),
      code: "const d: Foo.Date = new Foo.Date();",
      errors: [{ messageId: "preferDateType" }]
    },

    // ---------------- Methods called on a typed `Date` receiver ----------------
    {
      before() {
        runWith(
          "date-instance-getTime",
          "declare const date: Date; export const ms = date.getTime();"
        );
      },
      ...fixture("date-instance-getTime"),
      code: "declare const date: Date; export const ms = date.getTime();",
      errors: [
        { messageId: "preferDateType" },
        { messageId: "preferDateMember" }
      ]
    },
    {
      before() {
        runWith(
          "date-instance-getFullYear",
          "declare const date: Date; export const y = date.getFullYear();"
        );
      },
      ...fixture("date-instance-getFullYear"),
      code: "declare const date: Date; export const y = date.getFullYear();",
      errors: [
        { messageId: "preferDateType" },
        { messageId: "preferDateMember" }
      ]
    },
    {
      before() {
        runWith(
          "date-instance-getMonth",
          "declare const date: Date; export const m = date.getMonth();"
        );
      },
      ...fixture("date-instance-getMonth"),
      code: "declare const date: Date; export const m = date.getMonth();",
      errors: [
        { messageId: "preferDateType" },
        { messageId: "preferDateMember" }
      ]
    },
    {
      before() {
        runWith(
          "date-instance-toISOString",
          "declare const date: Date; export const s = date.toISOString();"
        );
      },
      ...fixture("date-instance-toISOString"),
      code: "declare const date: Date; export const s = date.toISOString();",
      errors: [
        { messageId: "preferDateType" },
        { messageId: "preferDateMember" }
      ]
    },
    {
      before() {
        runWith(
          "date-instance-unknown-method",
          "declare const date: Date; export const x = date.someMethod();"
        );
      },
      ...fixture("date-instance-unknown-method"),
      code: "declare const date: Date; export const x = date.someMethod();",
      errors: [
        { messageId: "preferDateType" },
        { messageId: "preferDateMember" }
      ]
    },
    {
      before() {
        runWith(
          "date-instance-union",
          "declare const date: Date | string; export const y = date.getFullYear();"
        );
      },
      ...fixture("date-instance-union"),
      code: "declare const date: Date | string; export const y = date.getFullYear();",
      errors: [
        { messageId: "preferDateType" },
        { messageId: "preferDateMember" }
      ]
    },
    // ---------------- Computed property access on a Date receiver ----------------
    // The rule intentionally skips `date["method"]()` because the property
    // is a `Literal` (not an `Identifier`); we cannot statically know the
    // method name. Only the `Date` type annotation is flagged.
    {
      before() {
        runWith(
          "date-instance-computed-property",
          'declare const date: Date; export const y = date["getFullYear"]();'
        );
      },
      ...fixture("date-instance-computed-property"),
      code: 'declare const date: Date; export const y = date["getFullYear"]();',
      errors: [{ messageId: "preferDateType" }]
    }
  ],
  valid: [
    // ---------------- Effect DateTime usage is the preferred path ----------------
    {
      before() {
        runWith(
          "valid-datetime-unsafe-now",
          "import { DateTime } from 'effect'; const now = DateTime.unsafeNow();"
        );
      },
      ...fixture("valid-datetime-unsafe-now"),
      code: "import { DateTime } from 'effect'; const now = DateTime.unsafeNow();"
    },
    {
      before() {
        runWith(
          "valid-datetime-unsafe-make",
          "import { DateTime } from 'effect'; const d = DateTime.unsafeMake('2024-01-15');"
        );
      },
      ...fixture("valid-datetime-unsafe-make"),
      code: "import { DateTime } from 'effect'; const d = DateTime.unsafeMake('2024-01-15');"
    },
    {
      before() {
        runWith(
          "valid-datetime-make-zoned",
          "import { DateTime } from 'effect'; const z = DateTime.makeZoned(input, { timeZone: 'UTC' });"
        );
      },
      ...fixture("valid-datetime-make-zoned"),
      code: "import { DateTime } from 'effect'; const z = DateTime.makeZoned(input, { timeZone: 'UTC' });"
    },
    {
      before() {
        runWith(
          "valid-datetime-now-pipe",
          "import { DateTime } from 'effect'; const ms = DateTime.now().pipe(DateTime.toEpochMillis);"
        );
      },
      ...fixture("valid-datetime-now-pipe"),
      code: "import { DateTime } from 'effect'; const ms = DateTime.now().pipe(DateTime.toEpochMillis);"
    },
    {
      before() {
        runWith(
          "valid-datetime-to-epoch-millis",
          "import { DateTime } from 'effect'; const ms = DateTime.toEpochMillis(dt);"
        );
      },
      ...fixture("valid-datetime-to-epoch-millis"),
      code: "import { DateTime } from 'effect'; const ms = DateTime.toEpochMillis(dt);"
    },

    // ---------------- Names / types that *look* similar but are not the global Date ----------------
    {
      before() {
        runWith(
          "valid-shadowed-date-import",
          "import { Date } from './date.js'; const d = new Date();"
        );
      },
      ...fixture("valid-shadowed-date-import"),
      code: "import { Date } from './date.js'; const d = new Date();"
    },
    {
      before() {
        runWith(
          "valid-shadowed-date-class",
          "const Date_ = class {}; const d = new Date_();"
        );
      },
      ...fixture("valid-shadowed-date-class"),
      code: "const Date_ = class {}; const d = new Date_();"
    },
    {
      before() {
        runWith(
          "valid-shadowed-temporal-class",
          "const Temporal = class {}; const t = Temporal.Now.instant();"
        );
      },
      ...fixture("valid-shadowed-temporal-class"),
      code: "const Temporal = class {}; const t = Temporal.Now.instant();"
    },
    {
      before() {
        runWith(
          "valid-shadowed-date-type",
          "interface Date { x: number }; const d: Date = { x: 1 };"
        );
      },
      ...fixture("valid-shadowed-date-type"),
      code: "interface Date { x: number }; const d: Date = { x: 1 };"
    },
    {
      before() {
        runWith(
          "valid-shadowed-date-fn",
          "function isDate(value: unknown) { return typeof value === 'object'; }"
        );
      },
      ...fixture("valid-shadowed-date-fn"),
      code: "function isDate(value: unknown) { return typeof value === 'object'; }"
    },
    {
      before() {
        runWith(
          "valid-temporal-date-type",
          "declare const d: Temporal.Date; export const x = d;"
        );
      },
      ...fixture("valid-temporal-date-type"),
      code: "declare const d: Temporal.Date; export const x = d;"
    },
    {
      before() {
        runWith(
          "valid-temporal-plain-date-type",
          "declare const d: Temporal.PlainDate; export const x = d;"
        );
      },
      ...fixture("valid-temporal-plain-date-type"),
      code: "declare const d: Temporal.PlainDate; export const x = d;"
    },
    {
      before() {
        runWith(
          "valid-nested-qualified-name-type",
          "declare const d: Foo.Bar.Date; export const x = d;"
        );
      },
      ...fixture("valid-nested-qualified-name-type"),
      code: "declare const d: Foo.Bar.Date; export const x = d;"
    },
    {
      before() {
        runWith(
          "valid-new-non-date-constructor",
          "declare const foo: { bar: unknown }; export const x = new foo.bar();"
        );
      },
      ...fixture("valid-new-non-date-constructor"),
      code: "declare const foo: { bar: unknown }; export const x = new foo.bar();"
    },
    {
      before() {
        runWith("valid-call-non-date-identifier", "export const x = Foo();");
      },
      ...fixture("valid-call-non-date-identifier"),
      code: "export const x = Foo();"
    },
    {
      before() {
        runWith(
          "valid-call-shadow-date",
          "import { Date } from './date.js'; export const x = Date();"
        );
      },
      ...fixture("valid-call-shadow-date"),
      code: "import { Date } from './date.js'; export const x = Date();"
    },
    {
      before() {
        runWith(
          "valid-call-on-call-expression",
          "declare const foo: () => () => number; export const x = foo()();"
        );
      },
      ...fixture("valid-call-on-call-expression"),
      code: "declare const foo: () => () => number; export const x = foo()();"
    },
    {
      before() {
        runWith("valid-non-date-static-method", "export const x = Date.foo();");
      },
      ...fixture("valid-non-date-static-method"),
      code: "export const x = Date.foo();"
    },
    {
      before() {
        runWith(
          "valid-date-static-computed-property",
          'export const x = Date["foo"]();'
        );
      },
      ...fixture("valid-date-static-computed-property"),
      code: 'export const x = Date["foo"]();'
    },
    {
      before() {
        runWith(
          "valid-shadow-date-static-method",
          "import { Date } from './date.js'; export const x = Date.now();"
        );
      },
      ...fixture("valid-shadow-date-static-method"),
      code: "import { Date } from './date.js'; export const x = Date.now();"
    },
    {
      before() {
        runWith(
          "valid-temporal-computed-property",
          'export const x = Temporal["foo"];'
        );
      },
      ...fixture("valid-temporal-computed-property"),
      code: 'export const x = Temporal["foo"];'
    },

    // ---------------- Comparisons / unrelated expressions should not trigger ----------------
    {
      before() {
        runWith("valid-greater-than", "if (value > 0) {}");
      },
      ...fixture("valid-greater-than"),
      code: "if (value > 0) {}"
    },
    {
      before() {
        runWith("valid-null-eq", "value === null");
      },
      ...fixture("valid-null-eq"),
      code: "value === null"
    },
    {
      before() {
        runWith("valid-instanceof-regexp", "value instanceof RegExp");
      },
      ...fixture("valid-instanceof-regexp"),
      code: "value instanceof RegExp"
    },

    // ---------------- Non-Date typed receiver: method call shouldn't trigger Date check ----------------
    {
      before() {
        runWith(
          "valid-non-date-receiver",
          "declare const date: string; export const y = date.getFullYear();"
        );
      },
      ...fixture("valid-non-date-receiver"),
      code: "declare const date: string; export const y = date.getFullYear();"
    },

    // ---------------- eslint-disable directive (must be in the source it disables) ----------------
    {
      before() {
        runWith(
          "valid-eslint-disable",
          "// eslint-disable-next-line rule-to-test/prefer-effect-datetime\nconst now = new Date();"
        );
      },
      ...fixture("valid-eslint-disable"),
      code: "// eslint-disable-next-line rule-to-test/prefer-effect-datetime\nconst now = new Date();"
    }
  ]
});
