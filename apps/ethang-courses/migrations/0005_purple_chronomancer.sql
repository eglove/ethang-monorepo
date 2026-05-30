PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_learning_path_courses` (
	`courseId` text NOT NULL,
	`createdAt` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`learningPathId` text NOT NULL,
	`orderRank` integer NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`learningPathId`) REFERENCES `learning_paths`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_learning_path_courses`("courseId", "createdAt", "id", "learningPathId", "orderRank") SELECT "courseId", "createdAt", "id", "learningPathId", "tempOrderRank" FROM `learning_path_courses`;--> statement-breakpoint
DROP TABLE `learning_path_courses`;--> statement-breakpoint
ALTER TABLE `__new_learning_path_courses` RENAME TO `learning_path_courses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;