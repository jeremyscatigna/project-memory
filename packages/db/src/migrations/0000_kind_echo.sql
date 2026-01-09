CREATE TYPE "public"."audit_log_level" AS ENUM('info', 'warning', 'error', 'critical');--> statement-breakpoint
CREATE TYPE "public"."credit_transaction_type" AS ENUM('purchase', 'subscription', 'consumption', 'refund', 'trial', 'bonus', 'adjustment', 'expiration');--> statement-breakpoint
CREATE TYPE "public"."trial_status" AS ENUM('active', 'expired', 'converted');--> statement-breakpoint
CREATE TYPE "public"."email_account_provider" AS ENUM('gmail', 'outlook');--> statement-breakpoint
CREATE TYPE "public"."email_account_status" AS ENUM('active', 'expired', 'revoked', 'syncing', 'error');--> statement-breakpoint
CREATE TYPE "public"."email_participant_role" AS ENUM('from', 'to', 'cc', 'bcc');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'canceled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."organization_plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."claim_type" AS ENUM('fact', 'promise', 'request', 'question', 'decision', 'opinion', 'deadline', 'price', 'contact_info', 'reference', 'action_item');--> statement-breakpoint
CREATE TYPE "public"."commitment_direction" AS ENUM('owed_by_me', 'owed_to_me');--> statement-breakpoint
CREATE TYPE "public"."commitment_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."commitment_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled', 'overdue', 'waiting', 'snoozed');--> statement-breakpoint
CREATE TYPE "public"."embedding_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."thread_embedding_aggregation" AS ENUM('mean', 'first', 'weighted', 'max_pool', 'cls');--> statement-breakpoint
CREATE TYPE "public"."evidence_link_source_type" AS ENUM('claim', 'commitment', 'decision', 'contact', 'topic');--> statement-breakpoint
CREATE TYPE "public"."evidence_link_target_type" AS ENUM('message', 'thread', 'attachment', 'external_url');--> statement-breakpoint
CREATE TYPE "public"."processing_job_status" AS ENUM('pending', 'queued', 'running', 'completed', 'failed', 'cancelled', 'retrying');--> statement-breakpoint
CREATE TYPE "public"."processing_job_type" AS ENUM('sync', 'backfill', 'incremental_sync', 'thread_analysis', 'message_analysis', 'embedding_generation', 'claim_extraction', 'commitment_extraction', 'decision_extraction', 'relationship_analysis', 'risk_analysis', 'policy_check', 'draft_generation', 'consistency_check');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"user_id" text,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"level" "audit_log_level" DEFAULT 'info' NOT NULL,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"scopes" text[],
	"rate_limit" text DEFAULT '100/minute',
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_export_request" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"download_url" text,
	"expires_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flag" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"percentage" text DEFAULT '0',
	"allowed_users" text[],
	"allowed_organizations" text[],
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flag_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "file_upload" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"key" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" text NOT NULL,
	"category" text DEFAULT 'general',
	"is_public" boolean DEFAULT false NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "file_upload_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"read" boolean DEFAULT false NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	"active_team_id" text,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"secret" text,
	"backup_codes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"two_factor_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"events" text[] NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"failure_count" text DEFAULT '0',
	"last_triggered_at" timestamp,
	"last_success_at" timestamp,
	"last_failure_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_delivery" (
	"id" text PRIMARY KEY NOT NULL,
	"webhook_id" text NOT NULL,
	"event" text NOT NULL,
	"payload" text NOT NULL,
	"status_code" text,
	"response_body" text,
	"duration" text,
	"success" boolean DEFAULT false NOT NULL,
	"attempts" text DEFAULT '1',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_package" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"credits" integer NOT NULL,
	"bonus_credits" integer DEFAULT 0 NOT NULL,
	"price_in_cents" integer NOT NULL,
	"polar_product_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_package_polar_product_id_unique" UNIQUE("polar_product_id")
);
--> statement-breakpoint
CREATE TABLE "credit_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"type" "credit_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"description" text,
	"reference_id" text,
	"reference_type" text,
	"tokens_used" integer,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"model" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"lifetime_credits" integer DEFAULT 0 NOT NULL,
	"lifetime_used" integer DEFAULT 0 NOT NULL,
	"trial_status" "trial_status" DEFAULT 'active' NOT NULL,
	"trial_started_at" timestamp,
	"trial_ends_at" timestamp,
	"trial_credits_granted" integer DEFAULT 0 NOT NULL,
	"monthly_allocation_date" timestamp,
	"last_low_balance_notification" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_credits_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "email_account" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"added_by_user_id" text NOT NULL,
	"provider" "email_account_provider" NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expires_at" timestamp NOT NULL,
	"sync_cursor" text,
	"last_sync_at" timestamp,
	"last_sync_status" text,
	"last_sync_error" text,
	"status" "email_account_status" DEFAULT 'active' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"settings" jsonb DEFAULT '{"syncEnabled":true,"syncFrequencyMinutes":5,"backfillDays":90}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_account_org_email_unique" UNIQUE("organization_id","email")
);
--> statement-breakpoint
CREATE TABLE "email_attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"provider_attachment_id" text,
	"filename" text NOT NULL,
	"mime_type" text,
	"size_bytes" integer,
	"content_id" text,
	"is_inline" boolean DEFAULT false NOT NULL,
	"storage_key" text,
	"downloaded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_message" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"provider_message_id" text NOT NULL,
	"in_reply_to" text,
	"references" text[],
	"from_email" text NOT NULL,
	"from_name" text,
	"to_recipients" jsonb DEFAULT '[]'::jsonb,
	"cc_recipients" jsonb DEFAULT '[]'::jsonb,
	"bcc_recipients" jsonb DEFAULT '[]'::jsonb,
	"subject" text,
	"body_text" text,
	"body_html" text,
	"snippet" text,
	"sent_at" timestamp,
	"received_at" timestamp,
	"headers" jsonb,
	"label_ids" text[],
	"size_bytes" integer,
	"message_index" integer DEFAULT 0 NOT NULL,
	"is_from_user" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_message_provider_unique" UNIQUE("thread_id","provider_message_id")
);
--> statement-breakpoint
CREATE TABLE "email_participant" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"contact_id" text,
	"email" text NOT NULL,
	"display_name" text,
	"role" "email_participant_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_thread" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_thread_id" text NOT NULL,
	"subject" text,
	"snippet" text,
	"participant_emails" text[],
	"message_count" integer DEFAULT 0 NOT NULL,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"first_message_at" timestamp,
	"last_message_at" timestamp,
	"labels" text[],
	"is_read" boolean DEFAULT false NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_draft" boolean DEFAULT false NOT NULL,
	"is_trashed" boolean DEFAULT false NOT NULL,
	"brief_summary" text,
	"intent_classification" text,
	"urgency_score" real,
	"importance_score" real,
	"sentiment_score" real,
	"has_open_loops" boolean DEFAULT false,
	"open_loop_count" integer DEFAULT 0,
	"suggested_action" text,
	"suggested_action_reason" text,
	"priority_tier" text,
	"last_analyzed_at" timestamp,
	"analysis_version" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_thread_provider_unique" UNIQUE("account_id","provider_thread_id")
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"inviter_id" text NOT NULL,
	"team_id" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"plan" "organization_plan" DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"thread_id" text,
	"message_id" text,
	"type" "claim_type" NOT NULL,
	"text" text NOT NULL,
	"normalized_text" text,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"source_message_ids" text[] DEFAULT '{}' NOT NULL,
	"quoted_text" text,
	"quoted_text_start" integer,
	"quoted_text_end" integer,
	"extracted_at" timestamp DEFAULT now() NOT NULL,
	"extraction_model" text,
	"extraction_version" text,
	"is_user_verified" boolean DEFAULT false,
	"is_user_dismissed" boolean DEFAULT false,
	"user_corrected_text" text,
	"user_corrected_type" "claim_type",
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commitment" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"claim_id" text,
	"debtor_contact_id" text,
	"creditor_contact_id" text,
	"direction" "commitment_direction" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp,
	"due_date_confidence" real,
	"due_date_source" text,
	"due_date_original_text" text,
	"status" "commitment_status" DEFAULT 'pending' NOT NULL,
	"priority" "commitment_priority" DEFAULT 'medium' NOT NULL,
	"completed_at" timestamp,
	"completed_via" text,
	"snoozed_until" timestamp,
	"last_reminder_at" timestamp,
	"reminder_count" integer DEFAULT 0 NOT NULL,
	"next_reminder_at" timestamp,
	"source_thread_id" text,
	"source_message_id" text,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"is_user_verified" boolean DEFAULT false,
	"is_user_dismissed" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"primary_email" text NOT NULL,
	"emails" text[] DEFAULT '{}',
	"display_name" text,
	"first_name" text,
	"last_name" text,
	"company" text,
	"title" text,
	"department" text,
	"phone" text,
	"linkedin_url" text,
	"avatar_url" text,
	"first_interaction_at" timestamp,
	"last_interaction_at" timestamp,
	"total_threads" integer DEFAULT 0 NOT NULL,
	"total_messages" integer DEFAULT 0 NOT NULL,
	"messages_sent" integer DEFAULT 0 NOT NULL,
	"messages_received" integer DEFAULT 0 NOT NULL,
	"avg_response_time_minutes" integer,
	"response_rate" real,
	"avg_words_per_message" integer,
	"sentiment_score" real,
	"importance_score" real,
	"health_score" real,
	"engagement_score" real,
	"is_vip" boolean DEFAULT false,
	"is_at_risk" boolean DEFAULT false,
	"is_internal" boolean DEFAULT false,
	"risk_reason" text,
	"days_since_last_contact" integer,
	"tags" text[] DEFAULT '{}',
	"notes" text,
	"user_override_vip" boolean,
	"last_enriched_at" timestamp,
	"enrichment_source" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contact_org_email_unique" UNIQUE("organization_id","primary_email")
);
--> statement-breakpoint
CREATE TABLE "decision" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"claim_id" text,
	"title" text NOT NULL,
	"statement" text NOT NULL,
	"rationale" text,
	"alternatives" jsonb,
	"owner_contact_ids" text[] DEFAULT '{}',
	"participant_contact_ids" text[] DEFAULT '{}',
	"decided_at" timestamp NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"superseded_by_id" text,
	"superseded_at" timestamp,
	"supersedes" text,
	"source_thread_id" text,
	"source_message_ids" text[] DEFAULT '{}',
	"topic_ids" text[] DEFAULT '{}',
	"is_user_verified" boolean DEFAULT false,
	"is_user_dismissed" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread_topic" (
	"thread_id" text NOT NULL,
	"topic_id" text NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "thread_topic_thread_id_topic_id_pk" PRIMARY KEY("thread_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "topic" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"parent_id" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"thread_count" integer DEFAULT 0 NOT NULL,
	"claim_count" integer DEFAULT 0 NOT NULL,
	"decision_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"is_user_created" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "topic_org_slug_unique" UNIQUE("organization_id","slug")
);
--> statement-breakpoint
CREATE TABLE "claim_embedding" (
	"id" text PRIMARY KEY NOT NULL,
	"claim_id" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"model" text NOT NULL,
	"model_version" text,
	"token_count" integer,
	"input_hash" text,
	"status" "embedding_status" DEFAULT 'completed',
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "claim_embedding_claim_id_unique" UNIQUE("claim_id")
);
--> statement-breakpoint
CREATE TABLE "message_embedding" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"model" text NOT NULL,
	"model_version" text,
	"token_count" integer,
	"input_hash" text,
	"status" "embedding_status" DEFAULT 'completed',
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "message_embedding_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "query_embedding_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"query_hash" text NOT NULL,
	"query_text" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"model" text NOT NULL,
	"hit_count" integer DEFAULT 1 NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "query_embedding_cache_query_hash_unique" UNIQUE("query_hash")
);
--> statement-breakpoint
CREATE TABLE "thread_embedding" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"aggregation_method" "thread_embedding_aggregation" DEFAULT 'mean' NOT NULL,
	"model" text NOT NULL,
	"model_version" text,
	"message_count" integer NOT NULL,
	"total_tokens" integer,
	"input_hash" text,
	"status" "embedding_status" DEFAULT 'completed',
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "thread_embedding_thread_id_unique" UNIQUE("thread_id")
);
--> statement-breakpoint
CREATE TABLE "evidence_link" (
	"id" text PRIMARY KEY NOT NULL,
	"source_type" "evidence_link_source_type" NOT NULL,
	"source_id" text NOT NULL,
	"target_type" "evidence_link_target_type" NOT NULL,
	"target_id" text NOT NULL,
	"quoted_text" text,
	"start_offset" integer,
	"end_offset" integer,
	"context_before" text,
	"context_after" text,
	"confidence" real DEFAULT 1 NOT NULL,
	"relevance_score" real,
	"is_primary" boolean DEFAULT false NOT NULL,
	"evidence_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processing_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text,
	"action" text NOT NULL,
	"step" text,
	"model" text NOT NULL,
	"provider" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"cost_cents" integer,
	"latency_ms" integer,
	"input_preview" text,
	"output_preview" text,
	"confidence" real,
	"items_extracted" integer,
	"success" boolean DEFAULT true NOT NULL,
	"error_type" text,
	"error_message" text,
	"rate_limit_remaining" integer,
	"rate_limit_reset" timestamp,
	"provider_request_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processing_job" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "processing_job_type" NOT NULL,
	"status" "processing_job_status" DEFAULT 'pending' NOT NULL,
	"account_id" text,
	"thread_id" text,
	"message_id" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"duration_ms" integer,
	"error_message" text,
	"error_stack" text,
	"error_code" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"next_retry_at" timestamp,
	"progress" real,
	"items_processed" integer,
	"items_total" integer,
	"current_step" text,
	"trigger_run_id" text,
	"trigger_task_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_state" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"history_id" text,
	"delta_link" text,
	"sync_token" text,
	"backfill_complete" boolean DEFAULT false,
	"backfill_started_at" timestamp,
	"backfill_completed_at" timestamp,
	"oldest_message_date" timestamp,
	"total_threads_synced" integer DEFAULT 0,
	"total_messages_synced" integer DEFAULT 0,
	"last_full_sync_at" timestamp,
	"last_incremental_sync_at" timestamp,
	"consecutive_errors" integer DEFAULT 0,
	"last_error_at" timestamp,
	"last_error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sync_state_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_export_request" ADD CONSTRAINT "data_export_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_upload" ADD CONSTRAINT "file_upload_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook" ADD CONSTRAINT "webhook_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_webhook_id_webhook_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_credits" ADD CONSTRAINT "organization_credits_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_account" ADD CONSTRAINT "email_account_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_account" ADD CONSTRAINT "email_account_added_by_user_id_user_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_attachment" ADD CONSTRAINT "email_attachment_message_id_email_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."email_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_message" ADD CONSTRAINT "email_message_thread_id_email_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."email_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_participant" ADD CONSTRAINT "email_participant_message_id_email_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."email_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_thread" ADD CONSTRAINT "email_thread_account_id_email_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_thread_id_email_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."email_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_message_id_email_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."email_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment" ADD CONSTRAINT "commitment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment" ADD CONSTRAINT "commitment_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment" ADD CONSTRAINT "commitment_debtor_contact_id_contact_id_fk" FOREIGN KEY ("debtor_contact_id") REFERENCES "public"."contact"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment" ADD CONSTRAINT "commitment_creditor_contact_id_contact_id_fk" FOREIGN KEY ("creditor_contact_id") REFERENCES "public"."contact"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment" ADD CONSTRAINT "commitment_source_thread_id_email_thread_id_fk" FOREIGN KEY ("source_thread_id") REFERENCES "public"."email_thread"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment" ADD CONSTRAINT "commitment_source_message_id_email_message_id_fk" FOREIGN KEY ("source_message_id") REFERENCES "public"."email_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision" ADD CONSTRAINT "decision_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision" ADD CONSTRAINT "decision_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision" ADD CONSTRAINT "decision_source_thread_id_email_thread_id_fk" FOREIGN KEY ("source_thread_id") REFERENCES "public"."email_thread"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_topic" ADD CONSTRAINT "thread_topic_thread_id_email_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."email_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_topic" ADD CONSTRAINT "thread_topic_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic" ADD CONSTRAINT "topic_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_embedding" ADD CONSTRAINT "claim_embedding_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_embedding" ADD CONSTRAINT "message_embedding_message_id_email_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."email_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_embedding" ADD CONSTRAINT "thread_embedding_thread_id_email_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."email_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_audit" ADD CONSTRAINT "processing_audit_job_id_processing_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."processing_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_job" ADD CONSTRAINT "processing_job_account_id_email_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_job" ADD CONSTRAINT "processing_job_thread_id_email_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."email_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_job" ADD CONSTRAINT "processing_job_message_id_email_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."email_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_state" ADD CONSTRAINT "sync_state_account_id_email_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_organization_id_idx" ON "audit_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_log_user_id_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_resource_idx" ON "audit_log" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_key_userId_idx" ON "api_key" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_key_keyPrefix_idx" ON "api_key" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "data_export_request_userId_idx" ON "data_export_request" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feature_flag_key_idx" ON "feature_flag" USING btree ("key");--> statement-breakpoint
CREATE INDEX "file_upload_userId_idx" ON "file_upload" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "file_upload_key_idx" ON "file_upload" USING btree ("key");--> statement-breakpoint
CREATE INDEX "notification_userId_idx" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_userId_read_idx" ON "notification" USING btree ("user_id","read");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "two_factor_userId_idx" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "webhook_userId_idx" ON "webhook" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "webhook_organizationId_idx" ON "webhook" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_webhookId_idx" ON "webhook_delivery" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_createdAt_idx" ON "webhook_delivery" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "credit_package_active_idx" ON "credit_package" USING btree ("active");--> statement-breakpoint
CREATE INDEX "credit_package_polar_product_id_idx" ON "credit_package" USING btree ("polar_product_id");--> statement-breakpoint
CREATE INDEX "credit_tx_organization_id_idx" ON "credit_transaction" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "credit_tx_user_id_idx" ON "credit_transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_tx_type_idx" ON "credit_transaction" USING btree ("type");--> statement-breakpoint
CREATE INDEX "credit_tx_created_at_idx" ON "credit_transaction" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "credit_tx_reference_id_idx" ON "credit_transaction" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "org_credits_organization_id_idx" ON "organization_credits" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "email_account_org_idx" ON "email_account" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "email_account_added_by_idx" ON "email_account" USING btree ("added_by_user_id");--> statement-breakpoint
CREATE INDEX "email_account_status_idx" ON "email_account" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_attachment_message_idx" ON "email_attachment" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "email_message_thread_idx" ON "email_message" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "email_message_from_idx" ON "email_message" USING btree ("from_email");--> statement-breakpoint
CREATE INDEX "email_message_sent_idx" ON "email_message" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "email_message_received_idx" ON "email_message" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "email_participant_message_idx" ON "email_participant" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "email_participant_contact_idx" ON "email_participant" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "email_participant_email_idx" ON "email_participant" USING btree ("email");--> statement-breakpoint
CREATE INDEX "email_thread_account_idx" ON "email_thread" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "email_thread_last_message_idx" ON "email_thread" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "email_thread_urgency_idx" ON "email_thread" USING btree ("urgency_score");--> statement-breakpoint
CREATE INDEX "email_thread_priority_idx" ON "email_thread" USING btree ("priority_tier");--> statement-breakpoint
CREATE INDEX "email_thread_open_loops_idx" ON "email_thread" USING btree ("has_open_loops");--> statement-breakpoint
CREATE INDEX "invitation_organization_id_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitation_status_idx" ON "invitation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "member_organization_id_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_user_id_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_slug_idx" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "team_organization_id_idx" ON "team" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "team_member_team_id_idx" ON "team_member" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_member_user_id_idx" ON "team_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "claim_org_idx" ON "claim" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "claim_thread_idx" ON "claim" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "claim_message_idx" ON "claim" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "claim_type_idx" ON "claim" USING btree ("type");--> statement-breakpoint
CREATE INDEX "claim_confidence_idx" ON "claim" USING btree ("confidence");--> statement-breakpoint
CREATE INDEX "claim_extracted_idx" ON "claim" USING btree ("extracted_at");--> statement-breakpoint
CREATE INDEX "commitment_org_idx" ON "commitment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "commitment_debtor_idx" ON "commitment" USING btree ("debtor_contact_id");--> statement-breakpoint
CREATE INDEX "commitment_creditor_idx" ON "commitment" USING btree ("creditor_contact_id");--> statement-breakpoint
CREATE INDEX "commitment_direction_idx" ON "commitment" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "commitment_status_idx" ON "commitment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "commitment_priority_idx" ON "commitment" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "commitment_due_idx" ON "commitment" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "commitment_source_thread_idx" ON "commitment" USING btree ("source_thread_id");--> statement-breakpoint
CREATE INDEX "contact_org_idx" ON "contact" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "contact_primary_email_idx" ON "contact" USING btree ("primary_email");--> statement-breakpoint
CREATE INDEX "contact_importance_idx" ON "contact" USING btree ("importance_score");--> statement-breakpoint
CREATE INDEX "contact_health_idx" ON "contact" USING btree ("health_score");--> statement-breakpoint
CREATE INDEX "contact_vip_idx" ON "contact" USING btree ("is_vip");--> statement-breakpoint
CREATE INDEX "contact_at_risk_idx" ON "contact" USING btree ("is_at_risk");--> statement-breakpoint
CREATE INDEX "contact_last_interaction_idx" ON "contact" USING btree ("last_interaction_at");--> statement-breakpoint
CREATE INDEX "decision_org_idx" ON "decision" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "decision_decided_at_idx" ON "decision" USING btree ("decided_at");--> statement-breakpoint
CREATE INDEX "decision_superseded_idx" ON "decision" USING btree ("superseded_by_id");--> statement-breakpoint
CREATE INDEX "decision_source_thread_idx" ON "decision" USING btree ("source_thread_id");--> statement-breakpoint
CREATE INDEX "decision_confidence_idx" ON "decision" USING btree ("confidence");--> statement-breakpoint
CREATE INDEX "thread_topic_thread_idx" ON "thread_topic" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "thread_topic_topic_idx" ON "thread_topic" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "topic_org_idx" ON "topic" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "topic_parent_idx" ON "topic" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "topic_slug_idx" ON "topic" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "claim_embedding_claim_idx" ON "claim_embedding" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "claim_embedding_model_idx" ON "claim_embedding" USING btree ("model");--> statement-breakpoint
CREATE INDEX "claim_embedding_status_idx" ON "claim_embedding" USING btree ("status");--> statement-breakpoint
CREATE INDEX "message_embedding_message_idx" ON "message_embedding" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "message_embedding_model_idx" ON "message_embedding" USING btree ("model");--> statement-breakpoint
CREATE INDEX "message_embedding_status_idx" ON "message_embedding" USING btree ("status");--> statement-breakpoint
CREATE INDEX "query_embedding_cache_hash_idx" ON "query_embedding_cache" USING btree ("query_hash");--> statement-breakpoint
CREATE INDEX "query_embedding_cache_expires_idx" ON "query_embedding_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "query_embedding_cache_last_used_idx" ON "query_embedding_cache" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "thread_embedding_thread_idx" ON "thread_embedding" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "thread_embedding_model_idx" ON "thread_embedding" USING btree ("model");--> statement-breakpoint
CREATE INDEX "thread_embedding_status_idx" ON "thread_embedding" USING btree ("status");--> statement-breakpoint
CREATE INDEX "evidence_link_source_idx" ON "evidence_link" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "evidence_link_target_idx" ON "evidence_link" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "evidence_link_primary_idx" ON "evidence_link" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "processing_audit_job_idx" ON "processing_audit" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "processing_audit_action_idx" ON "processing_audit" USING btree ("action");--> statement-breakpoint
CREATE INDEX "processing_audit_model_idx" ON "processing_audit" USING btree ("model");--> statement-breakpoint
CREATE INDEX "processing_audit_provider_idx" ON "processing_audit" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "processing_audit_created_idx" ON "processing_audit" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "processing_audit_success_idx" ON "processing_audit" USING btree ("success");--> statement-breakpoint
CREATE INDEX "processing_job_status_idx" ON "processing_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "processing_job_type_idx" ON "processing_job" USING btree ("type");--> statement-breakpoint
CREATE INDEX "processing_job_account_idx" ON "processing_job" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "processing_job_thread_idx" ON "processing_job" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "processing_job_priority_idx" ON "processing_job" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "processing_job_scheduled_idx" ON "processing_job" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "processing_job_trigger_run_idx" ON "processing_job" USING btree ("trigger_run_id");--> statement-breakpoint
CREATE INDEX "sync_state_account_idx" ON "sync_state" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "sync_state_backfill_idx" ON "sync_state" USING btree ("backfill_complete");