CREATE TABLE "api_usage_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" varchar,
	"api_provider" text NOT NULL,
	"endpoint" text NOT NULL,
	"request_count" integer DEFAULT 1,
	"response_time" integer,
	"status" text,
	"error_message" text,
	"date" date DEFAULT now(),
	"hour" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "behavioral_events_enhanced" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_id" varchar NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb,
	"content_id" varchar,
	"session_id" varchar,
	"market_context" jsonb,
	"timestamp" timestamp DEFAULT now(),
	"ip_address" "inet",
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "content_market_context" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_template_id" varchar NOT NULL,
	"market_conditions" jsonb,
	"relevant_news" text[],
	"market_data_references" jsonb,
	"sentiment_context" text,
	"timing_relevance" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_templates_enhanced" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" varchar NOT NULL,
	"title" text NOT NULL,
	"content_type" text NOT NULL,
	"base_content" jsonb NOT NULL,
	"personalization_markers" jsonb,
	"market_triggers" jsonb,
	"metadata" jsonb,
	"status" text DEFAULT 'draft',
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "content_variations_enhanced" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"subscriber_segment" text,
	"personalized_content" jsonb NOT NULL,
	"personalization_strategy" jsonb,
	"market_context" jsonb,
	"performance_score" numeric(5, 2),
	"engagement_prediction" numeric(5, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "market_data" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar NOT NULL,
	"data_type" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"data" jsonb NOT NULL,
	"source" text DEFAULT 'polygon',
	"cached_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "market_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"symbol" varchar,
	"event_date" date,
	"event_data" jsonb,
	"impact_score" numeric(3, 2),
	"news_references" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "market_intelligence_cache" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" varchar NOT NULL,
	"data_type" text NOT NULL,
	"data" jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "market_intelligence_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "market_news" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"news_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text,
	"image_url" text,
	"published_at" timestamp NOT NULL,
	"source" text,
	"entities" jsonb,
	"sentiment_score" numeric(3, 2),
	"categories" text[],
	"symbols" text[],
	"relevance_score" numeric(3, 2),
	"cached_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	CONSTRAINT "market_news_news_id_unique" UNIQUE("news_id")
);
--> statement-breakpoint
CREATE TABLE "subscriber_market_interests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_id" varchar NOT NULL,
	"symbols" text[],
	"sectors" text[],
	"news_categories" text[],
	"sentiment_preference" text,
	"market_timing_preference" text,
	"volatility_tolerance" text,
	"portfolio_value" text,
	"trading_experience" text,
	"investment_goals" text[],
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "api_usage_tracking" ADD CONSTRAINT "api_usage_tracking_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "behavioral_events_enhanced" ADD CONSTRAINT "behavioral_events_enhanced_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_market_context" ADD CONSTRAINT "content_market_context_content_template_id_content_templates_enhanced_id_fk" FOREIGN KEY ("content_template_id") REFERENCES "public"."content_templates_enhanced"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_templates_enhanced" ADD CONSTRAINT "content_templates_enhanced_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_templates_enhanced" ADD CONSTRAINT "content_templates_enhanced_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_variations_enhanced" ADD CONSTRAINT "content_variations_enhanced_template_id_content_templates_enhanced_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."content_templates_enhanced"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber_market_interests" ADD CONSTRAINT "subscriber_market_interests_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;