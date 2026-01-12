-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."food_item_type" AS ENUM('medium_pizza', 'large_pizza', 'small_pizza', 'drink_small', 'drink_1.5l', 'side', 'dessert', 'meltz', 'loaded_pizza_roll', 'pizza_roll', 'wings_6pcs');--> statement-breakpoint
CREATE TABLE "deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_name" text NOT NULL,
	"price_pkr" integer NOT NULL,
	"description" text,
	"satiety_score" integer,
	"satiety_tier" varchar(50) NOT NULL,
	"image_url" text,
	"product_url" text NOT NULL,
	"source" varchar(50) DEFAULT 'dominos'
);
--> statement-breakpoint
CREATE TABLE "deal_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer,
	"item" "food_item_type" NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"score" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"eater_type" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "deal_items" ADD CONSTRAINT "deal_items_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;
*/