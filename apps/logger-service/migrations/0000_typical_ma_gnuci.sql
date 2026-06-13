CREATE TABLE `logs` (
	`environment` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`level` text NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`serviceName` text NOT NULL,
	`stack` text,
	`timestamp` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `environment_idx` ON `logs` (`environment`);--> statement-breakpoint
CREATE INDEX `level_idx` ON `logs` (`level`);--> statement-breakpoint
CREATE INDEX `service_name_idx` ON `logs` (`serviceName`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `logs` (`timestamp`);