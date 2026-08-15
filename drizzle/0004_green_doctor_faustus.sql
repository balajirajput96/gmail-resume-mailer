CREATE TABLE `agent_job_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` varchar(36) NOT NULL,
	`kind` varchar(64) NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_job_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_jobs` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`repositoryId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`request` text NOT NULL,
	`kind` enum('repository_analysis','implementation_plan') NOT NULL,
	`status` enum('queued','planning','awaiting_approval','approved','rejected','failed') NOT NULL DEFAULT 'queued',
	`model` varchar(120) NOT NULL,
	`plan` text,
	`output` text,
	`approvalNote` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_repositories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`url` varchar(2048) NOT NULL,
	`defaultBranch` varchar(255) NOT NULL DEFAULT 'main',
	`visibility` varchar(32) NOT NULL DEFAULT 'private',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_repositories_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_repositories_user_name_unique` UNIQUE(`userId`,`fullName`)
);
--> statement-breakpoint
CREATE INDEX `agent_job_events_job_created_idx` ON `agent_job_events` (`jobId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `agent_jobs_user_created_idx` ON `agent_jobs` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `agent_jobs_repository_idx` ON `agent_jobs` (`repositoryId`);