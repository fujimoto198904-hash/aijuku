CREATE TABLE `social_public_ids` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_handle` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_handle`) REFERENCES `social_profiles`(`handle`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `social_public_ids_profile` ON `social_public_ids` (`profile_handle`);--> statement-breakpoint
ALTER TABLE `social_profiles` ADD `public_id` text;--> statement-breakpoint
ALTER TABLE `social_profiles` ADD `revision` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `social_profiles` ADD `avatar_media_id` text REFERENCES community_media(id);--> statement-breakpoint
CREATE UNIQUE INDEX `social_profiles_public_id` ON `social_profiles` (`public_id`);
--> statement-breakpoint
-- Existing immutable handles (including official accounts) stay reserved without a backfill.
CREATE TRIGGER social_public_ids_legacy_guard BEFORE INSERT ON social_public_ids
WHEN NEW.id <> lower(NEW.id) OR EXISTS(SELECT 1 FROM social_profiles WHERE handle=NEW.id AND handle<>NEW.profile_handle)
BEGIN SELECT RAISE(ABORT, 'reserved_public_id'); END;
