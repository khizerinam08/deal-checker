import { pgTable, foreignKey, serial, integer, text, varchar, real, timestamp, uuid, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const foodItemType = pgEnum("food_item_type", ['medium_pizza', 'large_pizza', 'small_pizza', 'drink_small', 'drink_1.5l', 'side', 'dessert', 'meltz', 'loaded_pizza_roll', 'pizza_roll', 'wings_6pcs'])
export const voterType = pgEnum("voter_type", ['Small', 'Medium', 'Large'])


export const dealItems = pgTable("deal_items", {
	id: serial().primaryKey().notNull(),
	dealId: integer("deal_id"),
	item: foodItemType().notNull(),
	qty: integer().default(1).notNull(),
	score: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.dealId],
			foreignColumns: [deals.id],
			name: "deal_items_deal_id_deals_id_fk"
		}).onDelete("cascade"),
]);

export const deals = pgTable("deals", {
	id: serial().primaryKey().notNull(),
	dealName: text("deal_name").notNull(),
	pricePkr: integer("price_pkr").notNull(),
	description: text(),
	satietyScore: integer("satiety_score"),
	satietyTier: varchar("satiety_tier", { length: 50 }).notNull(),
	imageUrl: text("image_url"),
	productUrl: text("product_url").notNull(),
	source: varchar({ length: 50 }).default('dominos'),
	baseValueScore: real("base_value_score").default(0),
	multiplierLight: real("multiplier_light").default(1),
	multiplierMedium: real("multiplier_medium").default(1),
	multiplierHeavy: real("multiplier_heavy").default(1),
});

export const profiles = pgTable("profiles", {
	id: text().primaryKey().notNull(),
	eaterType: voterType("eater_type"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const votes = pgTable("votes", {
	voteId: uuid("vote_id").defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	dealId: integer("deal_id").notNull(),
	voterType: voterType("voter_type").notNull(),
	valueRating: numeric("value_rating", { precision: 3, scale:  1 }).notNull(),
	satietyRating: numeric("satiety_rating", { precision: 3, scale:  1 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.dealId],
			foreignColumns: [deals.id],
			name: "votes_deal_id_fkey"
		}),
]);
