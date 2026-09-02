CREATE TABLE `member_auth_accounts` (
	`member_id` text PRIMARY KEY NOT NULL,
	`login_id` text NOT NULL,
	`contact_email` text,
	`password_digest` text NOT NULL,
	`password_state` text NOT NULL,
	`account_kind` text NOT NULL,
	`status` text NOT NULL,
	`temporary_password_expires_at` integer,
	`password_changed_at` integer,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "member_auth_accounts_password_state_check" CHECK("member_auth_accounts"."password_state" in ('temporary', 'personal')),
	CONSTRAINT "member_auth_accounts_kind_check" CHECK("member_auth_accounts"."account_kind" in ('member', 'demo')),
	CONSTRAINT "member_auth_accounts_status_check" CHECK("member_auth_accounts"."status" in ('active', 'disabled')),
	CONSTRAINT "member_auth_accounts_temporary_expiry_check" CHECK(("member_auth_accounts"."password_state" = 'temporary' and "member_auth_accounts"."temporary_password_expires_at" is not null) or ("member_auth_accounts"."password_state" = 'personal' and "member_auth_accounts"."temporary_password_expires_at" is null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_auth_accounts_login_id_unique` ON `member_auth_accounts` (`login_id`);--> statement-breakpoint
CREATE TABLE `member_auth_rate_limits` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`window_started_at` integer NOT NULL,
	`request_count` integer NOT NULL,
	`blocked_until` integer,
	`updated_at` integer NOT NULL,
	CONSTRAINT "member_auth_rate_limits_action_check" CHECK("member_auth_rate_limits"."action" in ('login-id', 'login-ip', 'password-change', 'bootstrap')),
	CONSTRAINT "member_auth_rate_limits_count_check" CHECK("member_auth_rate_limits"."request_count" between 1 and 100)
);
--> statement-breakpoint
CREATE INDEX `member_auth_rate_limits_updated_idx` ON `member_auth_rate_limits` (`updated_at`);--> statement-breakpoint
CREATE TABLE `member_auth_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`session_kind` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `member_auth_accounts`(`member_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "member_auth_sessions_kind_check" CHECK("member_auth_sessions"."session_kind" in ('member', 'password-change')),
	CONSTRAINT "member_auth_sessions_expiry_check" CHECK("member_auth_sessions"."expires_at" > "member_auth_sessions"."created_at")
);
--> statement-breakpoint
CREATE INDEX `member_auth_sessions_account_expiry_idx` ON `member_auth_sessions` (`account_id`,`expires_at`);--> statement-breakpoint
CREATE INDEX `member_auth_sessions_expiry_idx` ON `member_auth_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `member_onboarding_profiles` (
	`member_id` text PRIMARY KEY NOT NULL,
	`learning_goal` text NOT NULL,
	`start_mode` text NOT NULL,
	`interest_keys` text NOT NULL,
	`first_outcome` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "member_onboarding_profiles_goal_check" CHECK("member_onboarding_profiles"."learning_goal" in ('daily-life', 'work-efficiency', 'creative', 'build', 'team', 'explore')),
	CONSTRAINT "member_onboarding_profiles_start_mode_check" CHECK("member_onboarding_profiles"."start_mode" in ('level-zero', 'quick-win', 'build-now', 'focus-area', 'recommend'))
);
