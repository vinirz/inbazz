CREATE TYPE "public"."status" AS ENUM('created', 'processing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "customer" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"deleted_at" date,
	CONSTRAINT "customer_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text,
	"amount" text NOT NULL,
	"status" "status" DEFAULT 'created' NOT NULL,
	"currency" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orderProducts" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text,
	"product_id" text,
	"quantity" text NOT NULL,
	"unit_price" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"sku" varchar(255) NOT NULL,
	"description" varchar(255) NOT NULL,
	"price" text NOT NULL,
	"stock_quantity" text NOT NULL,
	"deleted_at" date,
	CONSTRAINT "product_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderProducts" ADD CONSTRAINT "orderProducts_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderProducts" ADD CONSTRAINT "orderProducts_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;