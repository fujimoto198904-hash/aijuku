CREATE TABLE `community_media` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`object_key` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`byte_size` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `community_media_created_idx` ON `community_media` (`created_at`);--> statement-breakpoint
ALTER TABLE `community_posts` ADD `media_id` text REFERENCES community_media(id);--> statement-breakpoint
CREATE INDEX `community_posts_media_idx` ON `community_posts` (`media_id`);--> statement-breakpoint
ALTER TABLE `learning_notes` ADD `tested_on` text;--> statement-breakpoint
ALTER TABLE `learning_notes` ADD `topic` text;