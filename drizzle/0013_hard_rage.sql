CREATE TABLE `learning_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`request_id` text NOT NULL,
	`legacy_id` text,
	`body` text NOT NULL,
	`tool` text NOT NULL,
	`outcome` text NOT NULL,
	`human_fix` text NOT NULL,
	`task_id` text,
	`source_ref` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "learning_notes_outcome_check" CHECK("learning_notes"."outcome" in ('worked','adjusted','learned'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_notes_request_unique` ON `learning_notes` (`member_id`,`request_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `learning_notes_legacy_unique` ON `learning_notes` (`member_id`,`legacy_id`);--> statement-breakpoint
CREATE INDEX `learning_notes_member_created` ON `learning_notes` (`member_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `post_stocks` (
	`member_id` text NOT NULL,
	`post_ref` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_stocks_member_ref_unique` ON `post_stocks` (`member_id`,`post_ref`);