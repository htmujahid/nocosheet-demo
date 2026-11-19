CREATE TABLE `default__access_grant` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` integer NOT NULL,
	`resource_id` integer,
	`grant` text NOT NULL,
	`action` text GENERATED ALWAYS AS ((case when instr("grant", ':') > 0 then substr("grant", 1, instr("grant", ':') - 1) else "grant" end)) VIRTUAL,
	FOREIGN KEY (`profile_id`) REFERENCES `default__access_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resource_id`) REFERENCES `default__resource`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "default__access_grant_check" CHECK("default__access_grant"."grant" in ('create', 'create:none', 'export', 'export:none', 'read:own', 'read:all', 'read:none', 'update:own', 'update:all', 'update:none', 'delete:own', 'delete:all', 'delete:none'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__access_grant_unique` ON `default__access_grant` (`profile_id`,(case when "resource_id" is null then 0 else "resource_id" end),`action`);--> statement-breakpoint
CREATE TABLE `default__access_profile_member` (
	`user_id` text PRIMARY KEY NOT NULL,
	`profile_id` integer NOT NULL,
	`assigned_by` text,
	`assigned_at` integer NOT NULL DEFAULT (cast(unixepoch('subsec') * 1000 as integer)),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `default__access_profile`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`assigned_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `default__access_profile_member_profile` ON `default__access_profile_member` (`profile_id`);--> statement-breakpoint
CREATE TABLE `default__access_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_system` integer DEFAULT false NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`kind` text DEFAULT 'custom' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsec') * 1000 as integer)),
	`updated_at` integer NOT NULL DEFAULT (cast(unixepoch('subsec') * 1000 as integer)),
	CONSTRAINT "default__access_profile_kind_check" CHECK("default__access_profile"."kind" in ('custom', 'authenticated'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__access_profile_name` ON `default__access_profile` (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX `default__access_profile_default` ON `default__access_profile` (`is_default`) WHERE "default__access_profile"."is_default" = 1;--> statement-breakpoint
CREATE UNIQUE INDEX `default__access_profile_kind` ON `default__access_profile` (`kind`) WHERE "default__access_profile"."kind" != 'custom';--> statement-breakpoint
CREATE TABLE `default__audit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_id` integer,
	`table_label` text NOT NULL,
	`actor_id` text,
	`actor_name` text,
	`action` text NOT NULL,
	`record_ids` text DEFAULT '[]' NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`changes` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsec') * 1000 as integer)),
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`actor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "default__audit_action_check" CHECK("default__audit"."action" in ('create', 'update', 'delete', 'restore', 'purge', 'import'))
);
--> statement-breakpoint
CREATE INDEX `default__audit_created` ON `default__audit` (`created_at`);--> statement-breakpoint
CREATE INDEX `default__audit_table_created` ON `default__audit` (`table_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `default__audit_action_created` ON `default__audit` (`action`,`created_at`);--> statement-breakpoint
CREATE TABLE `default__column` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_id` integer NOT NULL,
	`column_name` text NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`type` text NOT NULL,
	`format` text NOT NULL,
	`is_required` integer DEFAULT false NOT NULL,
	`is_filterable` integer DEFAULT false NOT NULL,
	`is_sortable` integer DEFAULT false NOT NULL,
	`is_searchable` integer DEFAULT false NOT NULL,
	`is_unique` integer DEFAULT false NOT NULL,
	`is_hidden` integer DEFAULT false NOT NULL,
	`check_expression` text,
	`generated_expression` text,
	`default_value` text,
	`position` integer DEFAULT 0 NOT NULL,
	`description` text,
	`options` text DEFAULT '{}' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsec') * 1000 as integer)),
	`updated_at` integer NOT NULL DEFAULT (cast(unixepoch('subsec') * 1000 as integer)),
	`deleted_at` integer,
	`deleted_by` text,
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deleted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__column_name` ON `default__column` (`table_id`,lower("name")) WHERE "default__column"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX `default__column_column_name` ON `default__column` (`table_id`,`column_name`);--> statement-breakpoint
CREATE INDEX `default__column_position` ON `default__column` (`table_id`,`position`) WHERE "default__column"."deleted_at" is null;--> statement-breakpoint
CREATE TABLE `default__favorite` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`table_id` integer NOT NULL,
	`created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsec') * 1000 as integer)),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__favorite_user_table` ON `default__favorite` (`user_id`,`table_id`);--> statement-breakpoint
CREATE TABLE `default__form` (
	`id` integer PRIMARY KEY NOT NULL,
	`table_id` integer NOT NULL,
	`form_key` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`is_open` integer DEFAULT false NOT NULL,
	`select_columns` text DEFAULT '[]' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsec') * 1000 as integer)),
	`updated_at` integer NOT NULL DEFAULT (cast(unixepoch('subsec') * 1000 as integer)),
	FOREIGN KEY (`id`) REFERENCES `default__resource`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__form_name` ON `default__form` (`table_id`,lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX `default__form_form_key` ON `default__form` (`form_key`);--> statement-breakpoint
CREATE INDEX `default__form_table_position` ON `default__form` (`table_id`,`position`);--> statement-breakpoint
CREATE TABLE `default__resource` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	CONSTRAINT "default__resource_kind_check" CHECK("default__resource"."kind" in ('table', 'view', 'form'))
);
--> statement-breakpoint
CREATE TABLE `default__setting` (
	`user_id` text PRIMARY KEY NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `default__table` (
	`id` integer PRIMARY KEY NOT NULL,
	`table_name` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`group_name` text,
	`title_column_id` integer,
	`position` integer DEFAULT 0 NOT NULL,
	`is_audit` integer DEFAULT false NOT NULL,
	`is_hidden` integer DEFAULT false NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsec') * 1000 as integer)),
	`updated_at` integer NOT NULL DEFAULT (cast(unixepoch('subsec') * 1000 as integer)),
	`deleted_at` integer,
	`deleted_by` text,
	FOREIGN KEY (`id`) REFERENCES `default__resource`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`title_column_id`) REFERENCES `default__column`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`deleted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__table_name` ON `default__table` (lower("name")) WHERE "default__table"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX `default__table_table_name` ON `default__table` (`table_name`);--> statement-breakpoint
CREATE INDEX `default__table_position` ON `default__table` (`position`) WHERE "default__table"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX `default__table_group` ON `default__table` (`group_name`,`position`) WHERE "default__table"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX `default__table_deleted` ON `default__table` (`deleted_at`) WHERE "default__table"."deleted_at" is not null;--> statement-breakpoint
CREATE TABLE `default__trash` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_id` integer NOT NULL,
	`record_id` text NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	`deleted_by` text,
	`deleted_at` integer NOT NULL DEFAULT (cast(unixepoch('subsec') * 1000 as integer)),
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deleted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `default__trash_table_deleted` ON `default__trash` (`table_id`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `default__view` (
	`id` integer PRIMARY KEY NOT NULL,
	`table_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`type` text,
	`position` integer DEFAULT 0 NOT NULL,
	`select_columns` text DEFAULT '[]' NOT NULL,
	`where_expression` text DEFAULT '[]' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsec') * 1000 as integer)),
	`updated_at` integer NOT NULL DEFAULT (cast(unixepoch('subsec') * 1000 as integer)),
	FOREIGN KEY (`id`) REFERENCES `default__resource`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__view_name` ON `default__view` (`table_id`,lower("name"));--> statement-breakpoint
CREATE INDEX `default__view_table_position` ON `default__view` (`table_id`,`position`);
--> statement-breakpoint
INSERT INTO `default__access_profile` (`name`, `description`, `is_system`, `is_default`, `kind`, `position`) VALUES
	('Authenticated', 'Applies to every signed-in member on top of their own profile.', 1, 0, 'authenticated', 0),
	('Editor', 'Create, read, change and delete every record, and export them.', 1, 0, 'custom', 1),
	('Contributor', 'Create records and read all, but only change or delete their own.', 1, 0, 'custom', 2),
	('Viewer', 'Read and export every record.', 1, 1, 'custom', 3);
--> statement-breakpoint
WITH seed(profile_name, `grant`) AS (VALUES
	('Editor', 'create'),
	('Editor', 'read:all'),
	('Editor', 'update:all'),
	('Editor', 'delete:all'),
	('Editor', 'export'),
	('Contributor', 'create'),
	('Contributor', 'read:all'),
	('Contributor', 'update:own'),
	('Contributor', 'delete:own'),
	('Viewer', 'read:all'),
	('Viewer', 'export')
)
INSERT INTO `default__access_grant` (`profile_id`, `resource_id`, `grant`)
SELECT p.`id`, NULL, seed.`grant` FROM seed JOIN `default__access_profile` p ON p.`name` = seed.`profile_name`;
