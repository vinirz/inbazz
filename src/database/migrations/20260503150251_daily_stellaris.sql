ALTER TABLE "order" ALTER COLUMN "amount" SET DATA TYPE integer USING amount::integer;--> statement-breakpoint
ALTER TABLE "orderProducts" ALTER COLUMN "quantity" SET DATA TYPE integer USING quantity::integer;--> statement-breakpoint
ALTER TABLE "orderProducts" ALTER COLUMN "unit_price" SET DATA TYPE integer USING unit_price::integer;--> statement-breakpoint
ALTER TABLE "order" DROP COLUMN "currency";