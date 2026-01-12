import { relations } from "drizzle-orm/relations";
import { deals, dealItems } from "./schema";

export const dealItemsRelations = relations(dealItems, ({one}) => ({
	deal: one(deals, {
		fields: [dealItems.dealId],
		references: [deals.id]
	}),
}));

export const dealsRelations = relations(deals, ({many}) => ({
	dealItems: many(dealItems),
}));