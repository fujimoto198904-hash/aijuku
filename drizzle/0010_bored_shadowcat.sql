CREATE TABLE `billing_checkout_sessions` (
	`stripe_checkout_session_id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`application_id` text,
	`checkout_attempt_id` text NOT NULL,
	`stripe_idempotency_key` text NOT NULL,
	`stripe_account_id` text NOT NULL,
	`livemode` integer NOT NULL,
	`service_type` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`payment_status` text NOT NULL,
	`payment_failed_at` integer,
	`state_observed_at` integer NOT NULL,
	`currency` text,
	`amount_total` integer,
	`stripe_customer_id` text,
	`stripe_payment_intent_id` text,
	`stripe_subscription_id` text,
	`checkout_url` text,
	`expires_at` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "billing_checkout_sessions_livemode_check" CHECK("billing_checkout_sessions"."livemode" in (0, 1)),
	CONSTRAINT "billing_checkout_sessions_service_type_check" CHECK("billing_checkout_sessions"."service_type" in ('in-person-tutor', 'online-tutor', 'self-study')),
	CONSTRAINT "billing_checkout_sessions_mode_check" CHECK("billing_checkout_sessions"."mode" in ('payment', 'subscription')),
	CONSTRAINT "billing_checkout_sessions_application_mode_check" CHECK(("billing_checkout_sessions"."mode" = 'payment' and "billing_checkout_sessions"."application_id" is not null) or ("billing_checkout_sessions"."mode" = 'subscription' and "billing_checkout_sessions"."application_id" is null)),
	CONSTRAINT "billing_checkout_sessions_status_check" CHECK("billing_checkout_sessions"."status" in ('open', 'complete', 'expired')),
	CONSTRAINT "billing_checkout_sessions_payment_status_check" CHECK("billing_checkout_sessions"."payment_status" in ('no_payment_required', 'unpaid', 'paid')),
	CONSTRAINT "billing_checkout_sessions_amount_total_check" CHECK("billing_checkout_sessions"."amount_total" is null or "billing_checkout_sessions"."amount_total" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_checkout_sessions_account_attempt_unique` ON `billing_checkout_sessions` (`stripe_account_id`,`livemode`,`checkout_attempt_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `billing_checkout_sessions_account_idempotency_unique` ON `billing_checkout_sessions` (`stripe_account_id`,`livemode`,`stripe_idempotency_key`);--> statement-breakpoint
CREATE INDEX `billing_checkout_sessions_member_updated_idx` ON `billing_checkout_sessions` (`member_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `billing_checkout_sessions_application_updated_idx` ON `billing_checkout_sessions` (`application_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `billing_checkout_sessions_status_updated_idx` ON `billing_checkout_sessions` (`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `billing_customers` (
	`stripe_customer_id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`stripe_account_id` text NOT NULL,
	`livemode` integer NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "billing_customers_livemode_check" CHECK("billing_customers"."livemode" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_customers_member_account_mode_unique` ON `billing_customers` (`member_id`,`stripe_account_id`,`livemode`);--> statement-breakpoint
CREATE INDEX `billing_customers_member_updated_idx` ON `billing_customers` (`member_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `billing_subscriptions` (
	`stripe_subscription_id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`application_id` text,
	`stripe_account_id` text NOT NULL,
	`livemode` integer NOT NULL,
	`stripe_customer_id` text NOT NULL,
	`service_type` text NOT NULL,
	`stripe_price_id` text NOT NULL,
	`status` text NOT NULL,
	`state_observed_at` integer NOT NULL,
	`currency` text,
	`unit_amount` integer,
	`quantity` integer,
	`current_period_start` integer,
	`current_period_end` integer,
	`cancel_at_period_end` integer DEFAULT 0 NOT NULL,
	`cancel_at` integer,
	`canceled_at` integer,
	`ended_at` integer,
	`trial_end` integer,
	`latest_invoice_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "billing_subscriptions_livemode_check" CHECK("billing_subscriptions"."livemode" in (0, 1)),
	CONSTRAINT "billing_subscriptions_service_type_check" CHECK("billing_subscriptions"."service_type" in ('in-person-tutor', 'online-tutor', 'self-study')),
	CONSTRAINT "billing_subscriptions_status_check" CHECK("billing_subscriptions"."status" in ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
	CONSTRAINT "billing_subscriptions_application_null_check" CHECK("billing_subscriptions"."application_id" is null),
	CONSTRAINT "billing_subscriptions_unit_amount_check" CHECK("billing_subscriptions"."unit_amount" is null or "billing_subscriptions"."unit_amount" >= 0),
	CONSTRAINT "billing_subscriptions_quantity_check" CHECK("billing_subscriptions"."quantity" is null or "billing_subscriptions"."quantity" > 0),
	CONSTRAINT "billing_subscriptions_cancel_at_period_end_check" CHECK("billing_subscriptions"."cancel_at_period_end" in (0, 1))
);
--> statement-breakpoint
CREATE INDEX `billing_subscriptions_member_service_status_idx` ON `billing_subscriptions` (`member_id`,`service_type`,`status`);--> statement-breakpoint
CREATE INDEX `billing_subscriptions_customer_updated_idx` ON `billing_subscriptions` (`stripe_customer_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `stripe_object_sync_locks` (
	`lock_key` text PRIMARY KEY NOT NULL,
	`stripe_object_type` text NOT NULL,
	`stripe_object_id` text NOT NULL,
	`stripe_account_id` text NOT NULL,
	`livemode` integer NOT NULL,
	`lease_owner` text NOT NULL,
	`lease_expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "stripe_object_sync_locks_type_check" CHECK("stripe_object_sync_locks"."stripe_object_type" in ('checkout_session', 'subscription', 'customer')),
	CONSTRAINT "stripe_object_sync_locks_livemode_check" CHECK("stripe_object_sync_locks"."livemode" in (0, 1))
);
--> statement-breakpoint
CREATE INDEX `stripe_object_sync_locks_lease_expires_idx` ON `stripe_object_sync_locks` (`lease_expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `stripe_object_sync_locks_account_object_unique` ON `stripe_object_sync_locks` (`stripe_account_id`,`livemode`,`stripe_object_type`,`stripe_object_id`);--> statement-breakpoint
CREATE TABLE `stripe_webhook_events` (
	`stripe_event_id` text PRIMARY KEY NOT NULL,
	`stripe_account_id` text NOT NULL,
	`livemode` integer NOT NULL,
	`event_type` text NOT NULL,
	`api_version` text,
	`status` text NOT NULL,
	`attempt_count` integer NOT NULL,
	`last_error` text,
	`stripe_created_at` integer NOT NULL,
	`processing_started_at` integer NOT NULL,
	`processed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "stripe_webhook_events_livemode_check" CHECK("stripe_webhook_events"."livemode" in (0, 1)),
	CONSTRAINT "stripe_webhook_events_status_check" CHECK("stripe_webhook_events"."status" in ('processing', 'processed', 'failed')),
	CONSTRAINT "stripe_webhook_events_attempt_count_check" CHECK("stripe_webhook_events"."attempt_count" >= 1)
);
--> statement-breakpoint
CREATE INDEX `stripe_webhook_events_status_updated_idx` ON `stripe_webhook_events` (`status`,`updated_at`);
