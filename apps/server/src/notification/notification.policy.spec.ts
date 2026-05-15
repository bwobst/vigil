import { describe, it, expect } from "vitest";
import { detectNotificationEdge } from "./notification.policy";

describe("detectNotificationEdge", () => {
  describe("CONDITION_MET edge", () => {
    it("returns CONDITION_MET when conditionMet transitions from null (no prior) to true", () => {
      const current = { status: "PASS", conditionMet: true };
      expect(detectNotificationEdge(current, null)).toBe("CONDITION_MET");
    });

    it("returns CONDITION_MET when conditionMet transitions from false to true", () => {
      const current = { status: "PASS", conditionMet: true };
      const prior = { status: "PASS", conditionMet: false };
      expect(detectNotificationEdge(current, prior)).toBe("CONDITION_MET");
    });

    it("returns null when conditionMet stays true (steady state)", () => {
      const current = { status: "PASS", conditionMet: true };
      const prior = { status: "PASS", conditionMet: true };
      expect(detectNotificationEdge(current, prior)).toBeNull();
    });

    it("returns null when conditionMet is false", () => {
      const current = { status: "PASS", conditionMet: false };
      expect(detectNotificationEdge(current, null)).toBeNull();
    });
  });

  describe("EXECUTION_ERROR edge", () => {
    it("returns EXECUTION_ERROR on first error (no prior run)", () => {
      const current = { status: "ERROR", conditionMet: null };
      expect(detectNotificationEdge(current, null)).toBe("EXECUTION_ERROR");
    });

    it("returns EXECUTION_ERROR when error transitions from PASS to ERROR", () => {
      const current = { status: "ERROR", conditionMet: null };
      const prior = { status: "PASS", conditionMet: false };
      expect(detectNotificationEdge(current, prior)).toBe("EXECUTION_ERROR");
    });

    it("returns null when error persists (steady error state)", () => {
      const current = { status: "ERROR", conditionMet: null };
      const prior = { status: "ERROR", conditionMet: null };
      expect(detectNotificationEdge(current, prior)).toBeNull();
    });
  });

  describe("no edge", () => {
    it("returns null when no qualifying change", () => {
      const current = { status: "PASS", conditionMet: false };
      const prior = { status: "PASS", conditionMet: false };
      expect(detectNotificationEdge(current, prior)).toBeNull();
    });
  });
});
