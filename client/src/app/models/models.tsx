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
  score: number;
}

export interface PizzaDeal {
  deal_name: string;
  price_pkr: number;
  description: string;
  satiety_score: number;
  items_breakdown: ItemBreakdown[];
  satiety_tier: "Snack / Light" | "Standard Meal" | "Heavy Meal (Sharing)"; 
  image_url: string | null;
  product_url: string,
  source: string;
}

// Since your data is a list:
export type PizzaDealsResponse = PizzaDeal[];