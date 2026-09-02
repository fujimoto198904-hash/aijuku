CREATE TABLE `member_lesson_progress` (
	`member_id` text NOT NULL,
	`task_id` text NOT NULL,
	`bookmarked` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "member_lesson_progress_bookmarked_check" CHECK("member_lesson_progress"."bookmarked" in (0, 1)),
	CONSTRAINT "member_lesson_progress_completed_check" CHECK("member_lesson_progress"."completed" in (0, 1)),
	CONSTRAINT "member_lesson_progress_state_check" CHECK(not ("member_lesson_progress"."bookmarked" = 1 and "member_lesson_progress"."completed" = 1)),
	CONSTRAINT "member_lesson_progress_completed_at_check" CHECK(("member_lesson_progress"."completed" = 1 and "member_lesson_progress"."completed_at" is not null) or ("member_lesson_progress"."completed" = 0 and "member_lesson_progress"."completed_at" is null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_lesson_progress_member_task_unique` ON `member_lesson_progress` (`member_id`,`task_id`);--> statement-breakpoint
CREATE INDEX `member_lesson_progress_member_updated_idx` ON `member_lesson_progress` (`member_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `member_lesson_rate_limits` (
	`member_id` text PRIMARY KEY NOT NULL,
	`window_started_at` integer NOT NULL,
	`request_count` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "member_lesson_rate_limits_count_check" CHECK("member_lesson_rate_limits"."request_count" between 1 and 30)
);
