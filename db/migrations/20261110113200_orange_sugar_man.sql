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
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
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
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__favorite_user_table` ON `default__favorite` (`user_id`,`table_id`);--> statement-breakpoint
CREATE TABLE `default__trash` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_id` integer NOT NULL,
	`record_id` text NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	`deleted_by` text,
	`deleted_at` integer NOT NULL,
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deleted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `default__trash_table_deleted` ON `default__trash` (`table_id`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `default__resource` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	CONSTRAINT "default__resource_kind_check" CHECK("default__resource"."kind" in ('table', 'view', 'form'))
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
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
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
CREATE TABLE `default__view` (
	`id` integer PRIMARY KEY NOT NULL,
	`table_id` integer NOT NULL,
	`view_name` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`type` text,
	`position` integer DEFAULT 0 NOT NULL,
	`select_columns` text DEFAULT '[]' NOT NULL,
	`where_expression` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`deleted_by` text,
	FOREIGN KEY (`id`) REFERENCES `default__resource`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`deleted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__view_name` ON `default__view` (`table_id`,lower("name")) WHERE "default__view"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX `default__view_view_name` ON `default__view` (`view_name`);--> statement-breakpoint
CREATE INDEX `default__view_table_position` ON `default__view` (`table_id`,`position`) WHERE "default__view"."deleted_at" is null;--> statement-breakpoint
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
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`deleted_by` text,
	FOREIGN KEY (`id`) REFERENCES `default__resource`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`deleted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__form_name` ON `default__form` (`table_id`,lower("name")) WHERE "default__form"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX `default__form_form_key` ON `default__form` (`form_key`);--> statement-breakpoint
CREATE INDEX `default__form_table_position` ON `default__form` (`table_id`,`position`) WHERE "default__form"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX `default__form_deleted` ON `default__form` (`deleted_at`) WHERE "default__form"."deleted_at" is not null;
--> statement-breakpoint
CREATE TABLE `default__role_member` (
	`user_id` text PRIMARY KEY NOT NULL,
	`role_id` integer NOT NULL,
	`assigned_by` text,
	`assigned_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `default__role`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`assigned_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `default__role_member_role` ON `default__role_member` (`role_id`);--> statement-breakpoint
CREATE TABLE `default__role_permission` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role_id` integer NOT NULL,
	`resource_id` integer,
	`permission` text NOT NULL,
	`action` text GENERATED ALWAYS AS ((case when instr("permission", ':') > 0 then substr("permission", 1, instr("permission", ':') - 1) else "permission" end)) VIRTUAL,
	FOREIGN KEY (`role_id`) REFERENCES `default__role`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resource_id`) REFERENCES `default__resource`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "default__role_permission_check" CHECK("default__role_permission"."permission" in ('create', 'create:none', 'export', 'export:none', 'read:own', 'read:all', 'read:none', 'update:own', 'update:all', 'update:none', 'delete:own', 'delete:all', 'delete:none'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__role_permission_unique` ON `default__role_permission` (`role_id`,(case when "resource_id" is null then 0 else "resource_id" end),`action`);--> statement-breakpoint
CREATE TABLE `default__role` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_system` integer DEFAULT false NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`kind` text DEFAULT 'custom' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "default__role_kind_check" CHECK("default__role"."kind" in ('custom', 'authenticated', 'guest'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__role_name` ON `default__role` (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX `default__role_default` ON `default__role` (`is_default`) WHERE "default__role"."is_default" = 1;--> statement-breakpoint
CREATE UNIQUE INDEX `default__role_kind` ON `default__role` (`kind`) WHERE "default__role"."kind" != 'custom';
--> statement-breakpoint
INSERT INTO `default__role` (`name`, `description`, `is_system`, `is_default`, `kind`, `position`, `created_at`, `updated_at`) VALUES
	('Authenticated', 'Applies to every signed-in member on top of their own role.', 1, 0, 'authenticated', 0, CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
	('Guest', 'Applies to anyone who is not signed in, and to every member as a floor.', 1, 0, 'guest', 1, CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
	('Editor', 'Create, read, change and delete every record, and export them.', 1, 0, 'custom', 2, CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
	('Contributor', 'Create records and read all, but only change or delete their own.', 1, 0, 'custom', 3, CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
	('Viewer', 'Read and export every record.', 1, 1, 'custom', 4, CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000);
--> statement-breakpoint
WITH seed(role_name, permission) AS (VALUES
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
INSERT INTO `default__role_permission` (`role_id`, `resource_id`, `permission`)
SELECT r.`id`, NULL, seed.`permission` FROM seed JOIN `default__role` r ON r.`name` = seed.`role_name`;
