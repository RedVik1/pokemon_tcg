export interface Card {
  id?: string | number;
  pokemon_tcg_id?: string;
  name: string;
  set_name: string;
  rarity?: string;
  price?: number | string;
  image_url?: string;
  history?: Record<string, number[]>;
  user_id?: string;
}

export interface CollectionItem {
  id: string | number;
  card: Card;
  quantity?: number;
  instance_ids?: (string | number)[];
  condition?: string;
}

export interface PortfolioStats {
  total_portfolio_value: number;
  total_cards: number;
  most_valuable_card?: Card;
}

export interface MarketMover {
  card: Card;
  computedStat?: { isUp: boolean; percent: string };
  image_url?: string;
  name: string;
  set_name?: string;
}

export interface ChartPoint {
  name: string;
  price: number;
}

export interface ChartResult {
  data: ChartPoint[];
  percent: string;
  isUp: boolean;
  isEstimated: boolean;
}

export interface PortfolioDistribution {
  name: string;
  value: number;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}

export type RarityFilter = 'All' | string;
export type SortOption = 'Newest' | 'Price: High to Low' | 'Price: Low to High' | 'Name: A-Z';
export type Timeframe = '1W' | '1M' | '1Y';
export type Grade = 'Raw' | 'PSA 9' | 'PSA 10';
export type TabType = 'explore' | 'portfolio';
