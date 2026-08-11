CREATE TABLE `recipient_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`firstName` varchar(120),
	`company` varchar(180),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recipient_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `recipient_entries_user_email_unique` UNIQUE(`userId`,`email`)
);
--> statement-breakpoint
CREATE TABLE `send_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(36) NOT NULL,
	`email` varchar(320) NOT NULL,
	`firstName` varchar(120),
	`company` varchar(180),
	`renderedBody` text NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`gmailMessageId` varchar(255),
	`failureCode` varchar(80),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `send_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `send_sessions` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`messageTemplate` text NOT NULL,
	`resumeId` int NOT NULL,
	`attachmentName` varchar(255) NOT NULL,
	`status` enum('review','sending','completed','completed_with_errors','failed') NOT NULL DEFAULT 'review',
	`reviewedAt` timestamp,
	`confirmedAt` timestamp,
	`startedAt` timestamp,
	`finishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `send_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `recipient_entries_user_updated_idx` ON `recipient_entries` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `send_recipients_session_idx` ON `send_recipients` (`sessionId`);--> statement-breakpoint
CREATE INDEX `send_sessions_user_created_idx` ON `send_sessions` (`userId`,`createdAt`);