import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const API_URL = "http://test.local";

function loadApi() {
  return import("./api");
}

async function mockFetchOnce(payload: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: async () => payload,
    })
  );
  const { api } = await loadApi();
  return api;
}

describe("api request layer", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = API_URL;
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it("returns data on success", async () => {
    const api = await mockFetchOnce({ success: true, message: "ok", data: { id: 3 } });
    const game = await api.games.byId(3);

    expect(game).toEqual({ id: 3 });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/Games/3`);
    expect(init.method).toBe("GET");
  });

  it("builds a query string from non-empty params only", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: "ok", data: { items: [], totalCount: 0 } }),
      })
    );
    const { api } = await loadApi();
    await api.games.list({ page: 2, pageSize: 12, search: "witcher" });

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/Games?page=2&pageSize=12&search=witcher`);
  });

  it("omits undefined and empty query params", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: "ok", data: { items: [] } }),
      })
    );
    const { api } = await loadApi();
    await api.games.list({ page: 1, genre: undefined, search: "" });

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/Games?page=1`);
  });

  it("attaches the bearer token and JSON body for mutations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: "ok", data: null }),
      })
    );
    const { api } = await loadApi();
    await api.cart.clear("my-token");

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/Cart`);
    expect(init.method).toBe("DELETE");
    expect(init.headers.Authorization).toBe("Bearer my-token");
  });

  it("throws ApiError with joined field errors on validation failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          message: "Validation failed",
          errors: ["Tên đăng nhập là bắt buộc.", "Mật khẩu là bắt buộc."],
        }),
      })
    );
    const { ApiError, api } = await loadApi();

    const promise = api.auth.login("", "");
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      status: 400,
      message: "Tên đăng nhập là bắt buộc. · Mật khẩu là bắt buộc.",
    });
  });

  it("falls back to the server message when no errors array is present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng." }),
      })
    );
    const { ApiError, api } = await loadApi();

    const promise = api.auth.login("admin", "wrong");
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ message: "Tên đăng nhập hoặc mật khẩu không đúng." });
  });

  it("throws a connection error on network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed"))
    );
    const { ApiError, api } = await loadApi();

    await expect(api.games.byId(1)).rejects.toBeInstanceOf(ApiError);
    await expect(api.games.byId(1)).rejects.toMatchObject({ status: 0 });
  });
});
