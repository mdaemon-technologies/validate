import { describe, expect, it } from "vitest";
import { validateWindowsFileName, validateWindowsPath } from "../src/validate";

// Reserved device names (Microsoft, "Naming Files, Paths, and Namespaces"),
// including the ISO 8859-1 superscript digits that Windows treats as digits.
const DEVICE_NAMES = [
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "COM\u00b9", "COM\u00b2", "COM\u00b3",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
  "LPT\u00b9", "LPT\u00b2", "LPT\u00b3"
];

// "C:" + 163 segments of 201 characters + "\a" is exactly 32,767 characters.
const LONGEST_PATH = "C:" + ("\\" + "a".repeat(200)).repeat(163) + "\\a";

describe("validateWindowsFileName", () => {
  it("rejects the . and .. directory specifiers and dot-and-space names", () => {
    for (const name of [".", "..", " .", ". .", "...", " "]) {
      expect(validateWindowsFileName(name)).toBe(false);
    }
  });

  it("accepts a name that starts with a period", () => {
    expect(validateWindowsFileName(".temp")).toBe(true);
    expect(validateWindowsFileName("..temp")).toBe(true);
  });

  it("rejects reserved device names in any case, with or without an extension", () => {
    for (const name of DEVICE_NAMES) {
      expect(validateWindowsFileName(name)).toBe(false);
      expect(validateWindowsFileName(name.toLowerCase())).toBe(false);
      expect(validateWindowsFileName(name + ".txt")).toBe(false);
    }
    expect(validateWindowsFileName("nul.txt")).toBe(false);
    expect(validateWindowsFileName("NUL.tar.gz")).toBe(false);
    expect(validateWindowsFileName("Con.log")).toBe(false);
    expect(validateWindowsFileName("CON .txt")).toBe(false);
  });

  it("accepts names that only contain or resemble a device name", () => {
    for (const name of ["CONSOLE", "CON1", "NULL.txt", "COM10", "LPT10", "xCON", "COM", "LPT", "AUX_1.txt", "nul_.txt"]) {
      expect(validateWindowsFileName(name)).toBe(true);
    }
  });

  it("accepts COM0 and LPT0, which Microsoft does not list as reserved", () => {
    expect(validateWindowsFileName("COM0")).toBe(true);
    expect(validateWindowsFileName("LPT0.txt")).toBe(true);
  });

  it("rejects names that end in a period or a space", () => {
    for (const name of ["a.", "a ", "a. ", "a .", "file.txt.", "file.txt "]) {
      expect(validateWindowsFileName(name)).toBe(false);
    }
  });

  it("accepts leading and inner spaces", () => {
    expect(validateWindowsFileName(" a")).toBe(true);
    expect(validateWindowsFileName("a b.txt")).toBe(true);
  });

  it("treats only U+0020 as blank, so other Unicode whitespace is a legal name", () => {
    expect(validateWindowsFileName("\u00a0")).toBe(true);
    expect(validateWindowsFileName("\u3000")).toBe(true);
    expect(validateWindowsFileName("\ufeff")).toBe(true);
    expect(validateWindowsFileName("a\u00a0")).toBe(true);
    expect(validateWindowsFileName("")).toBe(false);
    expect(validateWindowsFileName("   ")).toBe(false);
  });

  it("limits a name to 255 characters", () => {
    expect(validateWindowsFileName("a".repeat(255))).toBe(true);
    expect(validateWindowsFileName("a".repeat(256))).toBe(false);
  });

  it("accepts C1 control characters, which are legal, and rejects DEL", () => {
    expect(validateWindowsFileName("a\u0085b")).toBe(true);
    expect(validateWindowsFileName("a\u007fb")).toBe(false);
  });

  it("returns false for non-string input without throwing", () => {
    for (const value of [undefined, null, 1, {}, [], true]) {
      expect(validateWindowsFileName(value as unknown as string)).toBe(false);
    }
  });
});

