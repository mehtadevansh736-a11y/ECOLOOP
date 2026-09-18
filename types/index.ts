export type Category = 
  | 'Plastic'
  | 'Paper'
  | 'Glass'
  | 'Metal'
  | 'Textile'
  | 'Electronics'
  | 'Furniture'
  | 'Organic'
  | 'Mixed'
  | 'Other';

export type CircularAction = 
  | 'Reuse'
  | 'Repair'
  | 'Donate'
  | 'Resell'
  | 'Recycle'
  | 'Dispose';

export interface AIScanResult {
  item_name: string;
  category: Category;
  material: string;
  condition: string;
  reusable: boolean;
  repairable: boolean;
  recyclable: boolean;
  recommended_action: CircularAction;
  circularity_score: number;
  confidence: number;
  reason: string;
  co2_estimate: number;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  eco_points: number;
  co2_saved: number;
  items_diverted: number;
  items_reused: number;
  items_recycled: number;
  items_donated: number;
  created_at: string;
}

export interface ScanItem extends AIScanResult {
  id: string;
  user_id?: string;
  image_url: string;
  created_at: string;
}

export type ListingStatus = 'active' | 'reserved' | 'sold' | 'donated' | 'completed' | 'archived' | 'available' | 'requested';
export type ListingType = 'Sell' | 'Donate';

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: Category;
  condition: string;
  material?: string;
  price: number;
  image_url: string;
  location: string;
  listing_type?: ListingType;
  status: ListingStatus;
  created_at: string;
  user_profile?: Partial<Profile>;
}

export interface ListingRequest {
  id: string;
  listing_id: string;
  requester_id: string;
  seller_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
}

export interface CircularCenter {
  id: string;
  name: string;
  type: 'Recycling' | 'Repair' | 'Donation' | 'E-waste';
  address: string;
  latitude: number;
  longitude: number;
  accepted_materials: string[];
  phone?: string;
  distance_km?: number;
  hours?: string;
  website?: string;
  googleMapsUri?: string;
  isRealGooglePlace?: boolean;
  business_status?: string;
}

export interface Activity {
  id: string;
  user_id: string;
  scan_id?: string;
  activity_type: CircularAction;
  points: number;
  co2_saved: number;
  created_at: string;
  item_name?: string;
}
