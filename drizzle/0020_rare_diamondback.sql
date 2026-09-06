CREATE TABLE `community_media_deletion_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`object_key` text NOT NULL,
	`byte_size` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `community_media_deletion_member_idx` ON `community_media_deletion_queue` (`member_id`);--> statement-breakpoint
CREATE INDEX `community_media_member_created_idx` ON `community_media` (`member_id`,`created_at`);