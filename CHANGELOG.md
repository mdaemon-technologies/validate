# Changelog

All notable changes to `@mdaemon/validate` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.4.0] - 2026-06-15

A correctness, hardening, and maintenance release. It fixes several bugs in the
schema validator, password requirements, header validation, and the email
validator; upgrades the build toolchain to TypeScript 6; and resolves all
outstanding `npm audit` advisories. The schema fixes change observable
validation output, hence the minor version bump. There are no new runtime
dependencies (the published package still ships only `dist/`).

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

### Build / Tooling

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

### Migration notes

Schema validation output changed in ways that may affect callers:

- Objects with **omitted optional typed properties** that previously failed
  will now pass.
- **Arrays supplied where an `object` is expected** that previously passed will
  now fail.
- Passing `null` no longer throws; it is reported as an invalid value instead.

There are no consumer-facing changes from the TypeScript 6 upgrade; it is a
development-toolchain change only.

## [3.3.6]

- Added types exports.

## [3.3.5]

- Added package exports.

## [3.3.0] and earlier

See the Git history for changes prior to 3.3.5.
