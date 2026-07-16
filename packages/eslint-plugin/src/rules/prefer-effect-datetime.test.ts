import { RuleTester } from "eslint";
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

// Each test uses a unique committed fixture file under `.fixtures/`.
// Unique paths are required because the TypeScript program caches ASTs per file path; reusing a single fixture across tests causes the parser to report stale type information.
//
// The fixtures are static and committed to the repository so the parser
// can load the program on a fresh clone (no runtime fs writes, no race
// between fixture creation and parser invocation). They are excluded from
// the production tsconfig (`tsconfig.json`) but included in the test
// tsconfig (`tsconfig.test.json`).
const fixturesRoot = path.join(pluginDirectory, ".fixtures");
const fixture = (name: string) => {
  return {
    code: "",
    filename: path.join(fixturesRoot, `${name}.fixture.ts`)
  };
};

ruleTester.run("prefer-effect-datetime", preferEffectDateTimeRule as never, {
  invalid: [
    // ---------------- new Date(...) ----------------
    {
      ...fixture("new-date-bare"),
      code: "const now = new Date();",
      errors: [{ messageId: "preferNewDate" }]
    },
    {
      ...fixture("new-date-epoch"),
      code: "const now = new Date(1700000000000);",
      errors: [{ messageId: "preferNewDate" }]
    },
    {
      ...fixture("new-date-parts"),
      code: "const d = new Date(2024, 0, 15);",
      errors: [{ messageId: "preferNewDate" }]
    },
    {
      ...fixture("new-date-many-parts"),
      code: "const d = new Date(2024, 0, 15, 12, 30, 0, 0);",
      errors: [{ messageId: "preferNewDate" }]
    },
    {
      ...fixture("new-date-string"),
      code: "const d = new Date('2024-01-15');",
      errors: [{ messageId: "preferNewDate" }]
    },
    {
      ...fixture("new-date-from-date-arg"),
      code: "function fn(arg: Date) { return new Date(arg); }",
      errors: [{ messageId: "preferDateType" }, { messageId: "preferNewDate" }]
    },

    // ---------------- Date(...) / Date.now / Date.UTC ----------------
    {
      ...fixture("date-call"),
      code: "const d = Date();",
      errors: [{ messageId: "preferDateStatic" }]
    },
    {
      ...fixture("date-now"),
      code: "const ms = Date.now();",
      errors: [{ messageId: "preferDateStatic" }]
    },
    {
      ...fixture("date-utc-2-arg"),
      code: "const utc = Date.UTC(2024, 0, 15);",
      errors: [{ messageId: "preferDateStatic" }]
    },
    {
      ...fixture("date-utc-many-arg"),
      code: "const utc = Date.UTC(2024, 0, 15, 12, 30);",
      errors: [{ messageId: "preferDateStatic" }]
    },

    // ---------------- Temporal.* ----------------
    {
      ...fixture("temporal-now"),
      code: "const now = Temporal.Now.instant();",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      ...fixture("temporal-plain-date"),
      code: "const d = Temporal.PlainDate.from('2024-01-15');",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      ...fixture("temporal-zoned"),
      code: "const z = Temporal.ZonedDateTime.from({ timeZone: 'UTC', plainDateTime: { year: 2024, month: 1, day: 1 } });",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      ...fixture("temporal-duration"),
      code: "const dur = Temporal.Duration.from({ hours: 1 });",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      ...fixture("temporal-timezone"),
      code: "const tz = Temporal.TimeZone.from('UTC');",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      ...fixture("temporal-plain-time"),
      code: "const t = Temporal.PlainTime.from('12:30');",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      ...fixture("temporal-instant"),
      code: "const i = Temporal.Instant.fromEpochMilliseconds(1);",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      ...fixture("temporal-calendar"),
      code: "const c = Temporal.Calendar.from('iso8601');",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
      ...fixture("temporal-plain-date-time"),
      code: "const d = Temporal.PlainDateTime.from('2024-01-15T12:30');",
      errors: [{ messageId: "preferTemporal" }]
    },
    {
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
      ...fixture("instanceof-date-if"),
      code: "if (value instanceof Date) {}",
      errors: [{ messageId: "preferDateInstanceof" }]
    },
    {
      ...fixture("instanceof-date-const"),
      code: "const isDate = value instanceof Date;",
      errors: [{ messageId: "preferDateInstanceof" }]
    },

    // ---------------- `Date` as a type reference ----------------
    {
      ...fixture("date-param-type"),
      code: "function fn(arg: Date): void {}",
      errors: [{ messageId: "preferDateType" }]
    },
    {
      ...fixture("date-array-type"),
      code: "const arr: Array<Date> = [];",
      errors: [{ messageId: "preferDateType" }]
    },
    {
      ...fixture("date-as-cast"),
      code: "const d = something as Date;",
      errors: [{ messageId: "preferDateType" }]
    },
    {
      ...fixture("date-angle-cast"),
      code: "const d = <Date>something;",
      errors: [{ messageId: "preferDateType" }]
    },
    {
      ...fixture("date-qualified-name-type"),
      code: "const d: Foo.Date = new Foo.Date();",
      errors: [{ messageId: "preferDateType" }]
    },

    // ---------------- Methods called on a typed `Date` receiver ----------------
    {
      ...fixture("date-instance-getTime"),
      code: "declare const date: Date; export const ms = date.getTime();",
      errors: [
        { messageId: "preferDateType" },
        { messageId: "preferDateMember" }
      ]
    },
    {
      ...fixture("date-instance-getFullYear"),
      code: "declare const date: Date; export const y = date.getFullYear();",
      errors: [
        { messageId: "preferDateType" },
        { messageId: "preferDateMember" }
      ]
    },
    {
      ...fixture("date-instance-getMonth"),
      code: "declare const date: Date; export const m = date.getMonth();",
      errors: [
        { messageId: "preferDateType" },
        { messageId: "preferDateMember" }
      ]
    },
    {
      ...fixture("date-instance-toISOString"),
      code: "declare const date: Date; export const s = date.toISOString();",
      errors: [
        { messageId: "preferDateType" },
        { messageId: "preferDateMember" }
      ]
    },
    {
      ...fixture("date-instance-unknown-method"),
      code: "declare const date: Date; export const x = date.someMethod();",
      errors: [
        { messageId: "preferDateType" },
        { messageId: "preferDateMember" }
      ]
    },
    {
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
      ...fixture("date-instance-computed-property"),
      code: 'declare const date: Date; export const y = date["getFullYear"]();',
      errors: [{ messageId: "preferDateType" }]
    },
    // Negative case: receiver is a `Date` that is NOT produced by the
    // `DateTime.toDate*` bridge. Even though `DateTime` is imported above,
    // the `inner` binding is the bare `Date` global, so `.toUTCString()`
    // must still be flagged (twice: once for the `Date` type, once for
    // the `Date.prototype` method).
    {
      ...fixture("date-instance-non-bridge"),
      code: "import { DateTime } from 'effect'; declare const inner: Date; export const v = inner.toUTCString();",
      errors: [
        { messageId: "preferDateType" },
        { messageId: "preferDateMember" }
      ]
    }
  ],
  valid: [
    // ---------------- Effect DateTime usage is the preferred path ----------------
    {
      ...fixture("valid-datetime-unsafe-now"),
      code: "import { DateTime } from 'effect'; const now = DateTime.unsafeNow();"
    },
    {
      ...fixture("valid-datetime-unsafe-make"),
      code: "import { DateTime } from 'effect'; const d = DateTime.unsafeMake('2024-01-15');"
    },
    {
      ...fixture("valid-datetime-make-zoned"),
      code: "import { DateTime } from 'effect'; const z = DateTime.makeZoned(input, { timeZone: 'UTC' });"
    },
    {
      ...fixture("valid-datetime-now-pipe"),
      code: "import { DateTime } from 'effect'; const ms = DateTime.now().pipe(DateTime.toEpochMillis);"
    },
    {
      ...fixture("valid-datetime-to-epoch-millis"),
      code: "import { DateTime } from 'effect'; const ms = DateTime.toEpochMillis(dt);"
    },

    // ---------------- Names / types that *look* similar but are not the global Date ----------------
    {
      ...fixture("valid-shadowed-date-import"),
      code: "import { Date } from './date.js'; const d = new Date();"
    },
    {
      ...fixture("valid-shadowed-date-class"),
      code: "const Date_ = class {}; const d = new Date_();"
    },
    {
      ...fixture("valid-shadowed-temporal-class"),
      code: "const Temporal = class {}; const t = Temporal.Now.instant();"
    },
    {
      ...fixture("valid-shadowed-date-type"),
      code: "interface Date { x: number }; const d: Date = { x: 1 };"
    },
    {
      ...fixture("valid-shadowed-date-fn"),
      code: "function isDate(value: unknown) { return typeof value === 'object'; }"
    },
    {
      ...fixture("valid-temporal-date-type"),
      code: "declare const d: Temporal.Date; export const x = d;"
    },
    {
      ...fixture("valid-temporal-plain-date-type"),
      code: "declare const d: Temporal.PlainDate; export const x = d;"
    },
    {
      ...fixture("valid-nested-qualified-name-type"),
      code: "declare const d: Foo.Bar.Date; export const x = d;"
    },
    {
      ...fixture("valid-new-non-date-constructor"),
      code: "declare const foo: { bar: unknown }; export const x = new foo.bar();"
    },
    {
      ...fixture("valid-call-non-date-identifier"),
      code: "export const x = Foo();"
    },
    {
      ...fixture("valid-call-shadow-date"),
      code: "import { Date } from './date.js'; export const x = Date();"
    },
    {
      ...fixture("valid-call-on-call-expression"),
      code: "declare const foo: () => () => number; export const x = foo()();"
    },
    {
      ...fixture("valid-non-date-static-method"),
      code: "export const x = Date.foo();"
    },
    {
      ...fixture("valid-date-static-computed-property"),
      code: 'export const x = Date["foo"]();'
    },
    {
      ...fixture("valid-shadow-date-static-method"),
      code: "import { Date } from './date.js'; export const x = Date.now();"
    },
    {
      ...fixture("valid-temporal-computed-property"),
      code: 'export const x = Temporal["foo"];'
    },

    // ---------------- Comparisons / unrelated expressions should not trigger ----------------
    {
      ...fixture("valid-greater-than"),
      code: "if (value > 0) {}"
    },
    {
      ...fixture("valid-null-eq"),
      code: "value === null"
    },
    {
      ...fixture("valid-instanceof-regexp"),
      code: "value instanceof RegExp"
    },

    // ---------------- Non-Date typed receiver: method call shouldn't trigger Date check ----------------
    {
      ...fixture("valid-non-date-receiver"),
      code: "declare const date: string; export const y = date.getFullYear();"
    },

    // ---------------- Date.parse is allowed: only built-in that handles legacy formats ----------------
    {
      ...fixture("valid-date-parse"),
      code: "const ts = Date.parse('Sun, 06 Nov 1994 08:49:37 GMT');"
    },

    // ---------------- Effect → native Date bridge: `DateTime.toDate*(...)` ----------------
    // The rule must not flag `Date.prototype` methods on values produced by
    // the documented Effect → native Date bridge, because the user is
    // intentionally producing a legacy `Date` for HTTP / third-party interop.
    {
      ...fixture("valid-datetime-to-date-utc-chained-to-utcstring"),
      code: "import { DateTime } from 'effect'; export const s = DateTime.toDateUtc(DateTime.unsafeMake(0)).toUTCString();"
    },
    {
      ...fixture("valid-datetime-to-date-chained-to-utcstring"),
      code: "import { DateTime } from 'effect'; export const s = DateTime.toDate(DateTime.unsafeMake(0)).toUTCString();"
    },
    {
      ...fixture("valid-datetime-to-date-utc-chained-get-time"),
      code: "import { DateTime } from 'effect'; export const ms = DateTime.toDateUtc(DateTime.unsafeMake(0)).getTime();"
    },
    {
      ...fixture("valid-datetime-to-date-utc-stored-then-utcstring"),
      code: "import { DateTime } from 'effect'; const d = DateTime.toDateUtc(DateTime.unsafeMake(0)); export const s = d.toUTCString();"
    },
    {
      ...fixture("valid-datetime-to-date-stored-then-get-time"),
      code: "import { DateTime } from 'effect'; const d = DateTime.toDate(DateTime.unsafeMake(0)); export const ms = d.getTime();"
    },

    // ---------------- eslint-disable directive (must be in the source it disables) ----------------
    {
      ...fixture("valid-eslint-disable"),
      code: "// eslint-disable-next-line rule-to-test/prefer-effect-datetime\nconst now = new Date();"
    }
  ]
});
