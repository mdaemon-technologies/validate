# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.1.0] - 2026-11-16

Brings every validator in line with the standard it implements. Issue [#1]
reported that `validateEmailAddress` (`validate.email`) disagreed with
`validateDomain` and rejected IPv6 address literals and quoted pairs. Fixing it
led to a spec-conformance audit of the whole library, and this release fixes
what the audit found: in email addresses, domains, IP addresses, HTTP headers,
Windows paths, LDAP DNs, phone numbers, schemas and passwords.

Validation output changes for many inputs, in both directions (see *Migration
notes*). Several fixes close security gaps (see *Security*). There are no API or
TypeScript changes (only JSDoc comments differ in the declarations), and still
no runtime dependencies. One change can stop existing code at startup:
registering a schema with a malformed constraint, such as `minLength: "5"`,
now throws a `TypeError` instead of silently ignoring the constraint.

Reported by [trackoor](https://github.com/trackoor)
(<https://ucsbplse.github.io/>) in [#1].

**Migration notes:**

- **`validateEmailAddress`**
  - Now rejected:
    - a domain label that starts or ends with a hyphen (`"test@-iana.org"`,
      `"test@iana-.com"`), or is longer than 63 characters.
    - a local part longer than 64 octets, and an address longer than 254
      octets, both counted in UTF-8 (`"é".repeat(33) + "@example.com"`).
    - C1 control characters (U+0080–U+009F) and unpaired UTF-16 surrogates
      anywhere (`"us\u0085er@example.com"`, `"\uD800@example.com"`).
    - whitespace other than ASCII spaces at the start or end
      (`"user@example.com\u2028"`, `"\u00A0user@example.com"`). It used to be
      trimmed and the address accepted, though the caller keeps the untrimmed
      string; 3.6.0 had listed this trimming as unchanged. ASCII spaces are
      still trimmed.
    - wildcard patterns that can't match an address: misplaced dots in the
      local part (`".*@x.com"`, `"a..*@x.com"`), an all-numeric last label
      (`"*@x.123"`), a `#` in the domain (`"a*@x#.com"`), a domain label over
      63 characters, or a local part over 64 octets.
  - Now accepted:
    - a last domain label with digits or hyphens, such as a punycode top-level
      domain (`"test@example.xn--p1ai"`), or one character long (`"t@a.b"`).
      It still can't be all digits: `"t@1.2.3.4"` is rejected; use the
      address literal `"t@[1.2.3.4]"`.
    - internationalized domains (`"user@bücher.de"`, `"用户@例子.广告"`).
    - IPv6 address literals (`"user@[IPv6:2001:db8::1]"`), with the tag in any
      case, and leading zeros in an embedded IPv4 part
      (`"user@[IPv6:::ffff:001.2.3.4]"`). They follow RFC 5321's IPv6 grammar,
      which is stricter than RFC 4291's: `::` must stand for at least two
      groups, so `"u@[IPv6:1::3:4:5:6:7:8]"` is rejected. A prefix length or
      zone ID is rejected too.
    - quoted pairs in a quoted local part (`"\"a\\\"b\"@iana.org"`).
    - with `useWildCards`, a real address that contains `*` or `?` but isn't a
      valid pattern (`"\"what?\"@example.com"`, `"user?@[192.0.2.1]"`).
    - a valid address with surrounding whitespace that took it past 254
      characters; the limit is now checked after trimming.
  - Unchanged: a trailing dot (`"t@example.com."`), a single-label domain
    (`"t@localhost"`), an empty quoted local part (`"\"\"@iana.org"`) and
    address literals with other tags are still rejected.
- **`validateDomain`**
  - Now rejected: an all-numeric last label (`"1.2.3.4"`, `"example.123"`,
    and `"*.123"` with wildcards).
  - Now accepted: internationalized domain names (`"bücher.de"`), checked in
    their A-label form, also in wildcard mode when the name has no wildcard
    characters. Labels with characters that IDNA would map to others
    (fullwidth letters, superscripts) are rejected, as are wildcard patterns
    with non-ASCII characters.
- **`validateIPAddress`, `validateIPv4`, `validateIPv6`**
  - Now rejected: leading zeros in an IPv4 address with a prefix length
    (`"010.0.0.1/8"`); whitespace other than ASCII spaces around an IPv6
    address (`"::1\u2028"`, `"\uFEFF::1"`) and a space before its prefix
    length (`"::1 /64"`); IPv4 wildcard octets that can't match 0–255
    (`"3##.*.*.*"`, `"0#.1.1.1"`).
  - Now accepted: spaces after an IPv6 prefix length (`"::1/64 "`); IPv6
    wildcard patterns with seven groups and `::` at one end
    (`"::1:2:3:4:5:6:*"`).
- **`validateHeader`, `validateHeaderName`, `validateHeaderValue`**
  - Now rejected: characters above U+00FF in a value
    (`"X-Test: \u010d\u010a..."`); whitespace before the colon or before the
    name (`"X-Test : v"`, `" X-Test: v"`). This reverses 3.6.0, which kept
    trimming spaces around the name; RFC 9112 requires a server to reject them.
  - Now accepted: tabs in and around a value (`"X-Test:\tvalue"`,
    `"X-Test: a\tb"`); empty values (`"X-Test:"`, `validateHeaderValue("")`);
    any RFC 9110 token as a name (`"-X-Test"`, `"X_Custom.Header~1"`).
  - Unchanged: CR, LF, NUL, other C0 controls and DEL are still rejected,
    including obs-fold.
- **`validateWindowsFileName`, `validateWindowsPath`**
  - Now rejected: `"."` and `".."` as a file name; reserved device names in
    any case and with any extension, as a name or path segment (`"CON"`,
    `"nul.txt"`, `"C:\\a\\COM1"`, `"LPT¹"`); names and segments ending in a
    period or space (`"a."`, `"C:\\a \\b"`); `\\.\` device paths
    (`"\\\\.\\PhysicalDrive0"`); UNC paths without a share (`"\\\\server"`)
    or with `.` or `..` as the server or share (`"\\\\server\\..\\x"`);
    names or segments over 255 characters and paths over 32,767.
  - Now accepted: file names made of Unicode spaces such as U+00A0, which
    Windows doesn't strip (only U+0020 counts as blank).
- **`validateLdapDN`** is now an RFC 4514 parser.
  - Now accepted: escaped specials (`"cn=Smith\\, John,dc=example,dc=com"`),
    any attribute type in any order (`"CN=Steve Kille,O=Isode Limited,C=GB"`,
    numeric OIDs), hex-string values (`"1.3.6.1.4.1.1466.0=#04024869,..."`),
    multi-valued RDNs with any types (`"o=a+c=b"`), spaces after commas between several
    OUs, and empty values for every attribute type.
  - Now rejected: unescaped `+`, `;`, `<`, `>` and `"` in values (`"cn=a+b"`,
    `"cn=a;b"`); `;` as a separator; bad escapes (`"cn=a\\"`, `"cn=a\\zz"`)
    and hex escapes that aren't valid UTF-8 (`"cn=\\C4"`); bad hex strings
    (`"cn=#zz"`); stray commas (`",ou=a"`, `"OU=a,"`); unpaired surrogates.
  - Unchanged: spaces around `=`, `,` and values are still tolerated, the
    empty DN is still rejected, and control characters are still rejected.
- **`validatePhoneNumber`**
  - Now rejected: more than 15 digits (the E.164 maximum,
    `"+00000000000000000000"`); a `+` not followed directly by a digit from 1
    to 9 (`"+ 12345"`, `"+0 123 456 7890"`); unbalanced, empty, nested or
    repeated parentheses (`")12345("`, `"(1)(2)345"`); a parenthesized group
    that isn't followed by digits (`"12345 (6)"`, `"(12345)"`); leading,
    trailing or doubled separators (`"-12345"`, `"12-34--5"`).
  - Now accepted: formatted numbers longer than 20 characters with at most 15
    digits (`"+49 (0) 30 1234 5678 90"`); a leading space before `+`.
- **Schemas (`createSchemaValidator`, `updateSchema`)**
  - Now throws `TypeError` at registration (a rejected `updateSchema` keeps
    the schema already registered): a `pattern` that is not a string or a
    RegExp (`pattern: 5`); a `minLength`, `maxLength`, `minimum`, `maximum`,
    `minItems` or `maxItems` that is not a number, or is NaN
    (`minLength: "5"`); a `type` that is `""` or unknown; `options` that is
    not an array; `validate` that is not a function; nesting deeper than 1000
    objects, where each schema and each `properties` object counts, so 500
    levels of nested `properties` or 1000 of `arraySchema`. (Before, schemas
    a few thousand levels deep registered and deeper ones threw `RangeError`.)
    The other constraints used to be ignored silently, so a schema with one of
    them checked less than it said.
  - Now enforced: a RegExp `pattern` (`pattern: /^a$/i`), which used to be
    copied as `{}` so every string passed. It is copied without the `g` and
    `y` flags, and `getSchema` returns it as a RegExp.
  - Now invalid: NaN fails `minimum` and `maximum`; holes in a sparse array
    are checked as `undefined` against `arraySchema`.
  - A `null` constraint (`type: null`, `minLength: null`) is treated as absent
    and left out of the registered copy, as a `null` `properties` already was.
  - A custom `validate` is called with `this` undefined. It used to get the
    registered schema, and could change it.
  - Validators never throw on hostile values (revoked Proxies, throwing
    getters), on unprintable errors and options, or when a deep schema runs
    out of stack; they report `"Value could not be read"`, `"a value that
    cannot be displayed"` or `"Value could not be validated: the stack ran
    out"` instead.
- **Passwords:** a `min` or `max` below 1, such as 0.5, is ignored as the
  README says, in `setPasswordRequirements` and in `isValidPassword`'s
  arguments. It was enforced.

### Changed

- The email check no longer uses a single backtracking-prone regex. Each part
  is checked by a linear-time pattern or by `validateDomain`.
- The README documents each validator's rules, including the deliberate
  choices that differ from the full standards: only absolute Windows paths,
  ASCII-only character classes in passwords, and the leniencies kept in LDAP
  DNs.

### Fixed

- **Email addresses (issue [#1]).** The domain part is now checked by
  `validateDomain`, after splitting at the last `@`; `[IPv6:...]` literals and
  quoted pairs are accepted; length limits count UTF-8 octets as RFC 5321 and
  RFC 6531 require; C1 controls are rejected as RFC 6530 section 10.1 requires
  for mailbox names. `hasControlCharacters` is unchanged: C1 characters are
  legal in Windows names, HTTP obs-text and LDAP values.
- **Domains:** internationalized names are supported, and a last label made
  only of digits is rejected (RFC 1123 section 2.1).
- **HTTP headers:** names follow RFC 9110's `token` rule, and values allow
  tabs and may be empty.
- **Windows paths:** follow Microsoft's naming rules for device names,
  trailing periods and spaces, `.` and `..`, UNC shares and lengths.
- **LDAP DNs:** follow RFC 4514 instead of a fixed CN/OU/DC shape.
- **Phone numbers:** the limit is on digits, not characters, and the
  structure is checked.
- **Wildcard patterns** that can't match anything are rejected, in IP and
  email patterns.
- **Schemas:** malformed constraints are rejected at registration instead of
  being ignored, RegExp patterns work, NaN fails a range check, and sparse
  arrays are checked in full.
- **Passwords:** `min` and `max` below 1 are ignored, as documented.

### Security

- **`validateHeaderValue` and `validateHeader` accepted characters above
  U+00FF.** Written to a socket as latin1, `"\u010d\u010a"` becomes CR LF, so a
  value that passed could inject a header. Values are now limited to tab,
  U+0020–U+007E and U+0080–U+00FF, as RFC 9110 section 5.5 allows.
- **`validateHeader` accepted whitespace before the colon.** RFC 9112 section
  5.1 requires a server to reject it, because front ends and back ends parse it
  differently (request smuggling).
- **`validateIPAddress` accepted leading zeros with a prefix length.**
  `"010.0.0.1/8"` passed, though `"010.0.0.1"` did not; some parsers read
  `010` as octal 8, so an access rule could cover a different network than it
  appears to.
- **`validateIPv6` and `validateEmailAddress` accepted U+2028 and other
  Unicode whitespace around an address.** It was trimmed before the check, but
  the caller keeps the untrimmed string, and JavaScript treats U+2028 as a line
  terminator. Only ASCII spaces are trimmed now.
- **`validateWindowsFileName` accepted `".."`**, so a validated name joined to
  a directory could climb out of it, and both Windows validators accepted
  device names (`"NUL"`, `"COM1"`) and `\\.\` device paths
  (`"\\\\.\\PhysicalDrive0"`).
- **`validateLdapDN` threw `RangeError` on input of several megabytes.** It is
  now an iterative parser that runs in linear time and never throws.
- **Schema validators threw on hostile values,** such as a revoked Proxy or an
  object with a throwing getter, and a custom `validate` could change the
  registered schema through `this`, even adding a cycle. Validation now
  reports these as errors, and `validate` gets no `this`.

## [4.0.1] - 2026-11-10

Supports Node 18 again, and moves the build and tests to new tooling. The
public API, validation results and type declarations are unchanged:
`dist/index.d.ts` and `dist/index.d.cts` are byte-identical to 4.0.0's. The
three JavaScript bundles are rebuilt, so their minified contents differ. They
still target ES2020, the CommonJS and UMD bundles are still strict mode (the
UMD bundle's `"use strict"` is now at the top of the file rather than inside
its factory function), and their exports object is still a plain object with
`__esModule`. There are still no runtime dependencies.

### Added

- **Node 18 support.** `engines` is now `"node": ">=18"` (it was `>=20` from
  3.5.1). The bundles never needed Node 20: `>=20` only matched the oldest Node
  version CI tested. CI now smoke-tests the built bundles on Node 18 and 20.
- **`CHANGELOG.md` is now included in the npm package.**
- **README:** the supported Node versions, and a *Development* section on how
  the package is built and tested.

### Changed

- **Build: Rollup → Vite 8.** `vite.config.ts` replaces `rollup.config.js` and
  builds the same three bundles (`validate.mjs`, `validate.cjs`,
  `validate.umd.js`) under the same names. The declarations are still bundled
  by `rollup-plugin-dts`, now run from a small Vite plugin. The `build` script
  type-checks `src/` first, because Vite does not.
- **TypeScript 6 → 7.** TypeScript 7 has no JavaScript compiler API, so
  `rollup-plugin-dts` and the declaration tests use the official
  `@typescript/typescript6` compatibility package for it. The consumer type
  fixtures are now also compiled by TypeScript 7's own `tsc`.
- **Tests: Jest → Vitest 5.** The test files import their APIs from `vitest`.
  - The built bundles are now loaded by Node itself, as consumers load them.
  - The UMD bundle is tested as a browser global (`window.validate`) and
    through a CommonJS loader.
  - New tests cover the ES module bundle, which was previously untested, and
    pin the exact list of files in `dist/`. They also pin the CommonJS and UMD
    bundles' strict mode and plain exports object.
- **CI.** The toolchain needs Node 22.12 or later, so the full suite runs on
  Node 22, 24 and 26. A dependency-free `node:test` smoke suite
  (`npm run test:smoke`) then checks the bundles built on Node 24 on Node 18
  and 20. The publish workflow does the same before it publishes, and publishes
  the build it tested.
- **New `npm run typecheck` script** (TypeScript 7's `tsc --noEmit`), which
  both workflows run, and `npm run typecheck:build`, which `npm run build` runs
  first. Vitest does not type-check, unlike ts-jest. Both scripts call
  TypeScript 7's own `tsc`, because the compatibility package's TypeScript 6
  `tsc` takes over `node_modules/.bin/tsc`.
- **Dependencies (dev only):**
  - Added: `vite`, `vitest` and `@typescript/typescript6`.
  - Updated: `typescript` ^6 → ^7 and `@types/node` ^20 → ^22.
  - Removed: `jest`, `ts-jest`, `@types/jest`, `@rollup/plugin-typescript`,
    `@rollup/plugin-terser` and `tslib`.
  - Removed the `js-yaml` override in `package.json`, because nothing depends
    on `js-yaml` any more.
  - `rollup` stays, used only by `rollup-plugin-dts`.

## [4.0.0] - 2026-10-06

A major release with one breaking change: `validatePassword`'s result reports
control characters, so it agrees with `isValidPassword`. In 3.6.0, the result
could show every check passing for a password that `isValidPassword` rejected.

Accept/reject decisions are unchanged: `isValidPassword` accepts and rejects
exactly what it did in 3.6.0. There are still no runtime dependencies. Upgrading
from 3.5.x: see also the 3.6.0 *Migration notes*.

**Migration notes:**

- **Runtime:** every `validatePassword` (`validate.password`) result has a new
  `controlCharacters` key.
  - **Code that iterates over a result** (`Object.keys`, `Object.entries`,
    `Object.values`), for example to list failed checks, now sees it. Like
    `badPassword`, it is `true` when the password fails, so a loop that treats
    `false` as a failed check reports it for every valid password. Handle it the
    way you handle `badPassword`, or skip it.
  - **Code that compares a whole result**, such as `toEqual`/`toStrictEqual` or
    snapshot tests, must add `controlCharacters: false`. This includes
    serialised results checked by a strict schema on the receiving side.
- **TypeScript:** `MDaemonValidPassword` has a new required
  `controlCharacters: boolean` field.
  - Code that only reads a result's properties needs no changes.
  - Code that builds an `MDaemonValidPassword`, such as a mock of
    `validatePassword` or an implementation of `MDaemonValidate`'s `password`,
    or code typed over its keys, such as a
    `Record<keyof MDaemonValidPassword, string>` of labels, must add
    `controlCharacters`.
- **3.6.0 workaround:** if you called `hasControlCharacters` to explain why
  `isValidPassword` rejected a password, you can read `controlCharacters` from
  the result instead.

### Changed

- **`validatePassword` reports `controlCharacters`.** It is `true` when the
  password contains a C0 control character (U+0000–U+001F) or DEL (U+007F),
  which makes the password invalid. Like `badPassword`, `true` means the
  password fails. Unlike the other checks, it is always present, including
  once password requirements are set, and it is `false` for a non-string.
- **`isValidPassword` reads `controlCharacters` from the result** instead of
  checking separately, so the two functions cannot disagree.

## [3.6.0] - 2026-10-06

A security release. `validateEmailAddress`, `validateHeader`,
`validateIPAddress` (and `validateIPv6`), `validateLdapDN` and `isValidPassword`
now reject every C0 control character (U+0000–U+001F) and DEL (U+007F). The
email, header and IPv6 checks let a CR or LF through, which a caller could pass
on into a mail or HTTP header.

Validation output changes for some inputs (see *Migration notes*). There are no
API or TypeScript changes, and still no runtime dependencies.

**Migration notes:**

- **Now rejected:**
  - a control character in the local part of an email address, quoted
    (`"\"a\r\nb\"@example.com"`) or unquoted (NUL, ESC, DEL). The domain part
    and wildcard patterns already rejected them.
  - a tab, CR, LF, VT or FF at the start or end of an email address or email
    wildcard pattern (`"user@example.com\r\n"`, `"\t*@example.com"`), a header
    passed to `validateHeader`, or its name or value (`"X-Test: value\r\n"`,
    `"X-Test:\tvalue"`). These were trimmed before the check, so they passed.
    Control characters inside a header's name or value were already rejected.
  - a tab, CR, LF, VT or FF at the start or end of an IPv6 address
    (`"fe80::1\r\n"`) or before its prefix length (`"fe80::1\n/64"`), in
    `validateIPAddress` and `validateIPv6`. IPv4 addresses and IP wildcard
    patterns already rejected them.
  - a control character other than CR or LF in or after an LDAP DN attribute
    value (`"cn=jo\u0000hn,dc=example,dc=com"`, or a trailing tab). Elsewhere in
    a DN, the pattern already rejected them.
  - a control character anywhere in a password passed to `isValidPassword`
    (`"TestPassword1\r\n"`), whatever the password requirements.
- **Unchanged:**
  - Email addresses: other leading and trailing whitespace (spaces, and Unicode
    spaces such as U+00A0) is still trimmed, and spaces inside a quoted local part
    (`"\"boss ted\"@example.com"`) are still accepted.
  - Headers: spaces around the name and value are still trimmed.
  - IPv6 addresses: leading and trailing spaces are still accepted.
  - Passwords: `validatePassword`'s result does not report control characters,
    so every check can pass for a password that `isValidPassword` now rejects.
    Use `hasControlCharacters` to tell the user why.

### Security

- **`validateEmailAddress` rejects control characters.**
  - Before, in normal mode: the unquoted local part rejected only whitespace, so
    NUL, ESC, DEL and other control characters were accepted. A quoted local
    part accepted anything but `"` and `\`, including CR and LF, so
    `"\"x\r\nBcc: evil@evil.com\"@example.com"` was valid.
  - Before, in both modes: the input was trimmed before the check, but the
    untrimmed string was reported valid, so a leading or trailing CRLF passed.
    Wildcard mode already rejected control characters, but only after trimming.
  - Now: the untrimmed input is checked with `hasControlCharacters` before
    trimming and before any pattern check, in both modes.
- **`validateHeader` rejects control characters.**
  - Before: it trimmed the name and the value, then checked each one, so a CR,
    LF, tab, VT or FF before or after either one was dropped. `"X-Test: value\r\n"`
    was valid, which let a caller end the header block early.
  - Now: the whole header is checked with `hasControlCharacters` first.
- **`validateIPAddress` and `validateIPv6` reject control characters.**
  - Before: the IPv6 pattern allowed whitespace around the address, so
    `"fe80::1\r\n"` and `"fe80::1\n/64"` were valid.
  - Now: the input is checked with `hasControlCharacters` first. Wildcard
    patterns already rejected control characters.
- **`validateLdapDN` rejects every control character.**
  - Before: only CR and LF were checked explicitly, so a tab, NUL or ESC in or
    after an attribute value passed.
  - Now: it uses `hasControlCharacters`, like the other validators.
- **`isValidPassword` rejects control characters.**
  - Before: any control character passed validation. A POP3 `PASS` argument
    must be printable ASCII (RFC 1939), and an IMAP quoted string cannot contain
    CR or LF (RFC 9051), so the user could be locked out of some mail clients.
  - Now: `isValidPassword` returns `false` for a password that contains any
    control character, checked with `hasControlCharacters`.
    `validatePassword`'s result keeps its published shape and does not report
    it (see *Migration notes*).

## [3.5.1] - 2026-09-21

A packaging and documentation release. The code is unchanged from 3.5.0.

### Changed

- **`engines`:** `package.json` now declares `"node": ">=20"`, matching the
  oldest Node version tested in CI.
- **README and changelog:** documentation rewritten for clarity.

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

[4.1.0]: https://www.npmjs.com/package/@mdaemon/validate/v/4.1.0
[4.0.1]: https://www.npmjs.com/package/@mdaemon/validate/v/4.0.1
[4.0.0]: https://www.npmjs.com/package/@mdaemon/validate/v/4.0.0
[3.6.0]: https://www.npmjs.com/package/@mdaemon/validate/v/3.6.0
[3.5.1]: https://www.npmjs.com/package/@mdaemon/validate/v/3.5.1
[3.5.0]: https://www.npmjs.com/package/@mdaemon/validate/v/3.5.0
[3.4.0]: https://www.npmjs.com/package/@mdaemon/validate/v/3.4.0
[3.3.6]: https://www.npmjs.com/package/@mdaemon/validate/v/3.3.6
[3.3.5]: https://www.npmjs.com/package/@mdaemon/validate/v/3.3.5
[3.3.0]: https://www.npmjs.com/package/@mdaemon/validate/v/3.3.0
[#1]: https://github.com/mdaemon-technologies/validate/issues/1
