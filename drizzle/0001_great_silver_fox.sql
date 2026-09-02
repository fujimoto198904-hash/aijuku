CREATE TABLE `external_review_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`evidence_id` text NOT NULL,
	`member_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`status` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`used_at` integer,
	FOREIGN KEY (`evidence_id`) REFERENCES `skill_evidence`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "external_review_requests_status_check" CHECK("external_review_requests"."status" in ('open', 'submitted', 'revoked'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `external_review_requests_token_hash_unique` ON `external_review_requests` (`token_hash`);--> statement-breakpoint
CREATE INDEX `external_review_requests_evidence_status_idx` ON `external_review_requests` (`evidence_id`,`status`);--> statement-breakpoint
CREATE INDEX `external_review_requests_member_created_idx` ON `external_review_requests` (`member_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `external_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`evidence_id` text NOT NULL,
	`reviewer_user_id` text NOT NULL,
	`reviewer_name` text NOT NULL,
	`reviewer_affiliation` text,
	`relationship` text NOT NULL,
	`rating` integer NOT NULL,
	`observations` text NOT NULL,
	`comment` text NOT NULL,
	`consent_public` integer NOT NULL,
	`moderation_status` text NOT NULL,
	`moderated_by` text,
	`moderated_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `external_review_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`evidence_id`) REFERENCES `skill_evidence`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "external_reviews_relationship_check" CHECK("external_reviews"."relationship" in ('manager', 'colleague', 'client', 'teacher', 'project-member', 'other')),
	CONSTRAINT "external_reviews_rating_check" CHECK("external_reviews"."rating" between 1 and 4),
	CONSTRAINT "external_reviews_consent_public_check" CHECK("external_reviews"."consent_public" in (0, 1)),
	CONSTRAINT "external_reviews_moderation_status_check" CHECK("external_reviews"."moderation_status" in ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `external_reviews_request_unique` ON `external_reviews` (`request_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `external_reviews_evidence_reviewer_unique` ON `external_reviews` (`evidence_id`,`reviewer_user_id`);--> statement-breakpoint
CREATE INDEX `external_reviews_evidence_status_idx` ON `external_reviews` (`evidence_id`,`moderation_status`);--> statement-breakpoint
CREATE INDEX `external_reviews_moderation_created_idx` ON `external_reviews` (`moderation_status`,`created_at`);--> statement-breakpoint
CREATE TABLE `skill_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`source_type` text NOT NULL,
	`task_id` text,
	`task_title` text NOT NULL,
	`task_outcome` text NOT NULL,
	`track` text NOT NULL,
	`course_title` text NOT NULL,
	`skill_keys` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`evidence_url` text,
	`rights_confirmed_at` integer NOT NULL,
	`visibility` text NOT NULL,
	`instructor_status` text NOT NULL,
	`instructor_note` text,
	`verified_by` text,
	`verified_by_name` text,
	`verified_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "skill_evidence_source_type_check" CHECK("skill_evidence"."source_type" in ('curriculum', 'prior-work')),
	CONSTRAINT "skill_evidence_track_check" CHECK("skill_evidence"."track" in ('common', 'department', 'industry', 'generation', 'other')),
	CONSTRAINT "skill_evidence_visibility_check" CHECK("skill_evidence"."visibility" in ('private', 'shared')),
	CONSTRAINT "skill_evidence_rights_confirmed_check" CHECK("skill_evidence"."rights_confirmed_at" > 0),
	CONSTRAINT "skill_evidence_instructor_status_check" CHECK("skill_evidence"."instructor_status" in ('pending', 'verified', 'changes_requested'))
);
--> statement-breakpoint
CREATE INDEX `skill_evidence_member_created_idx` ON `skill_evidence` (`member_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `skill_evidence_status_created_idx` ON `skill_evidence` (`instructor_status`,`created_at`);--> statement-breakpoint
CREATE TABLE `skill_profiles` (
	`member_id` text PRIMARY KEY NOT NULL,
	`public_slug` text NOT NULL,
	`headline` text NOT NULL,
	`target_role` text NOT NULL,
	`bio` text NOT NULL,
	`share_enabled` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "skill_profiles_share_enabled_check" CHECK("skill_profiles"."share_enabled" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skill_profiles_public_slug_unique` ON `skill_profiles` (`public_slug`);