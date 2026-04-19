export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  badge?: string;
  unit: string;
}

export interface Activity {
  id: string;
  title: string;
  points: string;
  time: string;
  amount: string;
  type: 'gain' | 'spent';
  icon: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  balance: number;
  activeCoupons: number;
}
