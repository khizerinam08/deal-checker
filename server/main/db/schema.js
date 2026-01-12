import { pgTable, serial, text, integer, varchar, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// USER PROFILES
// ============================================================
// This table stores extended user profile data. The `id` column
// will hold the user ID from Neon Auth (or any auth provider).
// 
// Note: We're not using a foreign key to neon_auth.users_sync
// because that schema is only created when you enable Neon Auth
// in your Neon Console. The referential integrity is handled
// at the application level.
// ============================================================
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(), // Will store auth user ID
  eaterType: text("eater_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 1. Define the SQL Enum for Food Items
export const foodItemEnum = pgEnum('food_item_type', [
  'medium_pizza', 'large_pizza', 'small_pizza', 'drink_small', 
  'drink_1.5l', 'side', 'dessert', 'meltz', 
  'loaded_pizza_roll', 'pizza_roll', 'wings_6pcs'
]);

// 2. Main Deals Table
export const deals = pgTable('deals', {
  id: serial('id').primaryKey(),
  dealName: text('deal_name').notNull(),
  pricePkr: integer('price_pkr').notNull(),
  description: text('description'),
  satietyScore: integer('satiety_score'),
  satietyTier: varchar('satiety_tier', { length: 50 }).notNull(), // Snack, Standard, Heavy
  imageUrl: text('image_url'),
  productUrl: text('product_url').notNull(),
  source: varchar('source', { length: 50 }).default('dominos'),
});

// 3. Items Breakdown Table (The "Many" in One-to-Many)
export const dealItems = pgTable('deal_items', {
  id: serial('id').primaryKey(),
  dealId: integer('deal_id').references(() => deals.id, { onDelete: 'cascade' }),
  item: foodItemEnum('item').notNull(),
  qty: integer('qty').notNull().default(1),
  score: integer('score').notNull(),
});

// 4. Define Relations (Optional but helpful for queries)
export const dealsRelations = relations(deals, ({ many }) => ({
  items_breakdown: many(dealItems),
}));

export const dealItemsRelations = relations(dealItems, ({ one }) => ({
  deal: one(deals, {
    fields: [dealItems.dealId],
    references: [deals.id],
  }),
}));