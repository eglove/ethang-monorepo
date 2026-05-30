CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`author` text NOT NULL,
	`url` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learning_path_courses` (
	`id` text PRIMARY KEY NOT NULL,
	`learningPathId` text NOT NULL,
	`courseId` text NOT NULL,
	`orderRank` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`learningPathId`) REFERENCES `learning_paths`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `learning_paths` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text,
	`swebokFocus` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
