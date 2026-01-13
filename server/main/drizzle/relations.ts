import { relations } from "drizzle-orm/relations";
import { deals, dealItems, votes } from "./schema";

export const dealItemsRelations = relations(dealItems, ({one}) => ({
	deal: one(deals, {
		fields: [dealItems.dealId],
		references: [deals.id]
	}),
}));

export const dealsRelations = relations(deals, ({many}) => ({
	dealItems: many(dealItems),
	votes: many(votes),
}));

export const votesRelations = relations(votes, ({one}) => ({
	deal: one(deals, {
		fields: [votes.dealId],
		references: [deals.id]
	}),
}));