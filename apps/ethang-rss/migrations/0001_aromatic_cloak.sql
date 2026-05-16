CREATE TABLE `articles` (
	`content` text,
	`feedId` text NOT NULL,
	`guid` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`link` text NOT NULL,
	`publishedAt` text,
	`title` text NOT NULL,
	FOREIGN KEY (`feedId`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_feed_guid_unique` ON `articles` (`feedId`,`guid`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`createdAt` text,
	`feedId` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`feedId`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_user_feed_unique` ON `subscriptions` (`userId`,`feedId`);--> statement-breakpoint
CREATE TABLE `user_item_states` (
	`articleId` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`isBookmarked` integer DEFAULT false,
	`isRead` integer DEFAULT false,
	`userId` text NOT NULL,
	FOREIGN KEY (`articleId`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_item_article_unique` ON `user_item_states` (`userId`,`articleId`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_feeds` (
	`id` text PRIMARY KEY NOT NULL,
	`lastFetchedAt` text,
	`title` text NOT NULL,
	`website` text NOT NULL,
	`xmlAddress` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_feeds`("id", "lastFetchedAt", "title", "website", "xmlAddress") SELECT "id", "lastFetchedAt", "title", "website", "xmlAddress" FROM `feeds`;--> statement-breakpoint
DROP TABLE `feeds`;--> statement-breakpoint
ALTER TABLE `__new_feeds` RENAME TO `feeds`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `feeds_xmlAddress_unique` ON `feeds` (`xmlAddress`);