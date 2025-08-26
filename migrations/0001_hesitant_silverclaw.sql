CREATE TABLE "assignments" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"publisher_id" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"priority" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"due_date" timestamp NOT NULL,
	"assignment_link" varchar(500),
	"copywriter_id" varchar(255),
	"market_context" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_email_versions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"campaign_id" varchar(255) NOT NULL,
	"segment_id" varchar(255) NOT NULL,
	"segment_name" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"preview_text" varchar(500),
	"personalization_level" varchar(50) DEFAULT 'high',
	"status" varchar(50) DEFAULT 'generated',
	"generated_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"estimated_open_rate" numeric(5, 2),
	"estimated_click_rate" numeric(5, 2)
);
--> statement-breakpoint
CREATE TABLE "campaign_projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"target_audience" jsonb,
	"timeline" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"assignment_id" varchar(255),
	"publisher_id" varchar(255) NOT NULL,
	"subject" varchar(500),
	"content" text,
	"segments" jsonb,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"feedback" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"publisher_id" varchar NOT NULL,
	"assignee_email" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"content" text,
	"feedback" text,
	"market_triggers" jsonb,
	"due_date" timestamp,
	"submitted_at" timestamp,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_metrics" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"publisher_id" varchar(255) NOT NULL,
	"campaign_id" varchar(255),
	"pixel_id" varchar(255),
	"sent" integer DEFAULT 0,
	"delivered" integer DEFAULT 0,
	"opened" integer DEFAULT 0,
	"clicked" integer DEFAULT 0,
	"converted" integer DEFAULT 0,
	"revenue" numeric(10, 2) DEFAULT '0',
	"date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_send_queue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" varchar NOT NULL,
	"campaign_id" varchar,
	"email_type" text NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 0,
	"retry_count" integer DEFAULT 0,
	"last_attempt" timestamp,
	"sent_at" timestamp,
	"error" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pixel_tracking" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"publisher_id" varchar(255) NOT NULL,
	"campaign_id" varchar(255),
	"segment_name" varchar(255),
	"recipient_count" integer,
	"tracking_url" varchar(500),
	"opens" integer DEFAULT 0,
	"last_opened" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "send_queue" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"publisher_id" varchar(255) NOT NULL,
	"assignment_id" varchar(255),
	"segment_id" varchar(255),
	"segment_name" varchar(255),
	"subject" varchar(500),
	"content" text,
	"recipients" integer,
	"pixel_id" varchar(255),
	"platform" varchar(50),
	"scheduled_time" timestamp,
	"status" varchar(50) NOT NULL,
	"sent_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "campaign_projects" ADD CONSTRAINT "campaign_projects_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_assignments" ADD CONSTRAINT "email_assignments_project_id_campaign_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."campaign_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_assignments" ADD CONSTRAINT "email_assignments_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_send_queue" ADD CONSTRAINT "email_send_queue_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;