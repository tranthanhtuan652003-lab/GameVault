import type {
  ApiResponse,
  CartDto,
  DashboardDto,
  GameCreateRequest,
  GameDto,
  GameListParams,
  GenreDto,
  LoginResponse,
  OrderDto,
  PagedResult,
  PlatformDto,
  ReviewsResponse,
  UserDto,
  WishlistItemDto,
  DeveloperDto,
  PublisherDto,
  RegisterData,
  ReviewDto,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5080";

export class ApiError extends Error {
  errors: string[];
  status: number;
  constructor(message: string, status: number, errors: string[] = []) {
    super(message);
    this.errors = errors;
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, query, signal } = opts;

  let url = `${API_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        params.append(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      cache: "no-store",
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("gamevault:backend-online"));
    }
  } catch (err) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("gamevault:backend-offline"));
    }
    const reason = err instanceof Error ? err.message : "Network error";
    throw new ApiError(`Không thể kết nối máy chủ: ${reason}`, 0);
  }

  const payload = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !payload?.success) {
    const errors = Array.isArray(payload?.errors)
      ? payload.errors.filter((e): e is string => typeof e === "string")
      : [];
    const message =
      errors.length > 0
        ? errors.join(" · ")
        : (payload?.message ?? "Có lỗi xảy ra, vui lòng thử lại");
    throw new ApiError(message, res.status, errors);
  }

  return payload.data as T;
}

function buildQuery(params: GameListParams): Record<string, string | number | undefined> {
  return {
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    genre: params.genre,
    platform: params.platform,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    sort: params.sort,
    minRating: params.minRating,
  };
}

export const api = {
  // Public
  games: {
    list: (params: GameListParams = {}) =>
      request<PagedResult<GameDto>>("/api/Games", { query: buildQuery(params) }),
    byId: (id: number) => request<GameDto>(`/api/Games/${id}`),
    bySlug: (slug: string) => request<GameDto>(`/api/Games/${slug}`),
    search: (keyword: string, page = 1, pageSize = 12) =>
      request<PagedResult<GameDto>>("/api/Games/search", {
        query: { keyword, page, pageSize },
      }),
    genres: () => request<GenreDto[]>("/api/Games/genres"),
    platforms: () => request<PlatformDto[]>("/api/Games/platforms"),
  },

  reviews: {
    forGame: (gameId: number) =>
      request<ReviewsResponse>(`/api/games/${gameId}/Reviews`),
    create: (gameId: number, rating: number, comment: string, token: string) =>
      request<ReviewDto>(`/api/games/${gameId}/Reviews`, {
        method: "POST",
        body: { rating, comment },
        token,
      }),
  },

  auth: {
    login: (userName: string, password: string) =>
      request<LoginResponse>("/api/Auth/login", {
        method: "POST",
        body: { userName, password },
      }),
    register: (data: RegisterData) =>
      request<LoginResponse>("/api/Auth/register", {
        method: "POST",
        body: data,
      }),
    me: (token: string) =>
      request<UserDto>("/api/Auth/me", { token }),
    changePassword: (currentPassword: string, newPassword: string, token: string) =>
      request<null>("/api/Auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
        token,
      }),
    updateProfile: (
      fullName: string | undefined,
      email: string | undefined,
      token: string
    ) =>
      request<null>("/api/Auth/profile", {
        method: "PUT",
        body: { fullName, email },
        token,
      }),
    uploadAvatar: async (file: File, token: string): Promise<string> => {
      const form = new FormData();
      form.append("file", file);
      let res: Response;
      try {
        res = await fetch(`${API_URL}/api/Auth/avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
          cache: "no-store",
        });
      } catch (err) {
        const reason = err instanceof Error ? err.message : "Network error";
        throw new ApiError(`Không thể kết nối máy chủ: ${reason}`, 0);
      }
      const payload = (await res.json().catch(() => null)) as ApiResponse<string> | null;
      if (!res.ok || !payload?.success) {
        const errors = Array.isArray(payload?.errors)
          ? payload.errors.filter((e): e is string => typeof e === "string")
          : [];
        const message =
          errors.length > 0
            ? errors.join(" · ")
            : (payload?.message ?? "Có lỗi xảy ra, vui lòng thử lại");
        throw new ApiError(message, res.status, errors);
      }
      return payload.data as string;
    },
  },

  // Authenticated
  cart: {
    get: (token: string) => request<CartDto>("/api/Cart", { token }),
    add: (gameId: number, quantity: number, token: string) =>
      request<CartDto>("/api/Cart/items", {
        method: "POST",
        body: { gameId, quantity },
        token,
      }),
    update: (itemId: number, quantity: number, token: string) =>
      request<null>(`/api/Cart/items/${itemId}`, {
        method: "PUT",
        body: { quantity },
        token,
      }),
    remove: (itemId: number, token: string) =>
      request<null>(`/api/Cart/items/${itemId}`, {
        method: "DELETE",
        token,
      }),
    clear: (token: string) =>
      request<null>("/api/Cart", { method: "DELETE", token }),
  },

  wishlist: {
    get: (token: string) =>
      request<WishlistItemDto[]>("/api/Wishlist", { token }),
    add: (gameId: number, token: string) =>
      request<null>(`/api/Wishlist/${gameId}`, { method: "POST", token }),
    remove: (gameId: number, token: string) =>
      request<null>(`/api/Wishlist/${gameId}`, { method: "DELETE", token }),
    check: (gameId: number, token: string) =>
      request<{ isInWishlist: boolean }>(`/api/Wishlist/check/${gameId}`, { token }),
  },

  orders: {
    create: (
      data: {
        customerName: string;
        email: string;
        phone: string;
        address: string;
        paymentMethod: string;
      },
      token: string
    ) =>
      request<OrderDto>("/api/Orders", { method: "POST", body: data, token }),
    list: (token: string) => request<OrderDto[]>("/api/Orders", { token }),
    byId: (id: number, token: string) =>
      request<OrderDto>(`/api/Orders/${id}`, { token }),
  },

  // Admin
  admin: {
    dashboard: (token: string) =>
      request<DashboardDto>("/api/Admin/dashboard", { token }),
    users: (token: string) => request<UserDto[]>("/api/Admin/users", { token }),
    setUserStatus: (id: number, active: boolean, token: string) =>
      request<UserDto>(`/api/Admin/users/${id}/status`, {
        method: "PUT",
        query: { active },
        token,
      }),
    setUserRole: (id: number, role: string, token: string) =>
      request<null>(`/api/Admin/users/${id}/role`, {
        method: "PUT",
        body: { role },
        token,
      }),
    orders: (token: string) => request<OrderDto[]>("/api/Admin/orders", { token }),
    setOrderStatus: (id: number, status: string, token: string) =>
      request<null>(`/api/Admin/orders/${id}/status`, {
        method: "PUT",
        body: { status },
        token,
      }),
    developers: (token: string) =>
      request<DeveloperDto[]>("/api/Admin/developers", { token }),
    publishers: (token: string) =>
      request<PublisherDto[]>("/api/Admin/publishers", { token }),
    externalSearch: (q: string, limit = 10, token: string) =>
      request<unknown[]>("/api/Admin/external/search", {
        query: { q, limit },
        token,
      }),

    games: {
      create: (data: GameCreateRequest, token: string) =>
        request<GameDto>("/api/Games", { method: "POST", body: data, token }),
      update: (id: number, data: GameCreateRequest, token: string) =>
        request<GameDto>(`/api/Games/${id}`, { method: "PUT", body: data, token }),
      delete: (id: number, token: string) =>
        request<null>(`/api/Games/${id}`, { method: "DELETE", token }),
    },

    genres: {
      list: (token: string) => request<GenreDto[]>("/api/Games/genres", { token }),
      create: (name: string, token: string) =>
        request<GenreDto>("/api/Games/genres", { method: "POST", body: { name }, token }),
      delete: (id: number, token: string) =>
        request<null>(`/api/Games/genres/${id}`, { method: "DELETE", token }),
    },

    platforms: {
      list: (token: string) => request<PlatformDto[]>("/api/Games/platforms", { token }),
      create: (name: string, token: string) =>
        request<PlatformDto>("/api/Games/platforms", { method: "POST", body: { name }, token }),
      delete: (id: number, token: string) =>
        request<null>(`/api/Games/platforms/${id}`, { method: "DELETE", token }),
    },

    reviews: {
      list: (page: number, pageSize: number, token: string) =>
        request<PagedResult<ReviewDto>>("/api/Admin/reviews", {
          query: { page, pageSize },
          token,
        }),
      delete: (id: number, token: string) =>
        request<null>(`/api/Review/${id}`, { method: "DELETE", token }),
    },

    createDeveloper: (name: string, token: string) =>
      request<DeveloperDto>("/api/Admin/developers", { method: "POST", body: { name }, token }),
    deleteDeveloper: (id: number, token: string) =>
      request<null>(`/api/Admin/developers/${id}`, { method: "DELETE", token }),
    createPublisher: (name: string, token: string) =>
      request<PublisherDto>("/api/Admin/publishers", { method: "POST", body: { name }, token }),
    deletePublisher: (id: number, token: string) =>
      request<null>(`/api/Admin/publishers/${id}`, { method: "DELETE", token }),
  },
};

export function resolveAssetUrl(path?: string | null): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return `${API_URL}${path}`;
  return `${API_URL}/${path}`;
}