describe("validateWindowsPath", () => {
  it("accepts . and .. segments inside a fully qualified path", () => {
    expect(validateWindowsPath("C:\\a\\..\\b")).toBe(true);
    expect(validateWindowsPath("C:\\a\\.\\b")).toBe(true);
    expect(validateWindowsPath("\\\\server\\share\\..\\b")).toBe(true);
    expect(validateWindowsPath("C:\\a\\..\\b", true)).toBe(true);
  });

  it("rejects other dot-and-space segments", () => {
    expect(validateWindowsPath("C:\\...\\b")).toBe(false);
    expect(validateWindowsPath("C:\\ .\\b")).toBe(false);
    expect(validateWindowsPath("C:\\. .")).toBe(false);
  });

  it("rejects a reserved device name as any segment", () => {
    for (const name of DEVICE_NAMES) {
      expect(validateWindowsPath("C:\\" + name)).toBe(false);
      expect(validateWindowsPath("C:\\" + name.toLowerCase() + ".txt")).toBe(false);
      expect(validateWindowsPath("C:\\" + name + "\\b")).toBe(false);
      expect(validateWindowsPath("\\\\server\\share\\" + name)).toBe(false);
    }
    expect(validateWindowsPath("C:\\a\\nul.txt")).toBe(false);
    expect(validateWindowsPath("\\\\server\\CON")).toBe(false);
    expect(validateWindowsPath("C:\\a\\CON", true)).toBe(false);
  });

  it("accepts segments that only resemble a device name", () => {
    expect(validateWindowsPath("C:\\CONSOLE\\COM10\\LPT0\\NULL.txt")).toBe(true);
    expect(validateWindowsPath("C:\\C?N", true)).toBe(true);
  });

  it("rejects segments that end in a period or a space", () => {
    for (const path of ["C:\\a.", "C:\\a ", "C:\\a.\\b", "C:\\a \\b", "C:\\a. \\b", "\\\\server\\share.", "\\\\server\\share \\b"]) {
      expect(validateWindowsPath(path)).toBe(false);
      expect(validateWindowsPath(path, true)).toBe(false);
    }
  });

  it("accepts Unicode whitespace other than U+0020 in a segment", () => {
    expect(validateWindowsPath("C:\\\u00a0\\b")).toBe(true);
    expect(validateWindowsPath("C:\\a\u3000")).toBe(true);
  });

  it("rejects Win32 device-namespace paths", () => {
    for (const path of ["\\\\.\\COM1", "\\\\.\\PhysicalDrive0", "\\\\.\\pipe\\x", "\\\\..\\share", "\\\\.\\C:\\a"]) {
      expect(validateWindowsPath(path)).toBe(false);
      expect(validateWindowsPath(path, true)).toBe(false);
    }
  });

  it("rejects the . and .. specifiers as a UNC share", () => {
    expect(validateWindowsPath("\\\\server\\.")).toBe(false);
    expect(validateWindowsPath("\\\\server\\..\\b")).toBe(false);
  });

  it("rejects extended-length paths, except as a wildcard pattern", () => {
    expect(validateWindowsPath("\\\\?\\C:\\a")).toBe(false);
    expect(validateWindowsPath("\\\\?\\UNC\\server\\share")).toBe(false);
    // In wildcard mode "?" matches one character, so this is a one-character server.
    expect(validateWindowsPath("\\\\?\\x", true)).toBe(true);
  });

  it("requires a UNC path to name a server and a share", () => {
    expect(validateWindowsPath("\\\\server")).toBe(false);
    expect(validateWindowsPath("\\\\s")).toBe(false);
    expect(validateWindowsPath("\\\\*", true)).toBe(false);
    expect(validateWindowsPath("\\\\s\\t")).toBe(true);
  });

  it("limits each segment to 255 characters", () => {
    expect(validateWindowsPath("C:\\" + "a".repeat(255) + "\\b")).toBe(true);
    expect(validateWindowsPath("C:\\" + "a".repeat(256) + "\\b")).toBe(false);
    expect(validateWindowsPath("\\\\server\\" + "a".repeat(256))).toBe(false);
    expect(validateWindowsPath("\\\\" + "a".repeat(256) + "\\share")).toBe(false);
  });

  it("limits the whole path to 32,767 characters", () => {
    expect(LONGEST_PATH.length).toBe(32767);
    expect(validateWindowsPath(LONGEST_PATH)).toBe(true);
    expect(validateWindowsPath(LONGEST_PATH + "a")).toBe(false);
  });

  it("does not count * toward the length limits in wildcard mode", () => {
    expect(validateWindowsPath("C:\\" + "a".repeat(255) + "*", true)).toBe(true);
    expect(validateWindowsPath("C:\\" + "a".repeat(256) + "*", true)).toBe(false);
    expect(validateWindowsPath(LONGEST_PATH + "*", true)).toBe(true);
    expect(validateWindowsPath(LONGEST_PATH + "?", true)).toBe(false);
  });

  it("documents what stays rejected: relative paths, slashes, roots and streams", () => {
    for (const path of ["a\\b", "\\a", "C:a", "C:/a", "C:\\a/b", "//server/share", "C:\\", "\\\\server\\share\\", "C:\\file:stream", "C:\\a\u007fb"]) {
      expect(validateWindowsPath(path)).toBe(false);
    }
    expect(validateWindowsPath("C:\\a\u0085b")).toBe(true);
  });

  it("returns false for non-string input without throwing", () => {
    for (const value of [undefined, null, 1, {}, [], true]) {
      expect(validateWindowsPath(value as unknown as string)).toBe(false);
      expect(validateWindowsPath(value as unknown as string, true)).toBe(false);
    }
  });
});

describe("Windows validators on adversarial input", () => {
  const ADVERSARIAL = [
    "C:\\" + "a".repeat(1e6) + "|",
    "C:\\" + "a\\".repeat(5e5) + "|",
    "C:\\" + "a ".repeat(5e5),
    "C:\\" + " ".repeat(1e6) + "x|",
    "C:\\" + "\\ ".repeat(5e5),
    "\\\\" + ".\\".repeat(5e5),
    "\\\\" + "a".repeat(1e6),
    "C:\\" + "*".repeat(1e6) + "|",
    "C:\\CON" + " ".repeat(1e6) + "|"
  ];

  it("runs in linear time", () => {
    const start = Date.now();
    for (const input of ADVERSARIAL) {
      expect(validateWindowsPath(input)).toBe(false);
      expect(validateWindowsPath(input, true)).toBe(false);
      expect(validateWindowsFileName(input.slice(3))).toBe(false);
    }
    // Generous, to avoid CI flakes; a quadratic check takes minutes on these inputs.
    expect(Date.now() - start).toBeLessThan(2000);
  });
});
