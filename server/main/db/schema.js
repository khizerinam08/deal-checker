import { pgTable, serial, text, uuid, integer, real, numeric, varchar, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';


export const voterTypeEnum = pgEnum("voter_type", [
  "Small",
  "Medium",
  "Large",
]);

export const votes = pgTable("votes", {
  voteId: uuid("vote_id")
    .defaultRandom()
    .primaryKey(),

  userId: uuid("user_id")
    .notNull(),

  dealId: integer("deal_id")
    .notNull()
    .references(() => deals.id),

  voterType: voterTypeEnum("voter_type")
    .notNull(),

  /**
   * Fixed domain values.
   * numeric(3,1) safely represents 2.0, 6.0, 10.0
   * Do NOT use float.
   */
  valueRating: numeric("value_rating", {
    precision: 3,
    scale: 1,
  }).notNull(),

  /**
   * Multipliers must be exact.
   * numeric avoids IEEE rounding bugs.
   */
  satietyRating: numeric("satiety_rating", {
    precision: 3,
    scale: 1,
  }).notNull(),

  /**
   * Append-only auditability.
   */
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(), // Will store auth user ID
  eaterType: voterTypeEnum("eater_type"),
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

  // The average of all "Was it worth it?" votes (Scale 0-10)
  baseValueScore: real('base_value_score').default(0),

  // The average "How full are you?" multipliers for each group
  multiplierLight: real('multiplier_light').default(1.0),   // Default 1.0 (Perfect fit)
  multiplierMedium: real('multiplier_medium').default(1.0),
  multiplierHeavy: real('multiplier_heavy').default(1.0),

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