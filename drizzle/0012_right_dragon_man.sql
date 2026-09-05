CREATE TABLE `community_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`request_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`task_id` text,
	`author_name` text NOT NULL,
	`author_role` text NOT NULL,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	`deleted_by` text,
	FOREIGN KEY (`author_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "community_posts_kind_check" CHECK("community_posts"."kind" in ('question','tip','learning')),
	CONSTRAINT "community_posts_role_check" CHECK("community_posts"."author_role" in ('member','staff'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_posts_request_unique` ON `community_posts` (`author_id`,`request_id`);--> statement-breakpoint
CREATE INDEX `community_posts_feed_idx` ON `community_posts` (`deleted_at`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `community_posts_kind_idx` ON `community_posts` (`kind`,`deleted_at`,`created_at`);--> statement-breakpoint
CREATE TABLE `community_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`author_id` text NOT NULL,
	`request_id` text NOT NULL,
	`body` text NOT NULL,
	`author_name` text NOT NULL,
	`author_role` text NOT NULL,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	`deleted_by` text,
	FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "community_replies_role_check" CHECK("community_replies"."author_role" in ('member','staff'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_replies_request_unique` ON `community_replies` (`author_id`,`request_id`);--> statement-breakpoint
CREATE INDEX `community_replies_post_idx` ON `community_replies` (`post_id`,`deleted_at`,`created_at`);--> statement-breakpoint
CREATE TABLE `community_write_limits` (
	`member_id` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`request_count` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `member_auth_identities` (
	`provider` text NOT NULL,
	`subject` text NOT NULL,
	`member_id` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_auth_identities_subject_unique` ON `member_auth_identities` (`provider`,`subject`);--> statement-breakpoint
CREATE TABLE `registration_rate_limits` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`request_count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `registration_tickets` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`provider` text NOT NULL,
	`subject` text,
	`expires_at` integer NOT NULL,
	`used_at` integer
);
--> statement-breakpoint
CREATE INDEX `registration_tickets_expiry_idx` ON `registration_tickets` (`expires_at`);