import { pgTable, serial, text, integer, varchar, foreignKey, timestamp, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const foodItemType = pgEnum("food_item_type", ['medium_pizza', 'large_pizza', 'small_pizza', 'drink_small', 'drink_1.5l', 'side', 'dessert', 'meltz', 'loaded_pizza_roll', 'pizza_roll', 'wings_6pcs'])


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
});

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

export const profiles = pgTable("profiles", {
	id: text().primaryKey().notNull(),
	eaterType: text("eater_type"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});
