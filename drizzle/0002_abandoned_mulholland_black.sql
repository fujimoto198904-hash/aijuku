ALTER TABLE `external_reviews` ADD COLUMN `terms_version` text;--> statement-breakpoint
ALTER TABLE `external_reviews` ADD COLUMN `privacy_version` text;--> statement-breakpoint
ALTER TABLE `external_reviews` ADD COLUMN `policy_accepted_at` integer CONSTRAINT "external_reviews_policy_accepted_check" CHECK (`policy_accepted_at` IS NULL OR `policy_accepted_at` > 0);
