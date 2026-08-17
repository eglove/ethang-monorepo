CREATE TABLE `job_applications` (
	`applicationUrl` text NOT NULL,
	`appliedDate` text NOT NULL,
	`company` text NOT NULL,
	`createdAt` text NOT NULL,
	`email` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`location` text,
	`nextInterviewDate` text,
	`notes` text,
	`resumeFilename` text,
	`resumeKey` text,
	`resumeSize` integer,
	`salary` text,
	`status` text NOT NULL,
	`title` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_application_url_unique` ON `job_applications` (`email`,`applicationUrl`);