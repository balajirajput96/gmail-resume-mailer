CREATE TABLE `github_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`githubLogin` varchar(255) NOT NULL,
	`accessTokenCiphertext` text NOT NULL,
	`scopes` text NOT NULL,
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `github_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `github_connections_user_unique` UNIQUE(`userId`)
);
