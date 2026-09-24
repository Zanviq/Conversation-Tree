CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"root_message_id" uuid,
	"current_head_id" uuid,
	"last_modified" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" varchar(8) NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"attachments" jsonb,
	"parent_id" uuid,
	"children_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"connections" text[],
	"attached_track_ids" text[],
	"summary" text,
	"position" jsonb,
	"timestamp" bigint NOT NULL,
	CONSTRAINT "messages_conversation_id_id_pk" PRIMARY KEY("conversation_id","id")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"active_conversation_id" uuid,
	"chat_model" text,
	"label_model" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(32) NOT NULL,
	"display_name" varchar(64) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversations_user_id_idx" ON "conversations" USING btree ("user_id","created_at");