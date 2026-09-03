export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[];
}

export interface ApiError {
  success: false;
  message: string;
  errors: string[];
}

export interface LoginResponse {
  id: number;
  token: string;
  userName: string;
  email: string;
  fullName: string;
  role: string;
  expiresAt: string;
}

export interface UserDto {
  id: number;
  userName: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface GenreDto {
  id: number;
  name: string;
  slug: string;
}

export interface PlatformDto {
  id: number;
  name: string;
  slug: string;
}

export interface GameDto {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  rating: number;
  ratingCount: number;
  releaseDate: string | null;
  coverImage: string;
  trailerUrl: string;
  systemRequirements: string;
  isActive: boolean;
  salesCount: number;
  finalPrice: number;
  discountPercent: number;
  genres: string[];
  platforms: string[];
  developers: string[];
  publishers: string[];
  images: string[];
}

export interface PagedResult<T> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: T[];
}

export interface GameListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  genre?: string;
  platform?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  minRating?: number;
}

export interface CartItemDto {
  id: number;
  gameId: number;
  gameTitle: string;
  coverImage: string;
  quantity: number;
  unitPrice: number;
  discountPrice: number | null;
  lineTotal: number;
}

export interface CartDto {
  id: number;
  items: CartItemDto[];
  subtotal: number;
  totalDiscount: number;
  total: number;
}

export interface WishlistItemDto {
  gameId: number;
  title: string;
  coverImage: string;
  price: number;
  discountPrice: number | null;
  rating: number;
  addedAt: string;
}

export interface OrderItemDto {
  gameId: number;
  gameTitle: string;
  coverImage: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface OrderDto {
  id: number;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
  items: OrderItemDto[];
}

export interface ReviewDto {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string | null;
  userId: number;
  userName: string;
  gameId: number;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<string, number>;
}

export interface ReviewsResponse {
  items: ReviewDto[];
  stats: ReviewStats;
}

export interface DashboardDto {
  totalUsers: number;
  totalGames: number;
  totalOrders: number;
  totalRevenue: number;
  previousRevenue: number;
  averageOrderValue: number;
  recentSales: { label: string; revenue: number; orders: number }[];
  popularGames: { title: string; sales: number }[];
  recentOrders: {
    id: number;
    orderNumber: string;
    customerName: string;
    userName: string;
    total: number;
    status: string;
    createdAt: string;
    items: { gameTitle: string; quantity: number }[];
  }[];
}

export interface DeveloperDto {
  id: number;
  name: string;
}

export interface PublisherDto {
  id: number;
  name: string;
}

export interface RawgGameInfo {
  id: number;
  name: string;
  description: string;
  backgroundImage: string;
  released: string | null;
  rating: number | null;
  genres: string[];
  platforms: string[];
  developers: string[];
  publishers: string[];
  screenshots: string[];
}

export interface GameCreateRequest {
  title: string;
  description: string;
  price: number;
  discountPrice: number | null;
  releaseDate: string | null;
  coverImage: string;
  trailerUrl: string;
  systemRequirements: string;
  genreIds: number[];
  platformIds: number[];
  developerIds: number[];
  publisherIds: number[];
  images: string[];
}

export interface RegisterData {
  userName: string;
  email: string;
  password: string;
  fullName: string;
}
