CREATE TABLE `application_status_events` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`from_status` text NOT NULL,
	`to_status` text NOT NULL,
	`actor_type` text NOT NULL,
	`actor_id` text NOT NULL,
	`actor_name` text NOT NULL,
	`member_message` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "application_status_events_from_status_check" CHECK("application_status_events"."from_status" in ('received', 'reviewing', 'confirmed', 'cancelled')),
	CONSTRAINT "application_status_events_to_status_check" CHECK("application_status_events"."to_status" in ('received', 'reviewing', 'confirmed', 'cancelled')),
	CONSTRAINT "application_status_events_actor_type_check" CHECK("application_status_events"."actor_type" in ('member', 'owner'))
);
--> statement-breakpoint
CREATE INDEX `application_status_events_application_created_idx` ON `application_status_events` (`application_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `external_review_moderation_events` (
	`id` text PRIMARY KEY NOT NULL,
	`review_id` text NOT NULL,
	`from_status` text NOT NULL,
	`to_status` text NOT NULL,
	`moderator_user_id` text NOT NULL,
	`moderator_name` text NOT NULL,
	`note` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`review_id`) REFERENCES `external_reviews`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "external_review_moderation_events_from_status_check" CHECK("external_review_moderation_events"."from_status" in ('pending', 'approved', 'rejected')),
	CONSTRAINT "external_review_moderation_events_to_status_check" CHECK("external_review_moderation_events"."to_status" in ('approved', 'rejected'))
);
--> statement-breakpoint
CREATE INDEX `external_review_moderation_events_review_created_idx` ON `external_review_moderation_events` (`review_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `skill_evidence_review_events` (
	`id` text PRIMARY KEY NOT NULL,
	`evidence_id` text NOT NULL,
	`from_status` text NOT NULL,
	`to_status` text NOT NULL,
	`reviewer_user_id` text NOT NULL,
	`reviewer_name` text NOT NULL,
	`note` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`evidence_id`) REFERENCES `skill_evidence`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "skill_evidence_review_events_from_status_check" CHECK("skill_evidence_review_events"."from_status" in ('pending', 'verified', 'changes_requested')),
	CONSTRAINT "skill_evidence_review_events_to_status_check" CHECK("skill_evidence_review_events"."to_status" in ('verified', 'changes_requested'))
);
--> statement-breakpoint
CREATE INDEX `skill_evidence_review_events_evidence_created_idx` ON `skill_evidence_review_events` (`evidence_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `applications` ADD `offer_snapshot` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `terms_version` text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `privacy_version` text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `member_message` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `assigned_instructor` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `scheduled_at` integer;--> statement-breakpoint
ALTER TABLE `applications` ADD `delivery_details` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `internal_note` text;--> statement-breakpoint
ALTER TABLE `external_reviews` ADD `moderation_note` text;