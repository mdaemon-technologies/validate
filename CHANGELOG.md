# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.5.0] - 2026-09-11

A security, correctness, and packaging release.

- **Security:** it removes two regular expressions that took exponential time on crafted input (ReDoS).
- **Validators:** it tightens the wildcard, domain, Windows path and phone checks, and it fixes several cases where valid input was rejected.
- **Passwords and schemas:** it fixes bugs in both.
- **Types:** the type declarations are now generated from the source, which fixes TypeScript for CommonJS consumers.

Validation output changes for some inputs (see *Migration notes*). The TypeScript type names and interfaces are unchanged from 3.4.0. Some function signatures are looser, which only affects code that stands in for the library's own function types, such as typed mocks (see *Migration notes*). There are still no runtime dependencies.

**Migration notes:**

- **TypeScript:** code that *calls* the library needs no changes. The type names,
  the interfaces and the type of the default export's members, as TypeScript
  infers them, are the same as in 3.4.0. The looser signatures (see *Changed*)
  can affect code that stands in for or inspects the library's own function
  types:
  - A replacement or mock typed with `typeof validateDomain` (or
    `validateEmailAddress`, `validateIPAddress`, `validateWindowsPath`), or
    `jest.MockedFunction` of one, must now accept `useWildCards` being omitted.
    For example, it must take `(domain: string, useWildCards?: boolean | null)`.
  - `Parameters<typeof validateDomain>[1]` (and the same for the other three) is
    now `boolean | null | undefined`.
  - `typeof validate` now includes `hasControlCharacters` and the optional
    arguments. An object that only implements `MDaemonValidate` can't be
    assigned where `typeof validate` is expected. Type it as `MDaemonValidate`
    instead.
- **Now rejected:**
  - domains with empty labels, or labels that start or end with a hyphen
  - phone numbers with fewer than five digits
  - Windows paths and file names containing control characters
  - Windows paths with space-only folder names
  - wildcard patterns that cannot match an address
- **Now accepted:**
  - header names containing digits
  - IPv6 addresses without decimal digits
  - IPv4-mapped addresses in `validateIPv6`, including with a prefix length
  - IPv6 wildcard patterns such as `"fe80::*"`
  - one-character Windows path names
- **Schemas:**
  - Malformed or non-object schemas throw when registered.
  - Omitted optional properties with `options` or `validate` now pass.
  - A missing required value yields only `"Value is required"`.
- **Passwords:** `min` / `max` arguments of 0 now mean "no limit" when no
  requirements are set.
- **CommonJS:** use `require("@mdaemon/validate")`. The deep path
  `@mdaemon/validate/dist/validate.cjs` shown in earlier READMEs has been
  blocked by the `exports` map since 3.3.5.

### Added

- **`hasControlCharacters` in the type declarations.** It is declared both as a
  named export and on the default `validate` object. It was already there at
  runtime. It is added to the default object's type, not to the `MDaemonValidate`
  interface, so existing implementations of that interface keep compiling.
- **`"./package.json"` export:** the package now exports `"./package.json"`.

### Changed

- **Schemas: malformed schemas are rejected at registration.**
  `createSchemaValidator` and `updateSchema` throw a `TypeError` when:
  - the schema is not a plain object (for example `null` or an array);
  - a sub-schema is not an object (for example `properties: { a: null }`);
  - `type` is unknown (for example `"integer"`);
  - `pattern` is not a valid regular expression;
  - the schema contains a circular reference.

  Before:
  - A circular schema overflowed the stack at registration.
  - `updateSchema` accepted a `null` or non-object schema.
  - `createSchemaValidator` accepted an array.
  - The others crashed or misbehaved during validation.

  A `null` `properties` or `arraySchema` is treated as absent.
- **Wildcard grammar:** `?` matches one character, `#` one digit, and `*` any
  number of characters. A pattern must still be able to match something:
  - IPv4 patterns need four octets and may carry a CIDR prefix length.
  - IPv6 patterns may use `::`, a prefix length, or an IPv4-mapped tail.
  - Domain patterns need two or more labels.
  - Email patterns: only `*` and `?` make an address a pattern. Patterns are
    trimmed like normal addresses and need a plausible domain part.
