CREATE TABLE `agent_media_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`prompt` text NOT NULL,
	`model` varchar(120) NOT NULL,
	`assetUrl` varchar(2048) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_media_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `agent_media_assets_user_created_idx` ON `agent_media_assets` (`userId`,`createdAt`);