CREATE TABLE "ab_tests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" varchar NOT NULL,
	"campaign_id" varchar,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"variant_a" jsonb,
	"variant_b" jsonb,
	"confidence_level" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_content_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" varchar NOT NULL,
	"campaign_id" varchar,
	"prompt" text NOT NULL,
	"generated_content" text NOT NULL,
	"content_type" text NOT NULL,
	"model" text DEFAULT 'gpt-4' NOT NULL,
	"tokens_used" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" varchar NOT NULL,
	"date" timestamp DEFAULT now(),
	"total_subscribers" integer DEFAULT 0,
	"engagement_rate" numeric(5, 2) DEFAULT '0',
	"churn_rate" numeric(5, 2) DEFAULT '0',
	"monthly_revenue" numeric(10, 2) DEFAULT '0',
	"revenue_growth" numeric(5, 2) DEFAULT '0',
	"open_rate" numeric(5, 2) DEFAULT '0',
	"click_rate" numeric(5, 2) DEFAULT '0',
	"unsubscribe_rate" numeric(5, 2) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" varchar NOT NULL,
	"name" text NOT NULL,
	"subject_line" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"open_rate" numeric(5, 2) DEFAULT '0',
	"click_rate" numeric(5, 2) DEFAULT '0',
	"revenue" numeric(10, 2) DEFAULT '0',
	"subscriber_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_integrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" varchar NOT NULL,
	"platform" text NOT NULL,
	"is_connected" boolean DEFAULT false,
	"access_token" text,
	"refresh_token" text,
	"instance_url" text,
	"last_sync" timestamp,
	"status" text DEFAULT 'inactive',
	"config" jsonb
);
--> statement-breakpoint
CREATE TABLE "email_integrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" varchar NOT NULL,
	"platform" text NOT NULL,
	"is_connected" boolean DEFAULT false,
	"api_key" text,
	"api_secret" text,
	"last_sync" timestamp,
	"campaigns_sent" integer DEFAULT 0,
	"status" text DEFAULT 'inactive',
	"config" jsonb
);
--> statement-breakpoint
CREATE TABLE "publishers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"domain" text,
	"subdomain" text NOT NULL,
	"plan" text DEFAULT 'starter' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"settings" jsonb,
	CONSTRAINT "publishers_email_unique" UNIQUE("email"),
	CONSTRAINT "publishers_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" varchar NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"segment" text NOT NULL,
	"engagement_score" numeric(5, 2) DEFAULT '0',
	"revenue" numeric(10, 2) DEFAULT '0',
	"joined_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"preferences" jsonb,
	"tags" text[]
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" varchar NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"last_login_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "ab_tests" ADD CONSTRAINT "ab_tests_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ab_tests" ADD CONSTRAINT "ab_tests_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_content_history" ADD CONSTRAINT "ai_content_history_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_content_history" ADD CONSTRAINT "ai_content_history_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_integrations" ADD CONSTRAINT "crm_integrations_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_integrations" ADD CONSTRAINT "email_integrations_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;