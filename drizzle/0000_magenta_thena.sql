CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`client_request_id` text NOT NULL,
	`service_type` text NOT NULL,
	`status` text NOT NULL,
	`goal` text NOT NULL,
	`preferred_schedule` text NOT NULL,
	`participants` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "applications_service_type_check" CHECK("applications"."service_type" in ('in-person-tutor', 'online-tutor', 'self-study')),
	CONSTRAINT "applications_status_check" CHECK("applications"."status" in ('received', 'reviewing', 'confirmed', 'cancelled')),
	CONSTRAINT "applications_participants_check" CHECK("applications"."participants" between 1 and 5)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_member_request_unique` ON `applications` (`member_id`,`client_request_id`);--> statement-breakpoint
CREATE INDEX `applications_member_created_idx` ON `applications` (`member_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `applications_status_created_idx` ON `applications` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`status` text NOT NULL,
	`terms_version` text NOT NULL,
	`terms_accepted_at` integer NOT NULL,
	`privacy_version` text NOT NULL,
	`privacy_accepted_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "members_status_check" CHECK("members"."status" in ('active', 'suspended', 'withdrawn'))
);
