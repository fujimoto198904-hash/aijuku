CREATE TABLE `official_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_handle` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`task_id` text,
	`publish_after` integer NOT NULL,
	`approved_by` text NOT NULL,
	`published_at` integer,
	`cancelled_at` integer,
	FOREIGN KEY (`profile_handle`) REFERENCES `social_profiles`(`handle`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `official_queue_due` ON `official_queue` (`published_at`,`cancelled_at`,`publish_after`);--> statement-breakpoint
CREATE TABLE `social_blocks` (
	`blocker` text NOT NULL,
	`blocked` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`blocker`) REFERENCES `social_profiles`(`handle`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`blocked`) REFERENCES `social_profiles`(`handle`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_block_pair` ON `social_blocks` (`blocker`,`blocked`);--> statement-breakpoint
CREATE INDEX `social_block_target` ON `social_blocks` (`blocked`,`blocker`);--> statement-breakpoint
CREATE TABLE `social_follows` (
	`follower` text NOT NULL,
	`following` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`follower`) REFERENCES `social_profiles`(`handle`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`following`) REFERENCES `social_profiles`(`handle`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "social_follow_self" CHECK("social_follows"."follower" <> "social_follows"."following")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_follow_pair` ON `social_follows` (`follower`,`following`);--> statement-breakpoint
CREATE INDEX `social_follow_target` ON `social_follows` (`following`,`follower`);--> statement-breakpoint
CREATE TABLE `social_likes` (
	`member_id` text NOT NULL,
	`post_ref` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_like_pair` ON `social_likes` (`member_id`,`post_ref`);--> statement-breakpoint
CREATE INDEX `social_like_post` ON `social_likes` (`post_ref`);--> statement-breakpoint
CREATE TABLE `social_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`sender` text NOT NULL,
	`request_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `social_threads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender`) REFERENCES `social_profiles`(`handle`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_message_request` ON `social_messages` (`sender`,`request_id`);--> statement-breakpoint
CREATE INDEX `social_message_thread` ON `social_messages` (`thread_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `social_profiles` (
	`handle` text PRIMARY KEY NOT NULL,
	`member_id` text,
	`name` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`kind` text DEFAULT 'member' NOT NULL,
	`avatar` text,
	`is_public` integer DEFAULT 0 NOT NULL,
	`dm_enabled` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "social_profiles_kind" CHECK("social_profiles"."kind" in ('member','official','official_ai'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_profiles_member` ON `social_profiles` (`member_id`);--> statement-breakpoint
CREATE TABLE `social_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`snapshot` text NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	`resolved_by` text,
	FOREIGN KEY (`reporter_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `social_reports_open` ON `social_reports` (`resolved_at`,`created_at`);--> statement-breakpoint
CREATE TABLE `social_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`person_a` text NOT NULL,
	`person_b` text NOT NULL,
	`initiator` text NOT NULL,
	`accepted_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_a`) REFERENCES `social_profiles`(`handle`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_b`) REFERENCES `social_profiles`(`handle`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_thread_pair` ON `social_threads` (`person_a`,`person_b`);--> statement-breakpoint
CREATE INDEX `social_thread_b` ON `social_threads` (`person_b`);--> statement-breakpoint
ALTER TABLE `community_posts` ADD `profile_handle` text;--> statement-breakpoint
ALTER TABLE `community_posts` ADD `example_date` text;