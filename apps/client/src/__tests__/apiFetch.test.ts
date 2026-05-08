import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch, apiFetchJson } from "../api/client";

function mockResponse(status: number, body?: unknown, ok?: boolean) {
  const isOk = ok ?? (status >= 200 && status < 300);
  return {
    ok: isOk,
    status,
    statusText: String(status),
    json: body !== undefined ? () => Promise.resolve(body) : () => Promise.reject(new Error("no body")),
  };
}

describe("apiFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON on a 2xx response", async () => {
    const payload = { id: "1", name: "Test" };
    fetchMock.mockResolvedValueOnce(mockResponse(200, payload));

    const result = await apiFetch<typeof payload>("/api/test");
    expect(result).toEqual(payload);
  });

  it("throws ApiError with correct status on a non-2xx response", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(404, undefined, false));

    await expect(apiFetch("/api/test")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
    });
  });

  it("ApiError carries server message field on 400 from ValidationPipe", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(400, { message: "name must be a string" }, false),
    );

    await expect(apiFetch("/api/test")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "name must be a string",
    });
  });

  it("ApiError joins array message from ValidationPipe", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(400, { message: ["name is required", "url must be a URL"] }, false),
    );

    await expect(apiFetch("/api/test")).rejects.toMatchObject({
      name: "ApiError",
      message: "name is required; url must be a URL",
    });
  });

  it("returns undefined on 202 without parsing body", async () => {
    const jsonSpy = vi.fn();
    fetchMock.mockResolvedValueOnce({ ok: true, status: 202, json: jsonSpy });

    const result = await apiFetch("/api/test");
    expect(result).toBeUndefined();
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it("returns undefined on 204 without parsing body", async () => {
    const jsonSpy = vi.fn();
    fetchMock.mockResolvedValueOnce({ ok: true, status: 204, json: jsonSpy });

    const result = await apiFetch("/api/test");
    expect(result).toBeUndefined();
    expect(jsonSpy).not.toHaveBeenCalled();
  });
});

describe("apiFetchJson", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends Content-Type: application/json and serialized body on POST", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(201, { id: "1" }));

    await apiFetchJson("/api/test", "POST", { name: "Test" });

    expect(fetchMock).toHaveBeenCalledWith("/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test" }),
    });
  });

  it("sends Content-Type: application/json and serialized body on PATCH", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, { id: "1", name: "Updated" }));

    await apiFetchJson("/api/test", "PATCH", { name: "Updated" });

    expect(fetchMock).toHaveBeenCalledWith("/api/test", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
  });
});
