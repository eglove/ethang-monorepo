CREATE TABLE `feeds` (
	`id` text PRIMARY KEY DEFAULT '019e0efe-4e6d-74f9-99c5-5ae8871dba62' NOT NULL,
	`title` text NOT NULL,
	`website` text NOT NULL,
	`xmlAddress` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feeds_xmlAddress_unique` ON `feeds` (`xmlAddress`);