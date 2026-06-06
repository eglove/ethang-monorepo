CREATE TABLE `curriculum_learning_paths` (
	`createdAt` text NOT NULL,
	`curriculumId` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`learningPathId` text NOT NULL,
	`orderRank` integer NOT NULL,
	FOREIGN KEY (`curriculumId`) REFERENCES `curriculums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`learningPathId`) REFERENCES `learning_paths`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `curriculums` (
	`createdAt` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`updatedAt` text NOT NULL,
	`url` text
);
