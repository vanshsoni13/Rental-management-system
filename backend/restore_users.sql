CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('customer','admin','seller') NOT NULL DEFAULT 'customer',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `google_id` varchar(255) DEFAULT NULL,
  `auth_provider` enum('EMAIL','GOOGLE') NOT NULL DEFAULT 'EMAIL',
  `profile_image` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `idx_users_email_unique` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_google_id` (`google_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `users`
  (`user_id`,`name`,`email`,`password`,`phone`,`role`,`auth_provider`)
VALUES
  (1,'Vansh Soni','vanshsoni0313@gmail.com','$2a$10$I.cS.M.UG3J3lURlyr8r2u0vjG/vF3ccCVPNAAaik8.3U5NL/pX/2','7016267258','customer','EMAIL'),
  (3,'meet patel','meet@gmail.com','$2a$10$f7J1DWTuMhMKoYKnwGDjiO2Dfm/wnvXv1tnr.l8hWIAJyKNBQn25W','07016267258','customer','EMAIL'),
  (6,'admin','admin@gmail.com','$2a$10$KFeMIeKVFlBQeZLyz.T/bOXKX23Qggiy8h/a9kR9EV0q.qAHKCjTu','1234567890','admin','EMAIL');