- **Looser signatures in the type declarations.** These only widen what
  compiles:
  - `useWildCards` is optional on `validateDomain`, `validateEmailAddress`,
    `validateIPAddress` and `validateWindowsPath`, and it accepts `null`.
  - The default `validate` object accepts the same optional arguments (for
    example `validate.domain("example.com")`, and `validate.isValidPassword(str)`
    without the length arguments). It is still typed as an `MDaemonValidate`. The
    `MDaemonValidate` interface keeps its exact 3.4.0 signatures, so existing
    implementations of it (such as mocks) still compile.



- **Generated type declarations.** `rollup-plugin-dts` now generates them from
  the source; before, `dist/index.d.ts` was maintained by hand. A copy is
  published as `dist/index.d.cts`, and the `exports` map points `import` and
  `require` at their own types. This fixes CommonJS TypeScript consumers, who got
  `TS1471`/`TS1479` (the module "only resolves to an ES module") under `node16`
  resolution, and under `nodenext` before TypeScript 5.8. The generated declarations keep the 3.4.0 type names
  and shapes: `MDaemonValidate`, `MDaemonValidPassword`,
  `MDaemonPasswordRequirements`, `ISchema` and `ISchemaValidationResult`. A test
  compiles code written against the 3.4.0 declarations to keep it that way.
- **Source split.** The source is now split into modules (`characters`,
  `headers`, `network`, `windows`, `ldap`, `phone`, `password`, `schema`), with
  `src/validate.ts` as the entry point. There is no API change; fuzzing the
  bundle from before the split against the one from after found no differences.
- **Dependencies:** added `rollup-plugin-dts` and `@types/node` (dev only), and
  removed the unused `ts-node`.
- **CI:** GitHub Actions `checkout` and `setup-node` updated to v5.
- **Tests:** new tests cover every fix above, the public API surface, and the
  published declarations as seen by CommonJS and ES module consumers.
- **README:** examples corrected and the new behavior documented. The corrections
  cover `isInt`, the CommonJS `require` path, and the schema error strings. They
  also fix the custom-validator price example, which rejected `19.99` because of
  floating-point rounding.

### Fixed

- **IP addresses**
  - `validateIPAddress` accepts IPv6 addresses that contain no decimal digit,
    such as `"::"` and `"abcd::ef"`.
  - IPv6 prefix lengths are limited to `/0`–`/128`. Before, `"::1/999"` was
    accepted.
  - IPv6 zone IDs are limited to letters, digits, `_`, `.` and `-`.
  - `validateIPv6` accepts zone IDs that contain a dot (`"fe80::1%eth0.100"`).
    An IPv6 address with a dot (a zone ID or an IPv4-mapped tail) may carry a
    prefix length (`"::ffff:1.2.3.4/64"`), which must still be in range.
  - `validateIPv6` accepts IPv4-mapped addresses (`"::ffff:1.2.3.4"`).
- **Domains:** `validateDomain` checks each label. Each label is 1–63 letters,
  digits and inner hyphens, and the whole name is at most 253 characters.
  Before, `"..."`, `"-.-"` and `"a..com"` were accepted.
- **Header names:** `validateHeaderName` accepts digits, so `Content-MD5` and
  `X-B3-TraceId` now pass.
- **Windows names and paths**
  - `validateWindowsFileName` and `validateWindowsPath` reject every control
    character, including tab and NUL. Before, only CR and LF were rejected.
  - `validateWindowsPath` accepts one-character names (`"C:\a"`, and `"C:\*"`
    with wildcards). It rejects folder names made only of spaces.
- **Phone numbers:** `validatePhoneNumber` requires at least five digits.
  Before, `"     "` and `"-----"` were accepted.
- **Passwords**
  - `validatePassword` always includes `length`. Before, it was missing once
    password requirements had been set.
  - A `min` or `max` argument below 1 means "no limit" in every mode. Before,
    with no requirements set, `isValidPassword("Test1", false, 0, 0)` failed
    because the maximum length was taken to be 0.
  - `setPasswordRequirements({ badPasswords: [] })` clears the bad-password
    list. An explicit list replaces the current one.
  - `setPasswordRequirements` returns `false` when its argument is missing or not
    a plain object. Before, `null`/`undefined` threw, and other non-objects (a
    string, number or array) returned `true` and turned off the default rules. It
    no longer writes to `console.error`.
