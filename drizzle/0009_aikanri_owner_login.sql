UPDATE `member_auth_accounts`
SET
	`login_id` = 'aikanri',
	`updated_at` = unixepoch() * 1000
WHERE
	`account_kind` = 'member'
	AND `status` = 'active'
	AND `password_state` = 'personal'
	AND (
		SELECT count(*)
		FROM `member_auth_accounts`
		WHERE `account_kind` = 'member' AND `status` = 'active' AND `password_state` = 'personal'
	) = 1
	AND (
		SELECT count(*)
		FROM `member_auth_accounts`
		WHERE `account_kind` = 'demo' AND `status` = 'active'
	) = 1
	AND (SELECT count(*) FROM `member_auth_accounts`) = 2
	AND NOT EXISTS (
		SELECT 1
		FROM `member_auth_accounts` AS `reserved_login`
		WHERE `reserved_login`.`login_id` = 'aikanri'
	);
