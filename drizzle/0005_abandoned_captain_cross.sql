ALTER TABLE `skill_evidence` ADD `client_request_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `skill_evidence_member_request_unique` ON `skill_evidence` (`member_id`,`client_request_id`);