- **Schemas**
  - `options` and `validate` are no longer applied to an omitted optional
    property. The 3.4.0 fix for optional properties only covered the type check.
  - Schemas nested more than 10 levels deep are fully validated. Before, deeper
    levels were silently skipped and reported as valid.
  - A custom `validate` function that throws is reported as
    `"Custom validation threw: <message>"` instead of the exception escaping.
  - A missing required value (`undefined` or `null`) is reported once, as
    `"Value is required"`. No type, `options` or `validate` errors are added.
  - Only a value's own properties are validated. An inherited member such as
    `toString` no longer counts as present.
  - A sub-schema shared by several properties is copied once. Before,
    registration time grew exponentially with nesting depth.
  - A `pattern` is compiled once, at registration.

### Security

- **`validateWindowsPath` no longer backtracks exponentially.** A 30-character
  invalid path (`"C:\\" + "a".repeat(26) + "|"`) took over a second, and each
  additional character roughly doubled the time. The pattern now runs in linear
  time. The only difference in the pattern itself is that one-character names
  are now accepted (see *Fixed* for the other path changes).
- **`validateLdapDN` no longer backtracks exponentially.** An 82-character input
  such as `"DC=a".repeat(20) + ",x"` took about 95 s. The rewritten pattern
  accepts exactly the same DNs as before. That was verified against the old
  pattern on every combination of up to seven DN tokens (11.1 million strings).
- **Wildcard IP and email checks no longer accept arbitrary text.**
  - Before: any string containing a wildcard and three dots or colons was a valid
    IP pattern (for example `"evil.example.com.*"`). Any string containing
    `x@y` and a wildcard was a valid email pattern (for example `"<script>@x*"`).
  - Now: both are checked for shape (see *Changed*).
- **Schemas: `__proto__` keys are copied as plain data.**
  - Before: in a schema parsed from JSON, a `__proto__` key set the prototype of
    the stored copy. Its constraints were enforced but hidden from `getSchema`.
  - Now: the key is kept as ordinary data and has no effect on validation.

## [3.4.0] - 2026-06-16

A correctness, hardening, and maintenance release. It fixes several bugs in the
schema validator, password requirements, header validation, and the email
validator; upgrades the build toolchain to TypeScript 6; and resolves all
outstanding `npm audit` advisories. The schema fixes change observable
validation output, hence the minor version bump. There are no new runtime
dependencies (the published package still ships only `dist/`).

**Migration notes:**

Schema validation output changed in ways that may affect callers:

- Objects with **omitted optional typed properties** that previously failed
  will now pass.
- **Arrays supplied where an `object` is expected** that previously passed will
  now fail.
- Passing `null` no longer throws; it is reported as an invalid value instead.

There are no consumer-facing changes from the TypeScript 6 upgrade; it is a
development-toolchain change only.

### Changed

- **`validateEmailAddress` rejects inputs longer than 254 characters** before
  running its regex, guarding against catastrophic backtracking (ReDoS) on
  crafted input. 254 is the RFC 5321 maximum address length.
- **`validateEmailAddress`'s `useWildCards` parameter now defaults to `false`**,
  matching `validateDomain`, `validateIPAddress`, and `validateWindowsPath`.
- **Unknown schema names no longer throw.** A validator invoked for a name that
  is not registered now returns `{ valid: false, errors: [...] }` instead of
  dereferencing an undefined schema.
- **`validateInt` documentation clarified.** It validates a non-negative,
  digits-only string: leading zeros (e.g. `"007"`) are accepted and a leading
  minus sign (e.g. `"-5"`) is rejected. Behavior is unchanged.
- Removed redundant `/g` flags from internal test-only regular expressions.



