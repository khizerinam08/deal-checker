type FoodItemType =
  | 'medium_pizza'
  | 'large_pizza'
  | 'small_pizza'
  | 'drink_small'
  | 'drink_1.5l'
  | 'side'
  | 'dessert'
  | 'meltz'
  | 'loaded_pizza_roll'
  | 'pizza_roll'
  | 'wings_6pcs';

export interface ItemBreakdown {
  item: FoodItemType; // Now it MUST be one of the names above
  qty: number;
}

export interface PizzaDeal {
  id: number;
  dealName: string;
  pricePkr: number;
  description: string;
  items_breakdown: ItemBreakdown[];
  imageUrl: string | null;
  productUrl: string;
  source: string;
  personalizedScore?: number;  // Calculated based on user's eater type
  reviewCount?: number;        // Total number of reviews for this deal
}

// Since your data is a list:
export type PizzaDealsResponse = PizzaDeal[];