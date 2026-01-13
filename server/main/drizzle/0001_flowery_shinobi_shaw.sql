CREATE TYPE "public"."voter_type" AS ENUM('Small', 'Medium', 'Large');--> statement-breakpoint
CREATE TABLE "votes" (
	"vote_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"deal_id" integer NOT NULL,
	"voter_type" "voter_type" NOT NULL,
	"value_rating" numeric(3, 1) NOT NULL,
	"satiety_rating" numeric(3, 1) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "eater_type" SET DATA TYPE "public"."voter_type" USING "eater_type"::"public"."voter_type";--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "base_value_score" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "multiplier_light" real DEFAULT 1;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "multiplier_medium" real DEFAULT 1;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "multiplier_heavy" real DEFAULT 1;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;