- **Upgraded to TypeScript 6.** `typescript` `^5.8.3` → `^6.0.3`,
  `ts-jest` `^29.3.2` → `^29.4.11` (the first 29.x to allow TypeScript 6 as a
  peer), and `@rollup/plugin-typescript` `^12.1.2` → `^12.3.0`. No runtime
  dependencies and no public API changes — this affects the build/test
  toolchain only, and the emitted `dist/` bundles are unchanged in shape.
- **Added explicit TypeScript configuration** so the build no longer relies on
  shifting compiler defaults (TypeScript 6 changed several). A base
  `tsconfig.json` (`target: ES2020`, `module: ESNext`,
  `moduleResolution: Bundler`, `strict`, `esModuleInterop`) is used for tests
  and editing; `tsconfig.build.json` narrows the Rollup build to `src/`,
  excluding test files.
- **Converted `jest.config.ts` to `jest.config.cjs`** so the Jest config is
  plain CommonJS and no longer requires `ts-node`/`@types/node` to be parsed.

### Fixed

- **Schema: optional typed properties are no longer treated as required.**
  A property that declares a `type` but is not `required` is now valid when
  omitted (its value is `undefined`). Previously, an absent optional property
  produced a spurious `"Expected <type>, got undefined"` error and failed
  validation.
- **Schema: `null` values no longer crash validation.** A `null` where an
  `object` was expected previously threw an uncaught `TypeError` while
  recursing into properties. `null` is now type-checked like any other value
  (and rejected for non-null types) without recursing, so validation never
  throws on hostile or malformed input.
- **Schema: arrays are no longer accepted where an `object` is expected.**
  Because `typeof [] === "object"`, an array previously satisfied
  `type: "object"`. Arrays now correctly fail the object type check.
- **`setPasswordRequirements` is now atomic.** When the `max <= min` sanity
  check fails, the call returns `false` without mutating the existing
  requirements. Previously a failed call left partially-applied, inconsistent
  min/max values (and still flagged the requirements as user-set), silently
  corrupting later validations.
- **`hasControlCharacters` now detects the full control range.** It matches any
  C0 control character (U+0000–U+001F) and DEL (U+007F), including NUL.
  Previously only backspace, tab, vertical tab, form feed, and CR/LF were
  detected, so `validateHeaderValue` accepted values containing NUL and other
  control bytes — a header-injection risk.

### Security

Resolved all `npm audit` advisories (`0 vulnerabilities`). Both were in
build-time dev dependencies only — neither is part of the published package,
which ships `dist/` with zero runtime dependencies.

- **serialize-javascript (high, RCE/DoS):** bumped `@rollup/plugin-terser`
  `^0.4.4` → `^1.0.0`, which pulls the patched `serialize-javascript@^7.0.5`.
- **js-yaml (moderate, quadratic-complexity DoS):** pinned `js-yaml` to
  `^4.2.0` via a package `overrides` entry. It is a deep transitive dependency
  of the Jest coverage toolchain
  (`ts-jest → @jest/transform → babel-plugin-istanbul → @istanbuljs/load-nyc-config`)
  and is not used directly by this project.

Note: `npm audit fix --force` was intentionally **not** used — it would have
downgraded `ts-jest` to `29.1.2`, re-introducing the TypeScript 6 peer
incompatibility.

## [3.3.6] - 2026-05-19

- Added types exports.

## [3.3.5] - 2026-05-18

- Added package exports.

## [3.3.0] and earlier

See the Git history for changes prior to 3.3.5.

Version 3.0.0 (2025-04-24) converted the library to TypeScript for improved type safety and developer experience. While the source code uses TypeScript and requires dev dependencies (TypeScript, Rollup, Jest, etc.) for building and testing, the published package has **zero runtime dependencies**.

[3.5.0]: https://www.npmjs.com/package/@mdaemon/validate/v/3.5.0
[3.4.0]: https://www.npmjs.com/package/@mdaemon/validate/v/3.4.0
[3.3.6]: https://www.npmjs.com/package/@mdaemon/validate/v/3.3.6
[3.3.5]: https://www.npmjs.com/package/@mdaemon/validate/v/3.3.5
[3.3.0]: https://www.npmjs.com/package/@mdaemon/validate/v/3.3.0
