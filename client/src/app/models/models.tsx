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
  id: number;
  dealName: string;
  pricePkr: number;
  description: string;
  satietyScore: number;
  items_breakdown: ItemBreakdown[];
  satietyTier: "Snack / Light" | "Standard Meal" | "Heavy Meal (Sharing)"; 
  imageUrl: string | null;
  productUrl: string;
  source: string;
}

// Since your data is a list:
export type PizzaDealsResponse = PizzaDeal[];