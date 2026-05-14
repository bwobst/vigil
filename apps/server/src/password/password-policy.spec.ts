import { describe, expect, it } from "vitest";
import { normalizeEmail, validatePassword } from "./password-policy";

describe("validatePassword", () => {
  describe("length requirement", () => {
    it("rejects passwords shorter than 12 characters", () => {
      const result = validatePassword("Abc1!defghi");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("at least 12 characters required");
    });

    it("accepts passwords with exactly 12 characters meeting all requirements", () => {
      const result = validatePassword("Abcdefghi1!z");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("accepts passwords longer than 12 characters", () => {
      const result = validatePassword("Abcdefghijklm1!Z");
      expect(result.valid).toBe(true);
    });
  });

  describe("uppercase requirement", () => {
    it("rejects passwords with no uppercase letters", () => {
      const result = validatePassword("abcdefghi1!z");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("at least one uppercase letter required");
    });

    it("accepts passwords with at least one uppercase letter", () => {
      const result = validatePassword("Abcdefghi1!z");
      expect(result.valid).toBe(true);
    });
  });

  describe("lowercase requirement", () => {
    it("rejects passwords with no lowercase letters", () => {
      const result = validatePassword("ABCDEFGHI1!Z");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("at least one lowercase letter required");
    });

    it("accepts passwords with at least one lowercase letter", () => {
      const result = validatePassword("Abcdefghi1!Z");
      expect(result.valid).toBe(true);
    });
  });

  describe("digit requirement", () => {
    it("rejects passwords with no digits", () => {
      const result = validatePassword("Abcdefghij!Z");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("at least one digit required");
    });

    it("accepts passwords with at least one digit", () => {
      const result = validatePassword("Abcdefghi1!Z");
      expect(result.valid).toBe(true);
    });
  });

  describe("symbol requirement", () => {
    it("rejects passwords with no symbols", () => {
      const result = validatePassword("Abcdefghi1Za");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("at least one symbol required");
    });

    it("accepts passwords with various symbols", () => {
      expect(validatePassword("Abcdefghi1!Z").valid).toBe(true);
      expect(validatePassword("Abcdefghi1@Z").valid).toBe(true);
      expect(validatePassword("Abcdefghi1#Z").valid).toBe(true);
      expect(validatePassword("Abcdefghi1$Z").valid).toBe(true);
    });
  });

  describe("multiple failures", () => {
    it("reports all violations at once", () => {
      const result = validatePassword("short");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("at least 12 characters required");
      expect(result.errors).toContain("at least one uppercase letter required");
      expect(result.errors).toContain("at least one digit required");
      expect(result.errors).toContain("at least one symbol required");
    });

    it("returns empty errors array for a fully valid password", () => {
      const result = validatePassword("Str0ng!Pass#12");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe("normalizeEmail", () => {
  it("lowercases the email", () => {
    expect(normalizeEmail("User@Example.COM")).toBe("user@example.com");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeEmail("  user@example.com  ")).toBe("user@example.com");
  });

  it("lowercases and trims together", () => {
    expect(normalizeEmail("  Admin@Vigil.App  ")).toBe("admin@vigil.app");
  });

  it("leaves already-normalized email unchanged", () => {
    expect(normalizeEmail("user@example.com")).toBe("user@example.com");
  });
});
