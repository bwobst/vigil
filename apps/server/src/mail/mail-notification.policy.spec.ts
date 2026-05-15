import "reflect-metadata";
import { describe, it, expect } from "vitest";
import { detectNotificationEdge, type RunSnapshot } from "./mail-notification.policy";

const pass = (conditionMet: boolean | null): RunSnapshot => ({ status: "PASS", conditionMet });
const error = (): RunSnapshot => ({ status: "ERROR", conditionMet: null });

describe("detectNotificationEdge", () => {
  describe("CONDITION_MET edge", () => {
    it("fires on first run when conditionMet is true (no prior)", () => {
      expect(detectNotificationEdge(pass(true), null)).toBe("CONDITION_MET");
    });

    it("fires when prior conditionMet was false and current is true", () => {
      expect(detectNotificationEdge(pass(true), pass(false))).toBe("CONDITION_MET");
    });

    it("fires when prior conditionMet was null and current is true", () => {
      expect(detectNotificationEdge(pass(true), pass(null))).toBe("CONDITION_MET");
    });

    it("does not fire when conditionMet stays true (true -> true)", () => {
      expect(detectNotificationEdge(pass(true), pass(true))).toBeNull();
    });

    it("does not fire when current conditionMet is false", () => {
      expect(detectNotificationEdge(pass(false), null)).toBeNull();
    });

    it("does not fire when current conditionMet is null (PASS run, null condition)", () => {
      expect(detectNotificationEdge(pass(null), null)).toBeNull();
    });

    it("fires again after a false->true->false->true sequence (new edge)", () => {
      expect(detectNotificationEdge(pass(true), pass(false))).toBe("CONDITION_MET");
    });
  });

  describe("EXECUTION_ERROR edge", () => {
    it("fires on first run when status is ERROR (no prior)", () => {
      expect(detectNotificationEdge(error(), null)).toBe("EXECUTION_ERROR");
    });

    it("fires when prior was PASS and current is ERROR (PASS -> ERROR edge)", () => {
      expect(detectNotificationEdge(error(), pass(true))).toBe("EXECUTION_ERROR");
    });

    it("fires when prior was PASS with conditionMet=false and current is ERROR", () => {
      expect(detectNotificationEdge(error(), pass(false))).toBe("EXECUTION_ERROR");
    });

    it("does not fire when error streak continues (ERROR -> ERROR)", () => {
      expect(detectNotificationEdge(error(), error())).toBeNull();
    });

    it("fires again after recovery: PASS -> ERROR (new edge after prior PASS)", () => {
      expect(detectNotificationEdge(error(), pass(null))).toBe("EXECUTION_ERROR");
    });
  });

  describe("no edge", () => {
    it("returns null for first PASS run with conditionMet=false", () => {
      expect(detectNotificationEdge(pass(false), null)).toBeNull();
    });

    it("returns null for PASS -> PASS with conditionMet false both times", () => {
      expect(detectNotificationEdge(pass(false), pass(false))).toBeNull();
    });

    it("returns null for ERROR -> PASS with conditionMet=false (recovery, not a trigger)", () => {
      expect(detectNotificationEdge(pass(false), error())).toBeNull();
    });
  });

  describe("startedAt tie-break (order invariance)", () => {
    it("edge detection is purely based on status/conditionMet values, not ordering metadata", () => {
      // The ordering (startedAt asc, then id asc) is enforced at the DB query level;
      // policy receives the already-determined prior run.
      // Verify that passing different prior run states produces expected edges.
      const priorA: RunSnapshot = { status: "PASS", conditionMet: false };
      const priorB: RunSnapshot = { status: "PASS", conditionMet: true };
      const current: RunSnapshot = { status: "PASS", conditionMet: true };
      expect(detectNotificationEdge(current, priorA)).toBe("CONDITION_MET");
      expect(detectNotificationEdge(current, priorB)).toBeNull();
    });
  });
});
