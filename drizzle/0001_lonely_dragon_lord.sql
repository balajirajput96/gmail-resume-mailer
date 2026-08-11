CREATE TABLE `gmail_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gmailAddress` varchar(320) NOT NULL,
	`refreshTokenCiphertext` text NOT NULL,
	`scopes` text NOT NULL,
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gmail_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `gmail_connections_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `resumes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resumes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `resumes_user_created_idx` ON `resumes` (`userId`,`createdAt`);