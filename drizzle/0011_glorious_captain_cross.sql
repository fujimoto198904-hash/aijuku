CREATE TABLE `application_calendar_events` (
	`application_id` text PRIMARY KEY NOT NULL,
	`owner_member_id` text NOT NULL,
	`google_event_id` text NOT NULL,
	`google_event_etag` text,
	`conference_request_id` text,
	`meet_url_ciphertext` text,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`timezone` text NOT NULL,
	`sync_status` text NOT NULL,
	`last_error_code` text,
	`attempt_count` integer NOT NULL,
	`synced_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "application_calendar_events_schedule_check" CHECK("application_calendar_events"."start_at" >= 0 and "application_calendar_events"."end_at" > "application_calendar_events"."start_at"),
	CONSTRAINT "application_calendar_events_timezone_check" CHECK("application_calendar_events"."timezone" = 'Asia/Tokyo'),
	CONSTRAINT "application_calendar_events_sync_status_check" CHECK("application_calendar_events"."sync_status" in ('create_pending', 'active', 'failed', 'reconnect_required')),
	CONSTRAINT "application_calendar_events_attempt_count_check" CHECK("application_calendar_events"."attempt_count" >= 1),
	CONSTRAINT "application_calendar_events_meet_reference_check" CHECK("application_calendar_events"."meet_url_ciphertext" is null or "application_calendar_events"."conference_request_id" is not null),
	CONSTRAINT "application_calendar_events_synced_at_check" CHECK(("application_calendar_events"."sync_status" = 'active' and "application_calendar_events"."synced_at" is not null) or ("application_calendar_events"."sync_status" <> 'active' and "application_calendar_events"."synced_at" is null)),
	CONSTRAINT "application_calendar_events_error_state_check" CHECK(("application_calendar_events"."sync_status" in ('create_pending', 'active') and "application_calendar_events"."last_error_code" is null) or ("application_calendar_events"."sync_status" in ('failed', 'reconnect_required') and "application_calendar_events"."last_error_code" is not null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `application_calendar_events_google_event_id_unique` ON `application_calendar_events` (`google_event_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `application_calendar_events_conference_request_id_unique` ON `application_calendar_events` (`conference_request_id`);--> statement-breakpoint
CREATE INDEX `application_calendar_events_owner_status_idx` ON `application_calendar_events` (`owner_member_id`,`sync_status`);--> statement-breakpoint
CREATE INDEX `application_calendar_events_status_updated_idx` ON `application_calendar_events` (`sync_status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `google_calendar_connections` (
	`owner_member_id` text PRIMARY KEY NOT NULL,
	`google_subject` text NOT NULL,
	`google_email` text NOT NULL,
	`refresh_token_ciphertext` text,
	`granted_scopes` text NOT NULL,
	`status` text NOT NULL,
	`last_error_code` text,
	`connected_at` integer NOT NULL,
	`last_verified_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "google_calendar_connections_status_check" CHECK("google_calendar_connections"."status" in ('active', 'reconnect_required', 'disconnected')),
	CONSTRAINT "google_calendar_connections_token_state_check" CHECK(("google_calendar_connections"."status" = 'active' and "google_calendar_connections"."refresh_token_ciphertext" is not null) or ("google_calendar_connections"."status" <> 'active' and "google_calendar_connections"."refresh_token_ciphertext" is null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `google_calendar_connections_subject_unique` ON `google_calendar_connections` (`google_subject`);--> statement-breakpoint
CREATE UNIQUE INDEX `google_calendar_connections_email_unique` ON `google_calendar_connections` (`google_email`);--> statement-breakpoint
CREATE INDEX `google_calendar_connections_status_updated_idx` ON `google_calendar_connections` (`status`,`updated_at`);