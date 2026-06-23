-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: kodama.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `log_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject_id` bigint unsigned DEFAULT NULL,
  `event` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `causer_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `causer_id` bigint unsigned DEFAULT NULL,
  `properties` json DEFAULT NULL,
  `batch_uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `subject` (`subject_type`,`subject_id`),
  KEY `causer` (`causer_type`,`causer_id`),
  KEY `log_name_index` (`log_name`),
  KEY `batch_uuid_index` (`batch_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_log`
--

LOCK TABLES `activity_log` WRITE;
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alert_rules`
--

DROP TABLE IF EXISTS `alert_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alert_rules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `rule_type` varchar(255) NOT NULL,
  `condition` json NOT NULL,
  `threshold_value` float NOT NULL,
  `action` varchar(255) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` bigint unsigned DEFAULT NULL,
  `asset_id` bigint unsigned DEFAULT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `alert_rules_asset_id_status_index` (`asset_id`,`status`),
  KEY `alert_rules_department_id_status_index` (`department_id`,`status`),
  KEY `alert_rules_created_by_foreign` (`created_by`),
  CONSTRAINT `alert_rules_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `alert_rules_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `alert_rules_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alert_rules`
--

LOCK TABLES `alert_rules` WRITE;
/*!40000 ALTER TABLE `alert_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `alert_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alerts`
--

DROP TABLE IF EXISTS `alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alerts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` bigint unsigned DEFAULT NULL,
  `tracker_device_id` bigint unsigned DEFAULT NULL,
  `alert_type` enum('outside_geofence','device_offline','suspicious_motion','manual_notice') NOT NULL,
  `severity` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `triggered_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolution_notes` text,
  `email_sent` tinyint(1) NOT NULL DEFAULT '0',
  `sms_sent` tinyint(1) NOT NULL DEFAULT '0',
  `push_sent` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('unread','read','resolved') NOT NULL DEFAULT 'unread',
  `read_by` bigint unsigned DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `alerts_device_fk` (`tracker_device_id`),
  KEY `alerts_user_fk` (`read_by`),
  KEY `alerts_asset_id_status_index` (`asset_id`,`status`),
  KEY `alerts_status_severity_index` (`status`,`severity`),
  KEY `alerts_triggered_at_index` (`triggered_at`),
  CONSTRAINT `alerts_asset_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `alerts_device_fk` FOREIGN KEY (`tracker_device_id`) REFERENCES `tracker_devices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `alerts_user_fk` FOREIGN KEY (`read_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alerts`
--

LOCK TABLES `alerts` WRITE;
/*!40000 ALTER TABLE `alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_categories`
--

DROP TABLE IF EXISTS `asset_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_categories_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_categories`
--

LOCK TABLES `asset_categories` WRITE;
/*!40000 ALTER TABLE `asset_categories` DISABLE KEYS */;
INSERT INTO `asset_categories` VALUES (1,'serverds','test','2026-05-19 15:06:10','2026-05-19 15:06:10'),(2,'electronics','test','2026-05-25 00:38:53','2026-05-25 00:38:53');
/*!40000 ALTER TABLE `asset_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_device_assignments`
--

DROP TABLE IF EXISTS `asset_device_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_device_assignments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` bigint unsigned NOT NULL,
  `tracker_device_id` bigint unsigned NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `unassigned_at` timestamp NULL DEFAULT NULL,
  `assigned_by` bigint unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ada_asset_fk` (`asset_id`),
  KEY `ada_device_fk` (`tracker_device_id`),
  KEY `ada_user_fk` (`assigned_by`),
  CONSTRAINT `ada_asset_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ada_device_fk` FOREIGN KEY (`tracker_device_id`) REFERENCES `tracker_devices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ada_user_fk` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_device_assignments`
--

LOCK TABLES `asset_device_assignments` WRITE;
/*!40000 ALTER TABLE `asset_device_assignments` DISABLE KEYS */;
INSERT INTO `asset_device_assignments` VALUES (1,1,2,'2026-06-22 07:13:00',NULL,1,1,'2026-06-22 04:13:26','2026-06-22 04:13:26');
/*!40000 ALTER TABLE `asset_device_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_latest_locations`
--

DROP TABLE IF EXISTS `asset_latest_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_latest_locations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` bigint unsigned NOT NULL,
  `tracker_device_id` bigint unsigned NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `last_motion_detected` tinyint(1) NOT NULL DEFAULT '0',
  `last_recorded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`),
  KEY `tracker_device_id` (`tracker_device_id`),
  KEY `last_recorded_at` (`last_recorded_at`),
  CONSTRAINT `fk_asset_latest_locations_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_asset_latest_locations_tracker` FOREIGN KEY (`tracker_device_id`) REFERENCES `tracker_devices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_latest_locations`
--

LOCK TABLES `asset_latest_locations` WRITE;
/*!40000 ALTER TABLE `asset_latest_locations` DISABLE KEYS */;
INSERT INTO `asset_latest_locations` VALUES (1,1,2,-6.97647750,39.09370833,0,'2026-06-23 04:06:02','2026-06-22 22:57:32','2026-06-23 04:06:02');
/*!40000 ALTER TABLE `asset_latest_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_values`
--

DROP TABLE IF EXISTS `asset_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_values` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` bigint unsigned NOT NULL,
  `purchase_price` decimal(12,2) DEFAULT NULL,
  `current_value` decimal(12,2) DEFAULT NULL,
  `depreciation_rate` float DEFAULT '0',
  `last_valued_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_values_asset_id_index` (`asset_id`),
  CONSTRAINT `asset_values_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_values`
--

LOCK TABLES `asset_values` WRITE;
/*!40000 ALTER TABLE `asset_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assets`
--

DROP TABLE IF EXISTS `assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `asset_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `serial_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asset_category_id` bigint unsigned NOT NULL,
  `department_id` bigint unsigned NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `purchase_date` date DEFAULT NULL,
  `status` enum('active','inactive','missing','maintenance') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `asset_value` decimal(12,2) DEFAULT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_code` (`asset_code`),
  KEY `assets_asset_category_id_foreign` (`asset_category_id`),
  KEY `assets_department_id_foreign` (`department_id`),
  KEY `assets_created_by_foreign` (`created_by`),
  KEY `assets_updated_by_foreign` (`updated_by`),
  KEY `assets_status_department_id_index` (`status`,`department_id`),
  CONSTRAINT `assets_asset_category_id_foreign` FOREIGN KEY (`asset_category_id`) REFERENCES `asset_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assets_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `assets_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assets_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assets`
--

LOCK TABLES `assets` WRITE;
/*!40000 ALTER TABLE `assets` DISABLE KEYS */;
INSERT INTO `assets` VALUES (1,'3335635','laptop','3333',2,1,'teaat','2026-06-22','active',NULL,'assets/AXGmFup1Q5dGz94XEzuwRDTboY0c29dlYH7aicep.png',7,NULL,'2026-06-22 03:41:23','2026-06-22 03:41:23');
/*!40000 ALTER TABLE `assets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_user_id` (`user_id`),
  CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3506 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (3322,1,'created','User','User \'karia lumumba\' was created.','100.64.0.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-25 00:24:44','2026-05-25 00:24:44'),(3323,6,'updated','User','User \'System Administrator\' was updated.','100.64.0.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-25 00:36:38','2026-05-25 00:36:38'),(3324,6,'updated','User','User \'System Administrator\' was updated.','100.64.0.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-25 00:36:48','2026-05-25 00:36:48'),(3325,6,'updated','User','User \'System Administrator\' was updated.','100.64.0.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-25 00:36:49','2026-05-25 00:36:49'),(3326,6,'updated','User','User \'System Administrator\' was updated.','100.64.0.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-25 00:37:05','2026-05-25 00:37:05'),(3327,6,'updated','User','User \'eliya katindasa\' was updated.','100.64.0.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-25 00:37:57','2026-05-25 00:37:57'),(3328,6,'updated','Department','Department \'ICT DEPARTMENT\' was updated.','100.64.0.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-25 00:38:26','2026-05-25 00:38:26'),(3329,6,'created','AssetCategory','AssetCategory \'electronics\' was created.','100.64.0.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-25 00:38:53','2026-05-25 00:38:53'),(3330,1,'updated','User','User \'System Administrator\' was updated.','100.64.0.5','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36','2026-05-27 06:25:42','2026-05-27 06:25:42'),(3331,1,'updated','User','User \'System Administrator\' was updated.','100.64.0.5','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36','2026-05-27 06:28:11','2026-05-27 06:28:11'),(3332,1,'updated','User','User \'test athanas\' was updated.','100.64.0.9','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-22 02:53:12','2026-06-22 02:53:12'),(3333,1,'updated','User','User \'test athanas\' was updated.','100.64.0.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-22 02:55:43','2026-06-22 02:55:43'),(3334,1,'created','User','User \'ICTDEPARTMENBT\' was created.','100.64.0.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-22 02:57:03','2026-06-22 02:57:03'),(3335,1,'updated','User','User \'System Administrator\' was updated.','100.64.0.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-22 02:57:21','2026-06-22 02:57:21'),(3336,1,'deleted','TrackerDevice','TrackerDevice \'555\' was deleted.','100.64.0.7','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-22 04:11:29','2026-06-22 04:11:29'),(3337,1,'created','TrackerDevice','TrackerDevice \'trACKER 1\' was created.','100.64.0.8','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-22 04:12:28','2026-06-22 04:12:28'),(3338,1,'created','AssetDeviceAssignment','AssetDeviceAssignment \'1\' was created.','100.64.0.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-22 04:13:26','2026-06-22 04:13:26'),(3339,NULL,'created','AssetLatestLocation','AssetLatestLocation \'1\' was created.','100.64.0.2','ESP32HTTPClient','2026-06-22 22:57:32','2026-06-22 22:57:32'),(3340,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.3','ESP32HTTPClient','2026-06-22 22:58:02','2026-06-22 22:58:02'),(3341,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-22 22:58:31','2026-06-22 22:58:31'),(3342,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.9','ESP32HTTPClient','2026-06-22 22:59:02','2026-06-22 22:59:02'),(3343,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.10','ESP32HTTPClient','2026-06-22 22:59:31','2026-06-22 22:59:31'),(3344,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.11','ESP32HTTPClient','2026-06-22 23:00:02','2026-06-22 23:00:02'),(3345,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.2','ESP32HTTPClient','2026-06-22 23:00:32','2026-06-22 23:00:32'),(3346,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.9','ESP32HTTPClient','2026-06-22 23:01:02','2026-06-22 23:01:02'),(3347,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.9','ESP32HTTPClient','2026-06-22 23:01:32','2026-06-22 23:01:32'),(3348,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.11','ESP32HTTPClient','2026-06-22 23:02:02','2026-06-22 23:02:02'),(3349,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.8','ESP32HTTPClient','2026-06-22 23:02:32','2026-06-22 23:02:32'),(3350,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.9','ESP32HTTPClient','2026-06-22 23:03:01','2026-06-22 23:03:01'),(3351,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.11','ESP32HTTPClient','2026-06-22 23:03:32','2026-06-22 23:03:32'),(3352,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.12','ESP32HTTPClient','2026-06-22 23:04:02','2026-06-22 23:04:02'),(3353,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.3','ESP32HTTPClient','2026-06-22 23:04:32','2026-06-22 23:04:32'),(3354,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.12','ESP32HTTPClient','2026-06-22 23:05:02','2026-06-22 23:05:02'),(3355,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-22 23:05:32','2026-06-22 23:05:32'),(3356,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.8','ESP32HTTPClient','2026-06-22 23:06:01','2026-06-22 23:06:01'),(3357,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.12','ESP32HTTPClient','2026-06-22 23:10:02','2026-06-22 23:10:02'),(3358,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.13','ESP32HTTPClient','2026-06-22 23:10:32','2026-06-22 23:10:32'),(3359,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.2','ESP32HTTPClient','2026-06-22 23:11:02','2026-06-22 23:11:02'),(3360,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.4','ESP32HTTPClient','2026-06-22 23:11:32','2026-06-22 23:11:32'),(3361,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.14','ESP32HTTPClient','2026-06-22 23:12:01','2026-06-22 23:12:01'),(3362,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.2','ESP32HTTPClient','2026-06-22 23:12:32','2026-06-22 23:12:32'),(3363,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.12','ESP32HTTPClient','2026-06-22 23:13:01','2026-06-22 23:13:01'),(3364,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.12','ESP32HTTPClient','2026-06-22 23:13:32','2026-06-22 23:13:32'),(3365,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.11','ESP32HTTPClient','2026-06-22 23:14:02','2026-06-22 23:14:02'),(3366,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.13','ESP32HTTPClient','2026-06-22 23:14:32','2026-06-22 23:14:32'),(3367,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.13','ESP32HTTPClient','2026-06-22 23:15:01','2026-06-22 23:15:01'),(3368,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.13','ESP32HTTPClient','2026-06-22 23:15:32','2026-06-22 23:15:32'),(3369,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.11','ESP32HTTPClient','2026-06-22 23:16:01','2026-06-22 23:16:01'),(3370,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.3','ESP32HTTPClient','2026-06-22 23:16:31','2026-06-22 23:16:31'),(3371,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.13','ESP32HTTPClient','2026-06-22 23:17:02','2026-06-22 23:17:02'),(3372,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.13','ESP32HTTPClient','2026-06-22 23:17:31','2026-06-22 23:17:31'),(3373,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.9','ESP32HTTPClient','2026-06-22 23:18:02','2026-06-22 23:18:02'),(3374,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.9','ESP32HTTPClient','2026-06-22 23:18:32','2026-06-22 23:18:32'),(3375,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.9','ESP32HTTPClient','2026-06-22 23:19:02','2026-06-22 23:19:02'),(3376,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.14','ESP32HTTPClient','2026-06-22 23:19:31','2026-06-22 23:19:31'),(3377,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.11','ESP32HTTPClient','2026-06-22 23:20:02','2026-06-22 23:20:02'),(3378,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.11','ESP32HTTPClient','2026-06-22 23:20:31','2026-06-22 23:20:31'),(3379,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.7','ESP32HTTPClient','2026-06-22 23:21:02','2026-06-22 23:21:02'),(3380,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.7','ESP32HTTPClient','2026-06-22 23:21:32','2026-06-22 23:21:32'),(3381,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.14','ESP32HTTPClient','2026-06-22 23:22:02','2026-06-22 23:22:02'),(3382,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.3','ESP32HTTPClient','2026-06-22 23:22:31','2026-06-22 23:22:31'),(3383,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.9','ESP32HTTPClient','2026-06-22 23:23:02','2026-06-22 23:23:02'),(3384,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.14','ESP32HTTPClient','2026-06-22 23:23:31','2026-06-22 23:23:31'),(3385,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-22 23:24:02','2026-06-22 23:24:02'),(3386,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-22 23:24:32','2026-06-22 23:24:32'),(3387,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-22 23:25:03','2026-06-22 23:25:03'),(3388,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.3','ESP32HTTPClient','2026-06-22 23:25:31','2026-06-22 23:25:31'),(3389,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.9','ESP32HTTPClient','2026-06-22 23:26:02','2026-06-22 23:26:02'),(3390,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-22 23:26:31','2026-06-22 23:26:31'),(3391,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.3','ESP32HTTPClient','2026-06-22 23:27:01','2026-06-22 23:27:01'),(3392,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.14','ESP32HTTPClient','2026-06-22 23:27:32','2026-06-22 23:27:32'),(3393,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.10','ESP32HTTPClient','2026-06-22 23:28:02','2026-06-22 23:28:02'),(3394,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-22 23:28:31','2026-06-22 23:28:31'),(3395,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.10','ESP32HTTPClient','2026-06-22 23:29:02','2026-06-22 23:29:02'),(3396,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.3','ESP32HTTPClient','2026-06-22 23:29:31','2026-06-22 23:29:31'),(3397,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.16','ESP32HTTPClient','2026-06-22 23:30:01','2026-06-22 23:30:01'),(3398,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-22 23:30:32','2026-06-22 23:30:32'),(3399,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.5','ESP32HTTPClient','2026-06-22 23:31:01','2026-06-22 23:31:01'),(3400,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-22 23:31:32','2026-06-22 23:31:32'),(3401,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-22 23:32:02','2026-06-22 23:32:02'),(3402,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.3','ESP32HTTPClient','2026-06-23 02:11:22','2026-06-23 02:11:22'),(3403,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.8','ESP32HTTPClient','2026-06-23 02:11:52','2026-06-23 02:11:52'),(3404,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.14','ESP32HTTPClient','2026-06-23 02:12:22','2026-06-23 02:12:22'),(3405,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.9','ESP32HTTPClient','2026-06-23 02:12:52','2026-06-23 02:12:52'),(3406,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.9','ESP32HTTPClient','2026-06-23 02:13:22','2026-06-23 02:13:22'),(3407,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-23 02:13:52','2026-06-23 02:13:52'),(3408,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.3','ESP32HTTPClient','2026-06-23 02:14:22','2026-06-23 02:14:22'),(3409,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.3','ESP32HTTPClient','2026-06-23 02:14:53','2026-06-23 02:14:53'),(3410,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.14','ESP32HTTPClient','2026-06-23 02:15:22','2026-06-23 02:15:22'),(3411,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.11','ESP32HTTPClient','2026-06-23 02:15:52','2026-06-23 02:15:52'),(3412,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.13','ESP32HTTPClient','2026-06-23 02:38:56','2026-06-23 02:38:56'),(3413,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.16','ESP32HTTPClient','2026-06-23 02:39:26','2026-06-23 02:39:26'),(3414,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.11','ESP32HTTPClient','2026-06-23 02:39:56','2026-06-23 02:39:56'),(3415,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.14','ESP32HTTPClient','2026-06-23 02:40:26','2026-06-23 02:40:26'),(3416,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.4','ESP32HTTPClient','2026-06-23 02:40:56','2026-06-23 02:40:56'),(3417,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.4','ESP32HTTPClient','2026-06-23 02:41:26','2026-06-23 02:41:26'),(3418,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.17','ESP32HTTPClient','2026-06-23 02:41:56','2026-06-23 02:41:56'),(3419,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.11','ESP32HTTPClient','2026-06-23 02:42:26','2026-06-23 02:42:26'),(3420,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.10','ESP32HTTPClient','2026-06-23 02:42:56','2026-06-23 02:42:56'),(3421,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.5','ESP32HTTPClient','2026-06-23 02:43:26','2026-06-23 02:43:26'),(3422,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.11','ESP32HTTPClient','2026-06-23 02:43:56','2026-06-23 02:43:56'),(3423,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.10','ESP32HTTPClient','2026-06-23 02:44:26','2026-06-23 02:44:26'),(3424,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.11','ESP32HTTPClient','2026-06-23 02:44:56','2026-06-23 02:44:56'),(3425,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.11','ESP32HTTPClient','2026-06-23 02:45:26','2026-06-23 02:45:26'),(3426,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.11','ESP32HTTPClient','2026-06-23 02:45:56','2026-06-23 02:45:56'),(3427,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.8','ESP32HTTPClient','2026-06-23 02:46:26','2026-06-23 02:46:26'),(3428,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.12','ESP32HTTPClient','2026-06-23 02:46:56','2026-06-23 02:46:56'),(3429,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.13','ESP32HTTPClient','2026-06-23 02:47:26','2026-06-23 02:47:26'),(3430,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.17','ESP32HTTPClient','2026-06-23 02:47:57','2026-06-23 02:47:57'),(3431,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.13','ESP32HTTPClient','2026-06-23 02:48:26','2026-06-23 02:48:26'),(3432,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.17','ESP32HTTPClient','2026-06-23 02:48:57','2026-06-23 02:48:57'),(3433,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-23 02:49:27','2026-06-23 02:49:27'),(3434,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.12','ESP32HTTPClient','2026-06-23 02:49:56','2026-06-23 02:49:56'),(3435,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.5','ESP32HTTPClient','2026-06-23 03:27:01','2026-06-23 03:27:01'),(3436,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.14','ESP32HTTPClient','2026-06-23 03:27:29','2026-06-23 03:27:29'),(3437,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.12','ESP32HTTPClient','2026-06-23 03:27:58','2026-06-23 03:27:58'),(3438,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-23 03:28:28','2026-06-23 03:28:28'),(3439,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-23 03:28:58','2026-06-23 03:28:58'),(3440,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-23 03:29:29','2026-06-23 03:29:29'),(3441,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-23 03:29:58','2026-06-23 03:29:58'),(3442,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.16','ESP32HTTPClient','2026-06-23 03:30:29','2026-06-23 03:30:29'),(3443,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-23 03:30:58','2026-06-23 03:30:58'),(3444,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-23 03:31:28','2026-06-23 03:31:28'),(3445,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-23 03:31:59','2026-06-23 03:31:59'),(3446,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.10','ESP32HTTPClient','2026-06-23 03:32:29','2026-06-23 03:32:29'),(3447,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-23 03:32:58','2026-06-23 03:32:58'),(3448,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.2','ESP32HTTPClient','2026-06-23 03:33:30','2026-06-23 03:33:30'),(3449,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.16','ESP32HTTPClient','2026-06-23 03:33:58','2026-06-23 03:33:58'),(3450,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.16','ESP32HTTPClient','2026-06-23 03:34:28','2026-06-23 03:34:28'),(3451,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.16','ESP32HTTPClient','2026-06-23 03:34:59','2026-06-23 03:34:59'),(3452,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-23 03:35:28','2026-06-23 03:35:28'),(3453,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.7','ESP32HTTPClient','2026-06-23 03:35:58','2026-06-23 03:35:58'),(3454,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-23 03:36:29','2026-06-23 03:36:29'),(3455,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.17','ESP32HTTPClient','2026-06-23 03:36:58','2026-06-23 03:36:58'),(3456,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.5','ESP32HTTPClient','2026-06-23 03:37:28','2026-06-23 03:37:28'),(3457,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.17','ESP32HTTPClient','2026-06-23 03:37:59','2026-06-23 03:37:59'),(3458,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.7','ESP32HTTPClient','2026-06-23 03:38:28','2026-06-23 03:38:28'),(3459,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.17','ESP32HTTPClient','2026-06-23 03:38:58','2026-06-23 03:38:58'),(3460,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.7','ESP32HTTPClient','2026-06-23 03:39:29','2026-06-23 03:39:29'),(3461,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.13','ESP32HTTPClient','2026-06-23 03:39:58','2026-06-23 03:39:58'),(3462,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.16','ESP32HTTPClient','2026-06-23 03:40:28','2026-06-23 03:40:28'),(3463,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.17','ESP32HTTPClient','2026-06-23 03:40:59','2026-06-23 03:40:59'),(3464,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.5','ESP32HTTPClient','2026-06-23 03:41:28','2026-06-23 03:41:28'),(3465,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.10','ESP32HTTPClient','2026-06-23 03:41:58','2026-06-23 03:41:58'),(3466,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.10','ESP32HTTPClient','2026-06-23 03:42:29','2026-06-23 03:42:29'),(3467,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.5','ESP32HTTPClient','2026-06-23 03:42:58','2026-06-23 03:42:58'),(3468,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.17','ESP32HTTPClient','2026-06-23 03:43:28','2026-06-23 03:43:28'),(3469,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.10','ESP32HTTPClient','2026-06-23 03:43:59','2026-06-23 03:43:59'),(3470,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.17','ESP32HTTPClient','2026-06-23 03:44:28','2026-06-23 03:44:28'),(3471,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.17','ESP32HTTPClient','2026-06-23 03:44:58','2026-06-23 03:44:58'),(3472,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-23 03:45:29','2026-06-23 03:45:29'),(3473,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.17','ESP32HTTPClient','2026-06-23 03:45:58','2026-06-23 03:45:58'),(3474,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-23 03:46:28','2026-06-23 03:46:28'),(3475,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-23 03:46:59','2026-06-23 03:46:59'),(3476,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.17','ESP32HTTPClient','2026-06-23 03:47:28','2026-06-23 03:47:28'),(3477,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-23 03:47:58','2026-06-23 03:47:58'),(3478,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-23 03:48:29','2026-06-23 03:48:29'),(3479,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.3','ESP32HTTPClient','2026-06-23 03:48:58','2026-06-23 03:48:58'),(3480,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.3','ESP32HTTPClient','2026-06-23 03:49:28','2026-06-23 03:49:28'),(3481,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-23 03:49:59','2026-06-23 03:49:59'),(3482,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.13','ESP32HTTPClient','2026-06-23 03:50:28','2026-06-23 03:50:28'),(3483,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.13','ESP32HTTPClient','2026-06-23 03:50:58','2026-06-23 03:50:58'),(3484,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-23 03:51:29','2026-06-23 03:51:29'),(3485,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.12','ESP32HTTPClient','2026-06-23 03:51:58','2026-06-23 03:51:58'),(3486,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.13','ESP32HTTPClient','2026-06-23 03:52:28','2026-06-23 03:52:28'),(3487,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-23 03:52:59','2026-06-23 03:52:59'),(3488,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.13','ESP32HTTPClient','2026-06-23 03:53:28','2026-06-23 03:53:28'),(3489,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-23 03:53:58','2026-06-23 03:53:58'),(3490,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.15','ESP32HTTPClient','2026-06-23 03:54:29','2026-06-23 03:54:29'),(3491,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.10','ESP32HTTPClient','2026-06-23 03:54:58','2026-06-23 03:54:58'),(3492,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.8','ESP32HTTPClient','2026-06-23 03:55:28','2026-06-23 03:55:28'),(3493,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.8','ESP32HTTPClient','2026-06-23 03:55:58','2026-06-23 03:55:58'),(3494,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.8','ESP32HTTPClient','2026-06-23 03:56:28','2026-06-23 03:56:28'),(3495,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.8','ESP32HTTPClient','2026-06-23 03:56:58','2026-06-23 03:56:58'),(3496,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.8','ESP32HTTPClient','2026-06-23 03:57:28','2026-06-23 03:57:28'),(3497,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.16','ESP32HTTPClient','2026-06-23 03:57:58','2026-06-23 03:57:58'),(3498,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.8','ESP32HTTPClient','2026-06-23 04:00:33','2026-06-23 04:00:33'),(3499,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.7','ESP32HTTPClient','2026-06-23 04:01:03','2026-06-23 04:01:03'),(3500,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-23 04:01:29','2026-06-23 04:01:29'),(3501,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.6','ESP32HTTPClient','2026-06-23 04:02:00','2026-06-23 04:02:00'),(3502,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.7','ESP32HTTPClient','2026-06-23 04:04:35','2026-06-23 04:04:35'),(3503,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.8','ESP32HTTPClient','2026-06-23 04:05:04','2026-06-23 04:05:04'),(3504,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.17','ESP32HTTPClient','2026-06-23 04:05:30','2026-06-23 04:05:30'),(3505,NULL,'updated','AssetLatestLocation','AssetLatestLocation \'1\' was updated.','100.64.0.8','ESP32HTTPClient','2026-06-23 04:06:02','2026-06-23 04:06:02');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` VALUES ('smart-asset-manageement-system-cache-4893c61074b7c9449a20c827641d9115','i:1;',1782257379),('smart-asset-manageement-system-cache-4893c61074b7c9449a20c827641d9115:timer','i:1782257379;',1782257379),('smart-asset-manageement-system-cache-a709905558c254659e114d7e1a60d369','i:1;',1782185363),('smart-asset-manageement-system-cache-a709905558c254659e114d7e1a60d369:timer','i:1782185363;',1782185363),('smart-asset-manageement-system-cache-spatie.permission.cache','a:3:{s:5:\"alias\";a:4:{s:1:\"a\";s:2:\"id\";s:1:\"b\";s:4:\"name\";s:1:\"c\";s:10:\"guard_name\";s:1:\"r\";s:5:\"roles\";}s:11:\"permissions\";a:43:{i:0;a:4:{s:1:\"a\";i:1;s:1:\"b\";s:20:\"dashboard.admin.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:1;a:4:{s:1:\"a\";i:2;s:1:\"b\";s:22:\"dashboard.manager.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:2;a:4:{s:1:\"a\";i:3;s:1:\"b\";s:10:\"users.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:3;a:4:{s:1:\"a\";i:4;s:1:\"b\";s:12:\"users.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:4;a:4:{s:1:\"a\";i:5;s:1:\"b\";s:12:\"users.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:5;a:4:{s:1:\"a\";i:6;s:1:\"b\";s:12:\"users.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:6;a:4:{s:1:\"a\";i:7;s:1:\"b\";s:10:\"roles.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:7;a:4:{s:1:\"a\";i:8;s:1:\"b\";s:12:\"roles.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:8;a:4:{s:1:\"a\";i:9;s:1:\"b\";s:12:\"roles.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:9;a:4:{s:1:\"a\";i:10;s:1:\"b\";s:12:\"roles.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:10;a:4:{s:1:\"a\";i:11;s:1:\"b\";s:12:\"roles.assign\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:11;a:4:{s:1:\"a\";i:12;s:1:\"b\";s:16:\"departments.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:12;a:4:{s:1:\"a\";i:13;s:1:\"b\";s:18:\"departments.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:13;a:4:{s:1:\"a\";i:14;s:1:\"b\";s:18:\"departments.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:14;a:4:{s:1:\"a\";i:15;s:1:\"b\";s:18:\"departments.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:15;a:4:{s:1:\"a\";i:16;s:1:\"b\";s:21:\"asset_categories.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:16;a:4:{s:1:\"a\";i:17;s:1:\"b\";s:23:\"asset_categories.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:17;a:4:{s:1:\"a\";i:18;s:1:\"b\";s:23:\"asset_categories.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:18;a:4:{s:1:\"a\";i:19;s:1:\"b\";s:23:\"asset_categories.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:19;a:4:{s:1:\"a\";i:20;s:1:\"b\";s:11:\"assets.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:20;a:4:{s:1:\"a\";i:21;s:1:\"b\";s:13:\"assets.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:21;a:4:{s:1:\"a\";i:22;s:1:\"b\";s:13:\"assets.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:22;a:4:{s:1:\"a\";i:23;s:1:\"b\";s:13:\"assets.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:23;a:4:{s:1:\"a\";i:24;s:1:\"b\";s:12:\"devices.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:24;a:4:{s:1:\"a\";i:25;s:1:\"b\";s:14:\"devices.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:25;a:4:{s:1:\"a\";i:26;s:1:\"b\";s:14:\"devices.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:26;a:4:{s:1:\"a\";i:27;s:1:\"b\";s:14:\"devices.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:27;a:4:{s:1:\"a\";i:28;s:1:\"b\";s:14:\"devices.assign\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:28;a:4:{s:1:\"a\";i:29;s:1:\"b\";s:22:\"tracking.live_map.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:29;a:4:{s:1:\"a\";i:30;s:1:\"b\";s:21:\"tracking.history.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:30;a:4:{s:1:\"a\";i:31;s:1:\"b\";s:14:\"geofences.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:31;a:4:{s:1:\"a\";i:32;s:1:\"b\";s:16:\"geofences.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:32;a:4:{s:1:\"a\";i:33;s:1:\"b\";s:16:\"geofences.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:33;a:4:{s:1:\"a\";i:34;s:1:\"b\";s:16:\"geofences.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:34;a:4:{s:1:\"a\";i:35;s:1:\"b\";s:11:\"alerts.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:35;a:4:{s:1:\"a\";i:36;s:1:\"b\";s:14:\"alerts.resolve\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:36;a:4:{s:1:\"a\";i:37;s:1:\"b\";s:12:\"reports.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:37;a:4:{s:1:\"a\";i:38;s:1:\"b\";s:14:\"reports.export\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:38;a:4:{s:1:\"a\";i:39;s:1:\"b\";s:15:\"audit_logs.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:39;a:4:{s:1:\"a\";i:40;s:1:\"b\";s:15:\"settings.manage\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:40;a:4:{s:1:\"a\";i:41;s:1:\"b\";s:16:\"assignments.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:41;a:4:{s:1:\"a\";i:42;s:1:\"b\";s:18:\"assignments.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:42;a:4:{s:1:\"a\";i:43;s:1:\"b\";s:18:\"assignments.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}}s:5:\"roles\";a:2:{i:0;a:3:{s:1:\"a\";i:1;s:1:\"b\";s:5:\"admin\";s:1:\"c\";s:3:\"web\";}i:1;a:3:{s:1:\"a\";i:2;s:1:\"b\";s:13:\"asset_manager\";s:1:\"c\";s:3:\"web\";}}}',1782343720);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custom_alert_rules`
--

DROP TABLE IF EXISTS `custom_alert_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_alert_rules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` bigint unsigned NOT NULL,
  `rule_name` varchar(255) NOT NULL,
  `rule_type` enum('speed_threshold','geofence_breach','inactivity','custom') NOT NULL,
  `condition` json DEFAULT NULL,
  `threshold_value` float DEFAULT NULL,
  `action` enum('email','sms','push','database') NOT NULL,
  `recipient_emails` json DEFAULT NULL,
  `recipient_phones` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `custom_alert_rules_asset_id_is_active_index` (`asset_id`,`is_active`),
  KEY `custom_alert_rules_created_by_foreign` (`created_by`),
  CONSTRAINT `custom_alert_rules_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `custom_alert_rules_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custom_alert_rules`
--

LOCK TABLES `custom_alert_rules` WRITE;
/*!40000 ALTER TABLE `custom_alert_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `custom_alert_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_name_unique` (`name`),
  UNIQUE KEY `departments_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'ICT DEPARTMENT','ICT','TEST','2026-05-19 15:02:54','2026-05-25 00:38:26');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `device_tokens`
--

DROP TABLE IF EXISTS `device_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `device_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token` text NOT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `platform` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_tokens_user_id_token_unique` (`user_id`,`token`(255)),
  KEY `device_tokens_user_id_index` (`user_id`),
  CONSTRAINT `device_tokens_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `device_tokens`
--

LOCK TABLES `device_tokens` WRITE;
/*!40000 ALTER TABLE `device_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `device_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `geofences`
--

DROP TABLE IF EXISTS `geofences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `geofences` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` bigint unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `center_latitude` decimal(10,8) NOT NULL,
  `center_longitude` decimal(11,8) NOT NULL,
  `radius_meters` int NOT NULL DEFAULT '100',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `geofences_asset_fk` (`asset_id`),
  KEY `geofences_user_fk` (`created_by`),
  CONSTRAINT `geofences_asset_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `geofences_user_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `geofences`
--

LOCK TABLES `geofences` WRITE;
/*!40000 ALTER TABLE `geofences` DISABLE KEYS */;
/*!40000 ALTER TABLE `geofences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location_logs`
--

DROP TABLE IF EXISTS `location_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tracker_device_id` bigint unsigned NOT NULL,
  `asset_id` bigint unsigned DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `speed` decimal(5,2) DEFAULT NULL,
  `motion_detected` tinyint(1) NOT NULL DEFAULT '0',
  `recorded_at` timestamp NULL DEFAULT NULL,
  `received_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `location_logs_device_fk` (`tracker_device_id`),
  KEY `location_logs_asset_id_recorded_at_index` (`asset_id`,`recorded_at`),
  KEY `location_logs_processed_index` (`processed`),
  CONSTRAINT `location_logs_asset_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `location_logs_device_fk` FOREIGN KEY (`tracker_device_id`) REFERENCES `tracker_devices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=226 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location_logs`
--

LOCK TABLES `location_logs` WRITE;
/*!40000 ALTER TABLE `location_logs` DISABLE KEYS */;
INSERT INTO `location_logs` VALUES (1,2,1,-6.97647383,39.09375300,0.15,0,'2026-06-22 22:28:32','2026-06-22 22:28:32',0,'2026-06-22 22:28:32','2026-06-22 22:28:32'),(2,2,1,-6.97648533,39.09374767,0.17,0,'2026-06-22 22:29:02','2026-06-22 22:29:02',0,'2026-06-22 22:29:02','2026-06-22 22:29:02'),(3,2,1,-6.97647750,39.09375183,0.22,0,'2026-06-22 22:29:32','2026-06-22 22:29:32',0,'2026-06-22 22:29:32','2026-06-22 22:29:32'),(4,2,1,-6.97647350,39.09375950,0.13,0,'2026-06-22 22:30:02','2026-06-22 22:30:02',0,'2026-06-22 22:30:02','2026-06-22 22:30:02'),(5,2,1,-6.97647667,39.09376400,0.52,0,'2026-06-22 22:30:32','2026-06-22 22:30:32',0,'2026-06-22 22:30:32','2026-06-22 22:30:32'),(6,2,1,-6.97647817,39.09376217,0.80,0,'2026-06-22 22:31:02','2026-06-22 22:31:02',0,'2026-06-22 22:31:02','2026-06-22 22:31:02'),(7,2,1,-6.97647617,39.09375433,0.30,0,'2026-06-22 22:31:32','2026-06-22 22:31:32',0,'2026-06-22 22:31:32','2026-06-22 22:31:32'),(8,2,1,-6.97647550,39.09375117,1.07,0,'2026-06-22 22:32:02','2026-06-22 22:32:02',0,'2026-06-22 22:32:02','2026-06-22 22:32:02'),(9,2,1,-6.97648333,39.09373150,0.09,0,'2026-06-22 22:32:32','2026-06-22 22:32:32',0,'2026-06-22 22:32:32','2026-06-22 22:32:32'),(10,2,1,-6.97647100,39.09373017,0.17,0,'2026-06-22 22:33:02','2026-06-22 22:33:02',0,'2026-06-22 22:33:02','2026-06-22 22:33:02'),(11,2,1,-6.97649100,39.09372400,0.20,0,'2026-06-22 22:33:32','2026-06-22 22:33:32',0,'2026-06-22 22:33:32','2026-06-22 22:33:32'),(12,2,1,-6.97650783,39.09372633,0.48,0,'2026-06-22 22:34:02','2026-06-22 22:34:02',0,'2026-06-22 22:34:02','2026-06-22 22:34:02'),(13,2,1,-6.97651700,39.09369383,0.56,0,'2026-06-22 22:34:32','2026-06-22 22:34:32',0,'2026-06-22 22:34:32','2026-06-22 22:34:32'),(14,2,1,-6.97649267,39.09368383,0.15,0,'2026-06-22 22:35:02','2026-06-22 22:35:02',0,'2026-06-22 22:35:02','2026-06-22 22:35:02'),(15,2,1,-6.97646950,39.09372367,0.39,0,'2026-06-22 22:35:32','2026-06-22 22:35:32',0,'2026-06-22 22:35:32','2026-06-22 22:35:32'),(16,2,1,-6.97646750,39.09375183,1.04,0,'2026-06-22 22:36:02','2026-06-22 22:36:02',0,'2026-06-22 22:36:02','2026-06-22 22:36:02'),(17,2,1,-6.97645583,39.09373983,0.39,0,'2026-06-22 22:36:32','2026-06-22 22:36:32',0,'2026-06-22 22:36:32','2026-06-22 22:36:32'),(18,2,1,-6.97646433,39.09373400,0.41,0,'2026-06-22 22:37:02','2026-06-22 22:37:02',0,'2026-06-22 22:37:02','2026-06-22 22:37:02'),(19,2,1,-6.97645150,39.09373317,0.24,0,'2026-06-22 22:37:32','2026-06-22 22:37:32',0,'2026-06-22 22:37:32','2026-06-22 22:37:32'),(20,2,1,-6.97646583,39.09376633,0.43,0,'2026-06-22 22:38:02','2026-06-22 22:38:02',0,'2026-06-22 22:38:02','2026-06-22 22:38:02'),(21,2,1,-6.97646917,39.09374667,0.09,0,'2026-06-22 22:38:32','2026-06-22 22:38:32',0,'2026-06-22 22:38:32','2026-06-22 22:38:32'),(22,2,1,-6.97645767,39.09372733,0.15,0,'2026-06-22 22:39:02','2026-06-22 22:39:02',0,'2026-06-22 22:39:02','2026-06-22 22:39:02'),(23,2,1,-6.97645700,39.09372517,0.06,0,'2026-06-22 22:39:32','2026-06-22 22:39:32',0,'2026-06-22 22:39:32','2026-06-22 22:39:32'),(24,2,1,-6.97645800,39.09374167,0.54,0,'2026-06-22 22:40:02','2026-06-22 22:40:02',0,'2026-06-22 22:40:02','2026-06-22 22:40:02'),(25,2,1,-6.97646367,39.09373467,0.67,0,'2026-06-22 22:40:32','2026-06-22 22:40:32',0,'2026-06-22 22:40:32','2026-06-22 22:40:32'),(26,2,1,-6.97645683,39.09372117,0.56,0,'2026-06-22 22:41:02','2026-06-22 22:41:02',0,'2026-06-22 22:41:02','2026-06-22 22:41:02'),(27,2,1,-6.97645783,39.09372333,0.22,0,'2026-06-22 22:41:32','2026-06-22 22:41:32',0,'2026-06-22 22:41:32','2026-06-22 22:41:32'),(28,2,1,-6.97646233,39.09372683,0.69,0,'2026-06-22 22:42:02','2026-06-22 22:42:02',0,'2026-06-22 22:42:02','2026-06-22 22:42:02'),(29,2,1,-6.97646783,39.09374000,0.31,0,'2026-06-22 22:42:32','2026-06-22 22:42:32',0,'2026-06-22 22:42:32','2026-06-22 22:42:32'),(30,2,1,-6.97644417,39.09373633,1.33,0,'2026-06-22 22:43:02','2026-06-22 22:43:02',0,'2026-06-22 22:43:02','2026-06-22 22:43:02'),(31,2,1,-6.97645033,39.09373150,0.15,0,'2026-06-22 22:43:32','2026-06-22 22:43:32',0,'2026-06-22 22:43:32','2026-06-22 22:43:32'),(32,2,1,-6.97645400,39.09371617,0.50,0,'2026-06-22 22:44:02','2026-06-22 22:44:02',0,'2026-06-22 22:44:02','2026-06-22 22:44:02'),(33,2,1,-6.97644383,39.09372467,0.57,0,'2026-06-22 22:44:32','2026-06-22 22:44:32',0,'2026-06-22 22:44:32','2026-06-22 22:44:32'),(34,2,1,-6.97642500,39.09372183,0.44,0,'2026-06-22 22:45:02','2026-06-22 22:45:02',0,'2026-06-22 22:45:02','2026-06-22 22:45:02'),(35,2,1,-6.97647383,39.09373717,0.17,0,'2026-06-22 22:45:32','2026-06-22 22:45:32',0,'2026-06-22 22:45:32','2026-06-22 22:45:32'),(36,2,1,-6.97648683,39.09373717,0.43,0,'2026-06-22 22:46:02','2026-06-22 22:46:02',0,'2026-06-22 22:46:02','2026-06-22 22:46:02'),(37,2,1,-6.97647250,39.09374100,0.24,0,'2026-06-22 22:46:32','2026-06-22 22:46:32',0,'2026-06-22 22:46:32','2026-06-22 22:46:32'),(38,2,1,-6.97649583,39.09375400,0.54,0,'2026-06-22 22:47:02','2026-06-22 22:47:02',0,'2026-06-22 22:47:02','2026-06-22 22:47:02'),(39,2,1,-6.97647283,39.09376483,0.24,0,'2026-06-22 22:47:32','2026-06-22 22:47:32',0,'2026-06-22 22:47:32','2026-06-22 22:47:32'),(40,2,1,-6.97646333,39.09375950,0.02,0,'2026-06-22 22:48:02','2026-06-22 22:48:02',0,'2026-06-22 22:48:02','2026-06-22 22:48:02'),(41,2,1,-6.97645300,39.09375650,0.30,0,'2026-06-22 22:48:32','2026-06-22 22:48:32',0,'2026-06-22 22:48:32','2026-06-22 22:48:32'),(42,2,1,-6.97646267,39.09375517,0.67,0,'2026-06-22 22:49:02','2026-06-22 22:49:02',0,'2026-06-22 22:49:02','2026-06-22 22:49:02'),(43,2,1,-6.97645867,39.09375333,0.17,0,'2026-06-22 22:49:32','2026-06-22 22:49:32',0,'2026-06-22 22:49:32','2026-06-22 22:49:32'),(44,2,1,-6.97646400,39.09376867,0.39,0,'2026-06-22 22:50:02','2026-06-22 22:50:02',0,'2026-06-22 22:50:02','2026-06-22 22:50:02'),(45,2,1,-6.97647667,39.09374300,0.20,0,'2026-06-22 22:50:32','2026-06-22 22:50:32',0,'2026-06-22 22:50:32','2026-06-22 22:50:32'),(46,2,1,-6.97647900,39.09374800,0.06,0,'2026-06-22 22:51:02','2026-06-22 22:51:02',0,'2026-06-22 22:51:02','2026-06-22 22:51:02'),(47,2,1,-6.97649517,39.09374733,1.31,0,'2026-06-22 22:51:32','2026-06-22 22:51:32',0,'2026-06-22 22:51:32','2026-06-22 22:51:32'),(48,2,1,-6.97649167,39.09373900,0.09,0,'2026-06-22 22:52:02','2026-06-22 22:52:02',0,'2026-06-22 22:52:02','2026-06-22 22:52:02'),(49,2,1,-6.97647033,39.09374167,0.15,0,'2026-06-22 22:52:32','2026-06-22 22:52:32',0,'2026-06-22 22:52:32','2026-06-22 22:52:32'),(50,2,1,-6.97648833,39.09373617,0.59,0,'2026-06-22 22:53:02','2026-06-22 22:53:02',0,'2026-06-22 22:53:02','2026-06-22 22:53:02'),(51,2,1,-6.97651000,39.09374400,0.43,0,'2026-06-22 22:53:32','2026-06-22 22:53:32',0,'2026-06-22 22:53:32','2026-06-22 22:53:32'),(52,2,1,-6.97648633,39.09375750,0.76,0,'2026-06-22 22:54:02','2026-06-22 22:54:02',0,'2026-06-22 22:54:02','2026-06-22 22:54:02'),(53,2,1,-6.97644500,39.09375267,0.72,0,'2026-06-22 22:54:32','2026-06-22 22:54:32',0,'2026-06-22 22:54:32','2026-06-22 22:54:32'),(54,2,1,-6.97643450,39.09374317,0.39,0,'2026-06-22 22:55:02','2026-06-22 22:55:02',0,'2026-06-22 22:55:02','2026-06-22 22:55:02'),(55,2,1,-6.97645000,39.09373350,0.17,0,'2026-06-22 22:55:31','2026-06-22 22:55:31',0,'2026-06-22 22:55:31','2026-06-22 22:55:31'),(56,2,1,-6.97645950,39.09371667,0.67,0,'2026-06-22 22:56:02','2026-06-22 22:56:02',0,'2026-06-22 22:56:02','2026-06-22 22:56:02'),(57,2,1,-6.97646383,39.09371267,1.31,0,'2026-06-22 22:56:31','2026-06-22 22:56:31',0,'2026-06-22 22:56:31','2026-06-22 22:56:31'),(58,2,1,-6.97648533,39.09372433,0.61,0,'2026-06-22 22:57:02','2026-06-22 22:57:02',0,'2026-06-22 22:57:02','2026-06-22 22:57:02'),(59,2,1,-6.97650317,39.09372300,0.61,0,'2026-06-22 22:57:32','2026-06-22 22:57:32',0,'2026-06-22 22:57:32','2026-06-22 22:57:32'),(60,2,1,-6.97648683,39.09374800,0.39,0,'2026-06-22 22:58:02','2026-06-22 22:58:02',0,'2026-06-22 22:58:02','2026-06-22 22:58:02'),(61,2,1,-6.97648200,39.09374700,0.48,0,'2026-06-22 22:58:31','2026-06-22 22:58:31',0,'2026-06-22 22:58:31','2026-06-22 22:58:31'),(62,2,1,-6.97647783,39.09373217,0.20,0,'2026-06-22 22:59:02','2026-06-22 22:59:02',0,'2026-06-22 22:59:02','2026-06-22 22:59:02'),(63,2,1,-6.97647067,39.09372567,0.48,0,'2026-06-22 22:59:31','2026-06-22 22:59:31',0,'2026-06-22 22:59:31','2026-06-22 22:59:31'),(64,2,1,-6.97647900,39.09374050,0.80,0,'2026-06-22 23:00:02','2026-06-22 23:00:02',0,'2026-06-22 23:00:02','2026-06-22 23:00:02'),(65,2,1,-6.97647850,39.09371333,0.46,0,'2026-06-22 23:00:32','2026-06-22 23:00:32',0,'2026-06-22 23:00:32','2026-06-22 23:00:32'),(66,2,1,-6.97647267,39.09372017,0.20,0,'2026-06-22 23:01:02','2026-06-22 23:01:02',0,'2026-06-22 23:01:02','2026-06-22 23:01:02'),(67,2,1,-6.97646433,39.09371567,0.11,0,'2026-06-22 23:01:31','2026-06-22 23:01:31',0,'2026-06-22 23:01:31','2026-06-22 23:01:31'),(68,2,1,-6.97648833,39.09370483,1.87,0,'2026-06-22 23:02:02','2026-06-22 23:02:02',0,'2026-06-22 23:02:02','2026-06-22 23:02:02'),(69,2,1,-6.97645050,39.09375817,0.69,0,'2026-06-22 23:02:32','2026-06-22 23:02:32',0,'2026-06-22 23:02:32','2026-06-22 23:02:32'),(70,2,1,-6.97646067,39.09375417,0.59,0,'2026-06-22 23:03:01','2026-06-22 23:03:01',0,'2026-06-22 23:03:01','2026-06-22 23:03:01'),(71,2,1,-6.97646867,39.09372783,0.81,0,'2026-06-22 23:03:32','2026-06-22 23:03:32',0,'2026-06-22 23:03:32','2026-06-22 23:03:32'),(72,2,1,-6.97647333,39.09372683,0.22,0,'2026-06-22 23:04:02','2026-06-22 23:04:02',0,'2026-06-22 23:04:02','2026-06-22 23:04:02'),(73,2,1,-6.97644350,39.09370600,0.83,0,'2026-06-22 23:04:32','2026-06-22 23:04:32',0,'2026-06-22 23:04:32','2026-06-22 23:04:32'),(74,2,1,-6.97642550,39.09372250,0.35,0,'2026-06-22 23:05:02','2026-06-22 23:05:02',0,'2026-06-22 23:05:02','2026-06-22 23:05:02'),(75,2,1,-6.97644083,39.09372000,0.87,0,'2026-06-22 23:05:32','2026-06-22 23:05:32',0,'2026-06-22 23:05:32','2026-06-22 23:05:32'),(76,2,1,-6.97643633,39.09371217,0.59,0,'2026-06-22 23:06:01','2026-06-22 23:06:01',0,'2026-06-22 23:06:01','2026-06-22 23:06:01'),(77,2,1,-6.97648383,39.09371667,0.59,0,'2026-06-22 23:10:02','2026-06-22 23:10:02',0,'2026-06-22 23:10:02','2026-06-22 23:10:02'),(78,2,1,-6.97647817,39.09371433,1.65,0,'2026-06-22 23:10:32','2026-06-22 23:10:32',0,'2026-06-22 23:10:32','2026-06-22 23:10:32'),(79,2,1,-6.97646433,39.09370983,0.80,0,'2026-06-22 23:11:02','2026-06-22 23:11:02',0,'2026-06-22 23:11:02','2026-06-22 23:11:02'),(80,2,1,-6.97643933,39.09372617,1.09,0,'2026-06-22 23:11:32','2026-06-22 23:11:32',0,'2026-06-22 23:11:32','2026-06-22 23:11:32'),(81,2,1,-6.97643450,39.09372683,0.28,0,'2026-06-22 23:12:01','2026-06-22 23:12:01',0,'2026-06-22 23:12:01','2026-06-22 23:12:01'),(82,2,1,-6.97646267,39.09370433,0.46,0,'2026-06-22 23:12:32','2026-06-22 23:12:32',0,'2026-06-22 23:12:32','2026-06-22 23:12:32'),(83,2,1,-6.97647517,39.09374417,1.04,0,'2026-06-22 23:13:01','2026-06-22 23:13:01',0,'2026-06-22 23:13:01','2026-06-22 23:13:01'),(84,2,1,-6.97648833,39.09371717,2.33,0,'2026-06-22 23:13:32','2026-06-22 23:13:32',0,'2026-06-22 23:13:32','2026-06-22 23:13:32'),(85,2,1,-6.97648150,39.09378500,1.41,0,'2026-06-22 23:14:02','2026-06-22 23:14:02',0,'2026-06-22 23:14:02','2026-06-22 23:14:02'),(86,2,1,-6.97647683,39.09378400,1.31,0,'2026-06-22 23:14:32','2026-06-22 23:14:32',0,'2026-06-22 23:14:32','2026-06-22 23:14:32'),(87,2,1,-6.97648667,39.09375283,0.65,0,'2026-06-22 23:15:01','2026-06-22 23:15:01',0,'2026-06-22 23:15:01','2026-06-22 23:15:01'),(88,2,1,-6.97651600,39.09375000,0.30,0,'2026-06-22 23:15:32','2026-06-22 23:15:32',0,'2026-06-22 23:15:32','2026-06-22 23:15:32'),(89,2,1,-6.97651733,39.09375317,0.37,0,'2026-06-22 23:16:01','2026-06-22 23:16:01',0,'2026-06-22 23:16:01','2026-06-22 23:16:01'),(90,2,1,-6.97651717,39.09375033,0.94,0,'2026-06-22 23:16:31','2026-06-22 23:16:31',0,'2026-06-22 23:16:31','2026-06-22 23:16:31'),(91,2,1,-6.97650533,39.09375150,0.26,0,'2026-06-22 23:17:02','2026-06-22 23:17:02',0,'2026-06-22 23:17:02','2026-06-22 23:17:02'),(92,2,1,-6.97649350,39.09373717,3.41,0,'2026-06-22 23:17:31','2026-06-22 23:17:31',0,'2026-06-22 23:17:31','2026-06-22 23:17:31'),(93,2,1,-6.97648267,39.09372117,0.24,0,'2026-06-22 23:18:02','2026-06-22 23:18:02',0,'2026-06-22 23:18:02','2026-06-22 23:18:02'),(94,2,1,-6.97649450,39.09372467,0.83,0,'2026-06-22 23:18:32','2026-06-22 23:18:32',0,'2026-06-22 23:18:32','2026-06-22 23:18:32'),(95,2,1,-6.97646833,39.09377917,2.30,0,'2026-06-22 23:19:02','2026-06-22 23:19:02',0,'2026-06-22 23:19:02','2026-06-22 23:19:02'),(96,2,1,-6.97648733,39.09377183,1.54,0,'2026-06-22 23:19:31','2026-06-22 23:19:31',0,'2026-06-22 23:19:31','2026-06-22 23:19:31'),(97,2,1,-6.97648883,39.09378117,2.44,0,'2026-06-22 23:20:02','2026-06-22 23:20:02',0,'2026-06-22 23:20:02','2026-06-22 23:20:02'),(98,2,1,-6.97648533,39.09378283,2.26,0,'2026-06-22 23:20:31','2026-06-22 23:20:31',0,'2026-06-22 23:20:31','2026-06-22 23:20:31'),(99,2,1,-6.97647283,39.09373250,0.65,0,'2026-06-22 23:21:02','2026-06-22 23:21:02',0,'2026-06-22 23:21:02','2026-06-22 23:21:02'),(100,2,1,-6.97649233,39.09378100,0.26,0,'2026-06-22 23:21:32','2026-06-22 23:21:32',0,'2026-06-22 23:21:32','2026-06-22 23:21:32'),(101,2,1,-6.97650050,39.09377033,0.35,0,'2026-06-22 23:22:02','2026-06-22 23:22:02',0,'2026-06-22 23:22:02','2026-06-22 23:22:02'),(102,2,1,-6.97647050,39.09376983,1.30,0,'2026-06-22 23:22:31','2026-06-22 23:22:31',0,'2026-06-22 23:22:31','2026-06-22 23:22:31'),(103,2,1,-6.97647550,39.09377017,0.56,0,'2026-06-22 23:23:02','2026-06-22 23:23:02',0,'2026-06-22 23:23:02','2026-06-22 23:23:02'),(104,2,1,-6.97648233,39.09372350,0.24,0,'2026-06-22 23:23:31','2026-06-22 23:23:31',0,'2026-06-22 23:23:31','2026-06-22 23:23:31'),(105,2,1,-6.97650033,39.09373567,0.20,0,'2026-06-22 23:24:02','2026-06-22 23:24:02',0,'2026-06-22 23:24:02','2026-06-22 23:24:02'),(106,2,1,-6.97649683,39.09376333,0.26,0,'2026-06-22 23:24:32','2026-06-22 23:24:32',0,'2026-06-22 23:24:32','2026-06-22 23:24:32'),(107,2,1,-6.97647483,39.09378367,0.61,0,'2026-06-22 23:25:03','2026-06-22 23:25:03',0,'2026-06-22 23:25:03','2026-06-22 23:25:03'),(108,2,1,-6.97644433,39.09378317,2.30,0,'2026-06-22 23:25:31','2026-06-22 23:25:31',0,'2026-06-22 23:25:31','2026-06-22 23:25:31'),(109,2,1,-6.97644300,39.09378417,0.43,0,'2026-06-22 23:26:02','2026-06-22 23:26:02',0,'2026-06-22 23:26:02','2026-06-22 23:26:02'),(110,2,1,-6.97644017,39.09377117,0.33,0,'2026-06-22 23:26:31','2026-06-22 23:26:31',0,'2026-06-22 23:26:31','2026-06-22 23:26:31'),(111,2,1,-6.97644600,39.09375683,0.06,0,'2026-06-22 23:27:01','2026-06-22 23:27:01',0,'2026-06-22 23:27:01','2026-06-22 23:27:01'),(112,2,1,-6.97644633,39.09376733,0.80,0,'2026-06-22 23:27:32','2026-06-22 23:27:32',0,'2026-06-22 23:27:32','2026-06-22 23:27:32'),(113,2,1,-6.97643917,39.09376083,0.30,0,'2026-06-22 23:28:02','2026-06-22 23:28:02',0,'2026-06-22 23:28:02','2026-06-22 23:28:02'),(114,2,1,-6.97644000,39.09374800,0.20,0,'2026-06-22 23:28:31','2026-06-22 23:28:31',0,'2026-06-22 23:28:31','2026-06-22 23:28:31'),(115,2,1,-6.97645050,39.09374817,0.28,0,'2026-06-22 23:29:02','2026-06-22 23:29:02',0,'2026-06-22 23:29:02','2026-06-22 23:29:02'),(116,2,1,-6.97644650,39.09373967,0.63,0,'2026-06-22 23:29:31','2026-06-22 23:29:31',0,'2026-06-22 23:29:31','2026-06-22 23:29:31'),(117,2,1,-6.97645083,39.09372683,0.31,0,'2026-06-22 23:30:01','2026-06-22 23:30:01',0,'2026-06-22 23:30:01','2026-06-22 23:30:01'),(118,2,1,-6.97646433,39.09369900,1.09,0,'2026-06-22 23:30:32','2026-06-22 23:30:32',0,'2026-06-22 23:30:32','2026-06-22 23:30:32'),(119,2,1,-6.97645550,39.09372683,1.17,0,'2026-06-22 23:31:01','2026-06-22 23:31:01',0,'2026-06-22 23:31:01','2026-06-22 23:31:01'),(120,2,1,-6.97644617,39.09376267,0.41,0,'2026-06-22 23:31:32','2026-06-22 23:31:32',0,'2026-06-22 23:31:32','2026-06-22 23:31:32'),(121,2,1,-6.97644183,39.09375833,0.04,0,'2026-06-22 23:32:02','2026-06-22 23:32:02',0,'2026-06-22 23:32:02','2026-06-22 23:32:02'),(122,2,1,-6.97646017,39.09375983,0.81,0,'2026-06-23 02:11:22','2026-06-23 02:11:22',0,'2026-06-23 02:11:22','2026-06-23 02:11:22'),(123,2,1,-6.97648400,39.09372183,0.65,0,'2026-06-23 02:11:52','2026-06-23 02:11:52',0,'2026-06-23 02:11:52','2026-06-23 02:11:52'),(124,2,1,-6.97655050,39.09371850,0.39,0,'2026-06-23 02:12:22','2026-06-23 02:12:22',0,'2026-06-23 02:12:22','2026-06-23 02:12:22'),(125,2,1,-6.97654617,39.09375117,1.44,0,'2026-06-23 02:12:52','2026-06-23 02:12:52',0,'2026-06-23 02:12:52','2026-06-23 02:12:52'),(126,2,1,-6.97655617,39.09384367,0.41,0,'2026-06-23 02:13:22','2026-06-23 02:13:22',0,'2026-06-23 02:13:22','2026-06-23 02:13:22'),(127,2,1,-6.97659883,39.09385267,2.61,0,'2026-06-23 02:13:52','2026-06-23 02:13:52',0,'2026-06-23 02:13:52','2026-06-23 02:13:52'),(128,2,1,-6.97649383,39.09382083,0.54,0,'2026-06-23 02:14:22','2026-06-23 02:14:22',0,'2026-06-23 02:14:22','2026-06-23 02:14:22'),(129,2,1,-6.97650250,39.09382300,3.39,0,'2026-06-23 02:14:53','2026-06-23 02:14:53',0,'2026-06-23 02:14:53','2026-06-23 02:14:53'),(130,2,1,-6.97647817,39.09386167,0.22,0,'2026-06-23 02:15:22','2026-06-23 02:15:22',0,'2026-06-23 02:15:22','2026-06-23 02:15:22'),(131,2,1,-6.97651500,39.09387150,1.07,0,'2026-06-23 02:15:52','2026-06-23 02:15:52',0,'2026-06-23 02:15:52','2026-06-23 02:15:52'),(132,2,1,-6.97636633,39.09387433,0.87,0,'2026-06-23 02:38:56','2026-06-23 02:38:56',0,'2026-06-23 02:38:56','2026-06-23 02:38:56'),(133,2,1,-6.97645333,39.09381583,1.48,0,'2026-06-23 02:39:26','2026-06-23 02:39:26',0,'2026-06-23 02:39:26','2026-06-23 02:39:26'),(134,2,1,-6.97641450,39.09374533,0.83,0,'2026-06-23 02:39:56','2026-06-23 02:39:56',0,'2026-06-23 02:39:56','2026-06-23 02:39:56'),(135,2,1,-6.97639200,39.09376050,6.26,0,'2026-06-23 02:40:26','2026-06-23 02:40:26',0,'2026-06-23 02:40:26','2026-06-23 02:40:26'),(136,2,1,-6.97645833,39.09384983,1.09,0,'2026-06-23 02:40:56','2026-06-23 02:40:56',0,'2026-06-23 02:40:56','2026-06-23 02:40:56'),(137,2,1,-6.97649033,39.09394900,0.24,0,'2026-06-23 02:41:26','2026-06-23 02:41:26',0,'2026-06-23 02:41:26','2026-06-23 02:41:26'),(138,2,1,-6.97647200,39.09389067,1.24,0,'2026-06-23 02:41:56','2026-06-23 02:41:56',0,'2026-06-23 02:41:56','2026-06-23 02:41:56'),(139,2,1,-6.97643150,39.09379783,0.93,0,'2026-06-23 02:42:26','2026-06-23 02:42:26',0,'2026-06-23 02:42:26','2026-06-23 02:42:26'),(140,2,1,-6.97645550,39.09379433,0.24,0,'2026-06-23 02:42:56','2026-06-23 02:42:56',0,'2026-06-23 02:42:56','2026-06-23 02:42:56'),(141,2,1,-6.97646117,39.09376067,0.24,0,'2026-06-23 02:43:26','2026-06-23 02:43:26',0,'2026-06-23 02:43:26','2026-06-23 02:43:26'),(142,2,1,-6.97647483,39.09372683,0.28,0,'2026-06-23 02:43:56','2026-06-23 02:43:56',0,'2026-06-23 02:43:56','2026-06-23 02:43:56'),(143,2,1,-6.97646067,39.09368383,0.83,0,'2026-06-23 02:44:26','2026-06-23 02:44:26',0,'2026-06-23 02:44:26','2026-06-23 02:44:26'),(144,2,1,-6.97648200,39.09364767,0.52,0,'2026-06-23 02:44:56','2026-06-23 02:44:56',0,'2026-06-23 02:44:56','2026-06-23 02:44:56'),(145,2,1,-6.97647050,39.09370017,1.35,0,'2026-06-23 02:45:26','2026-06-23 02:45:26',0,'2026-06-23 02:45:26','2026-06-23 02:45:26'),(146,2,1,-6.97650900,39.09368883,0.19,0,'2026-06-23 02:45:56','2026-06-23 02:45:56',0,'2026-06-23 02:45:56','2026-06-23 02:45:56'),(147,2,1,-6.97648250,39.09374250,0.70,0,'2026-06-23 02:46:26','2026-06-23 02:46:26',0,'2026-06-23 02:46:26','2026-06-23 02:46:26'),(148,2,1,-6.97644833,39.09371667,0.17,0,'2026-06-23 02:46:56','2026-06-23 02:46:56',0,'2026-06-23 02:46:56','2026-06-23 02:46:56'),(149,2,1,-6.97644117,39.09371233,0.06,0,'2026-06-23 02:47:26','2026-06-23 02:47:26',0,'2026-06-23 02:47:26','2026-06-23 02:47:26'),(150,2,1,-6.97644933,39.09375750,0.11,0,'2026-06-23 02:47:57','2026-06-23 02:47:57',0,'2026-06-23 02:47:57','2026-06-23 02:47:57'),(151,2,1,-6.97644517,39.09377050,0.02,0,'2026-06-23 02:48:26','2026-06-23 02:48:26',0,'2026-06-23 02:48:26','2026-06-23 02:48:26'),(152,2,1,-6.97644967,39.09374317,0.33,0,'2026-06-23 02:48:57','2026-06-23 02:48:57',0,'2026-06-23 02:48:57','2026-06-23 02:48:57'),(153,2,1,-6.97644817,39.09374317,0.02,0,'2026-06-23 02:49:27','2026-06-23 02:49:27',0,'2026-06-23 02:49:27','2026-06-23 02:49:27'),(154,2,1,-6.97643750,39.09375283,0.22,0,'2026-06-23 02:49:56','2026-06-23 02:49:56',0,'2026-06-23 02:49:56','2026-06-23 02:49:56'),(155,2,1,-6.97647550,39.09373783,0.39,0,'2026-06-23 03:27:01','2026-06-23 03:27:01',0,'2026-06-23 03:27:01','2026-06-23 03:27:01'),(156,2,1,-6.97646917,39.09369967,0.17,0,'2026-06-23 03:27:29','2026-06-23 03:27:29',0,'2026-06-23 03:27:29','2026-06-23 03:27:29'),(157,2,1,-6.97645933,39.09368833,0.24,0,'2026-06-23 03:27:58','2026-06-23 03:27:58',0,'2026-06-23 03:27:58','2026-06-23 03:27:58'),(158,2,1,-6.97648633,39.09371567,0.28,0,'2026-06-23 03:28:28','2026-06-23 03:28:28',0,'2026-06-23 03:28:28','2026-06-23 03:28:28'),(159,2,1,-6.97649167,39.09372817,0.02,0,'2026-06-23 03:28:58','2026-06-23 03:28:58',0,'2026-06-23 03:28:58','2026-06-23 03:28:58'),(160,2,1,-6.97651150,39.09373083,0.39,0,'2026-06-23 03:29:29','2026-06-23 03:29:29',0,'2026-06-23 03:29:29','2026-06-23 03:29:29'),(161,2,1,-6.97650350,39.09376300,0.39,0,'2026-06-23 03:29:58','2026-06-23 03:29:58',0,'2026-06-23 03:29:58','2026-06-23 03:29:58'),(162,2,1,-6.97648333,39.09374400,0.30,0,'2026-06-23 03:30:29','2026-06-23 03:30:29',0,'2026-06-23 03:30:29','2026-06-23 03:30:29'),(163,2,1,-6.97649967,39.09374733,0.24,0,'2026-06-23 03:30:58','2026-06-23 03:30:58',0,'2026-06-23 03:30:58','2026-06-23 03:30:58'),(164,2,1,-6.97649917,39.09373267,0.19,0,'2026-06-23 03:31:28','2026-06-23 03:31:28',0,'2026-06-23 03:31:28','2026-06-23 03:31:28'),(165,2,1,-6.97650133,39.09373000,0.37,0,'2026-06-23 03:31:59','2026-06-23 03:31:59',0,'2026-06-23 03:31:59','2026-06-23 03:31:59'),(166,2,1,-6.97649417,39.09371600,0.94,0,'2026-06-23 03:32:29','2026-06-23 03:32:29',0,'2026-06-23 03:32:29','2026-06-23 03:32:29'),(167,2,1,-6.97648483,39.09373267,0.09,0,'2026-06-23 03:32:58','2026-06-23 03:32:58',0,'2026-06-23 03:32:58','2026-06-23 03:32:58'),(168,2,1,-6.97649617,39.09370917,1.56,0,'2026-06-23 03:33:30','2026-06-23 03:33:30',0,'2026-06-23 03:33:30','2026-06-23 03:33:30'),(169,2,1,-6.97647250,39.09372400,0.13,0,'2026-06-23 03:33:58','2026-06-23 03:33:58',0,'2026-06-23 03:33:58','2026-06-23 03:33:58'),(170,2,1,-6.97644617,39.09374950,0.24,0,'2026-06-23 03:34:28','2026-06-23 03:34:28',0,'2026-06-23 03:34:28','2026-06-23 03:34:28'),(171,2,1,-6.97644167,39.09376067,0.67,0,'2026-06-23 03:34:59','2026-06-23 03:34:59',0,'2026-06-23 03:34:59','2026-06-23 03:34:59'),(172,2,1,-6.97645167,39.09372967,0.19,0,'2026-06-23 03:35:28','2026-06-23 03:35:28',0,'2026-06-23 03:35:28','2026-06-23 03:35:28'),(173,2,1,-6.97645083,39.09373850,0.13,0,'2026-06-23 03:35:58','2026-06-23 03:35:58',0,'2026-06-23 03:35:58','2026-06-23 03:35:58'),(174,2,1,-6.97646350,39.09371650,0.76,0,'2026-06-23 03:36:29','2026-06-23 03:36:29',0,'2026-06-23 03:36:29','2026-06-23 03:36:29'),(175,2,1,-6.97642517,39.09376867,0.07,0,'2026-06-23 03:36:58','2026-06-23 03:36:58',0,'2026-06-23 03:36:58','2026-06-23 03:36:58'),(176,2,1,-6.97644133,39.09378067,0.11,0,'2026-06-23 03:37:28','2026-06-23 03:37:28',0,'2026-06-23 03:37:28','2026-06-23 03:37:28'),(177,2,1,-6.97649067,39.09374433,0.96,0,'2026-06-23 03:37:59','2026-06-23 03:37:59',0,'2026-06-23 03:37:59','2026-06-23 03:37:59'),(178,2,1,-6.97650267,39.09372600,1.37,0,'2026-06-23 03:38:28','2026-06-23 03:38:28',0,'2026-06-23 03:38:28','2026-06-23 03:38:28'),(179,2,1,-6.97648617,39.09373950,4.48,0,'2026-06-23 03:38:58','2026-06-23 03:38:58',0,'2026-06-23 03:38:58','2026-06-23 03:38:58'),(180,2,1,-6.97643583,39.09377267,1.22,0,'2026-06-23 03:39:29','2026-06-23 03:39:29',0,'2026-06-23 03:39:29','2026-06-23 03:39:29'),(181,2,1,-6.97650617,39.09370517,1.81,0,'2026-06-23 03:39:58','2026-06-23 03:39:58',0,'2026-06-23 03:39:58','2026-06-23 03:39:58'),(182,2,1,-6.97649233,39.09369350,0.78,0,'2026-06-23 03:40:28','2026-06-23 03:40:28',0,'2026-06-23 03:40:28','2026-06-23 03:40:28'),(183,2,1,-6.97649067,39.09370733,0.74,0,'2026-06-23 03:40:59','2026-06-23 03:40:59',0,'2026-06-23 03:40:59','2026-06-23 03:40:59'),(184,2,1,-6.97646633,39.09371567,0.07,0,'2026-06-23 03:41:28','2026-06-23 03:41:28',0,'2026-06-23 03:41:28','2026-06-23 03:41:28'),(185,2,1,-6.97645250,39.09372600,1.09,0,'2026-06-23 03:41:58','2026-06-23 03:41:58',0,'2026-06-23 03:41:58','2026-06-23 03:41:58'),(186,2,1,-6.97645150,39.09372617,0.15,0,'2026-06-23 03:42:29','2026-06-23 03:42:29',0,'2026-06-23 03:42:29','2026-06-23 03:42:29'),(187,2,1,-6.97645933,39.09372700,0.83,0,'2026-06-23 03:42:58','2026-06-23 03:42:58',0,'2026-06-23 03:42:58','2026-06-23 03:42:58'),(188,2,1,-6.97644867,39.09371967,1.06,0,'2026-06-23 03:43:28','2026-06-23 03:43:28',0,'2026-06-23 03:43:28','2026-06-23 03:43:28'),(189,2,1,-6.97646467,39.09371350,0.69,0,'2026-06-23 03:43:59','2026-06-23 03:43:59',0,'2026-06-23 03:43:59','2026-06-23 03:43:59'),(190,2,1,-6.97643467,39.09378583,2.13,0,'2026-06-23 03:44:28','2026-06-23 03:44:28',0,'2026-06-23 03:44:28','2026-06-23 03:44:28'),(191,2,1,-6.97642117,39.09376617,1.52,0,'2026-06-23 03:44:58','2026-06-23 03:44:58',0,'2026-06-23 03:44:58','2026-06-23 03:44:58'),(192,2,1,-6.97646817,39.09371500,1.54,0,'2026-06-23 03:45:29','2026-06-23 03:45:29',0,'2026-06-23 03:45:29','2026-06-23 03:45:29'),(193,2,1,-6.97646450,39.09370233,0.41,0,'2026-06-23 03:45:58','2026-06-23 03:45:58',0,'2026-06-23 03:45:58','2026-06-23 03:45:58'),(194,2,1,-6.97645633,39.09371917,0.17,0,'2026-06-23 03:46:28','2026-06-23 03:46:28',0,'2026-06-23 03:46:28','2026-06-23 03:46:28'),(195,2,1,-6.97645050,39.09373983,0.44,0,'2026-06-23 03:46:59','2026-06-23 03:46:59',0,'2026-06-23 03:46:59','2026-06-23 03:46:59'),(196,2,1,-6.97644750,39.09374250,0.44,0,'2026-06-23 03:47:28','2026-06-23 03:47:28',0,'2026-06-23 03:47:28','2026-06-23 03:47:28'),(197,2,1,-6.97645883,39.09370783,0.37,0,'2026-06-23 03:47:58','2026-06-23 03:47:58',0,'2026-06-23 03:47:58','2026-06-23 03:47:58'),(198,2,1,-6.97646283,39.09370467,1.07,0,'2026-06-23 03:48:29','2026-06-23 03:48:29',0,'2026-06-23 03:48:29','2026-06-23 03:48:29'),(199,2,1,-6.97647517,39.09370800,0.50,0,'2026-06-23 03:48:58','2026-06-23 03:48:58',0,'2026-06-23 03:48:58','2026-06-23 03:48:58'),(200,2,1,-6.97645117,39.09376067,1.06,0,'2026-06-23 03:49:28','2026-06-23 03:49:28',0,'2026-06-23 03:49:28','2026-06-23 03:49:28'),(201,2,1,-6.97645967,39.09374067,0.54,0,'2026-06-23 03:49:59','2026-06-23 03:49:59',0,'2026-06-23 03:49:59','2026-06-23 03:49:59'),(202,2,1,-6.97646383,39.09374783,0.20,0,'2026-06-23 03:50:28','2026-06-23 03:50:28',0,'2026-06-23 03:50:28','2026-06-23 03:50:28'),(203,2,1,-6.97644483,39.09373750,0.07,0,'2026-06-23 03:50:58','2026-06-23 03:50:58',0,'2026-06-23 03:50:58','2026-06-23 03:50:58'),(204,2,1,-6.97644917,39.09369533,3.33,0,'2026-06-23 03:51:29','2026-06-23 03:51:29',0,'2026-06-23 03:51:29','2026-06-23 03:51:29'),(205,2,1,-6.97645100,39.09372900,0.44,0,'2026-06-23 03:51:58','2026-06-23 03:51:58',0,'2026-06-23 03:51:58','2026-06-23 03:51:58'),(206,2,1,-6.97645500,39.09373367,0.35,0,'2026-06-23 03:52:28','2026-06-23 03:52:28',0,'2026-06-23 03:52:28','2026-06-23 03:52:28'),(207,2,1,-6.97647083,39.09371450,0.11,0,'2026-06-23 03:52:59','2026-06-23 03:52:59',0,'2026-06-23 03:52:59','2026-06-23 03:52:59'),(208,2,1,-6.97647733,39.09370983,0.39,0,'2026-06-23 03:53:28','2026-06-23 03:53:28',0,'2026-06-23 03:53:28','2026-06-23 03:53:28'),(209,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 03:53:58','2026-06-23 03:53:58',0,'2026-06-23 03:53:58','2026-06-23 03:53:58'),(210,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 03:54:29','2026-06-23 03:54:29',0,'2026-06-23 03:54:29','2026-06-23 03:54:29'),(211,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 03:54:58','2026-06-23 03:54:58',0,'2026-06-23 03:54:58','2026-06-23 03:54:58'),(212,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 03:55:28','2026-06-23 03:55:28',0,'2026-06-23 03:55:28','2026-06-23 03:55:28'),(213,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 03:55:58','2026-06-23 03:55:58',0,'2026-06-23 03:55:58','2026-06-23 03:55:58'),(214,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 03:56:28','2026-06-23 03:56:28',0,'2026-06-23 03:56:28','2026-06-23 03:56:28'),(215,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 03:56:58','2026-06-23 03:56:58',0,'2026-06-23 03:56:58','2026-06-23 03:56:58'),(216,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 03:57:28','2026-06-23 03:57:28',0,'2026-06-23 03:57:28','2026-06-23 03:57:28'),(217,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 03:57:58','2026-06-23 03:57:58',0,'2026-06-23 03:57:58','2026-06-23 03:57:58'),(218,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 04:00:33','2026-06-23 04:00:33',0,'2026-06-23 04:00:33','2026-06-23 04:00:33'),(219,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 04:01:03','2026-06-23 04:01:03',0,'2026-06-23 04:01:03','2026-06-23 04:01:03'),(220,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 04:01:29','2026-06-23 04:01:29',0,'2026-06-23 04:01:29','2026-06-23 04:01:29'),(221,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 04:02:00','2026-06-23 04:02:00',0,'2026-06-23 04:02:00','2026-06-23 04:02:00'),(222,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 04:04:35','2026-06-23 04:04:35',0,'2026-06-23 04:04:35','2026-06-23 04:04:35'),(223,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 04:05:04','2026-06-23 04:05:04',0,'2026-06-23 04:05:04','2026-06-23 04:05:04'),(224,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 04:05:30','2026-06-23 04:05:30',0,'2026-06-23 04:05:30','2026-06-23 04:05:30'),(225,2,1,-6.97647750,39.09370833,0.04,0,'2026-06-23 04:06:02','2026-06-23 04:06:02',0,'2026-06-23 04:06:02','2026-06-23 04:06:02');
/*!40000 ALTER TABLE `location_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_05_19_115719_add_two_factor_columns_to_users_table',2),(5,'2026_05_19_115720_create_passkeys_table',2),(6,'2026_05_19_121238_create_permission_tables',3),(7,'2026_05_19_144651_create_asset_categories_table',4),(8,'2026_05_19_144651_create_departments_table',4),(9,'2026_05_19_153100_add_phone_and_status_to_users_table',5),(10,'2026_05_20_043900_create_assets_table',6),(11,'2026_05_20_043901_create_tracker_devices_table',6),(12,'2026_05_20_043902_create_asset_device_assignments_table',7),(13,'2026_05_20_043903_create_geofences_table',7),(14,'2026_05_20_043904_create_location_logs_table',7),(15,'2026_05_20_043905_create_alerts_table',7);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_permissions`
--

DROP TABLE IF EXISTS `model_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `model_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `model_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_permissions`
--

LOCK TABLES `model_has_permissions` WRITE;
/*!40000 ALTER TABLE `model_has_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `model_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_roles`
--

DROP TABLE IF EXISTS `model_has_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `model_has_roles` (
  `role_id` bigint unsigned NOT NULL,
  `model_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_roles`
--

LOCK TABLES `model_has_roles` WRITE;
/*!40000 ALTER TABLE `model_has_roles` DISABLE KEYS */;
INSERT INTO `model_has_roles` VALUES (1,'App\\Models\\User',1),(2,'App\\Models\\User',2),(2,'App\\Models\\User',3),(2,'App\\Models\\User',5),(1,'App\\Models\\User',6),(2,'App\\Models\\User',7);
/*!40000 ALTER TABLE `model_has_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `passkeys`
--

DROP TABLE IF EXISTS `passkeys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `passkeys` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `credential_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `credential` json NOT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `passkeys_credential_id_unique` (`credential_id`),
  KEY `passkeys_user_id_index` (`user_id`),
  CONSTRAINT `passkeys_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `passkeys`
--

LOCK TABLES `passkeys` WRITE;
/*!40000 ALTER TABLE `passkeys` DISABLE KEYS */;
/*!40000 ALTER TABLE `passkeys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
INSERT INTO `password_reset_tokens` VALUES ('lumumbakaria98@gmail.com','$2y$12$NBRGwf1ACdLPf5XjYO6WweHYVGvNpKJ9vNWIXib3mJIDGsEAxUXxK','2026-05-26 14:26:34');
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'dashboard.admin.view','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(2,'dashboard.manager.view','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(3,'users.view','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(4,'users.create','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(5,'users.update','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(6,'users.delete','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(7,'roles.view','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(8,'roles.create','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(9,'roles.update','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(10,'roles.delete','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(11,'roles.assign','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(12,'departments.view','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(13,'departments.create','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(14,'departments.update','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(15,'departments.delete','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(16,'asset_categories.view','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(17,'asset_categories.create','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(18,'asset_categories.update','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(19,'asset_categories.delete','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(20,'assets.view','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(21,'assets.create','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(22,'assets.update','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(23,'assets.delete','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(24,'devices.view','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(25,'devices.create','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(26,'devices.update','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(27,'devices.delete','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(28,'devices.assign','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(29,'tracking.live_map.view','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(30,'tracking.history.view','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(31,'geofences.view','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(32,'geofences.create','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(33,'geofences.update','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(34,'geofences.delete','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(35,'alerts.view','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(36,'alerts.resolve','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(37,'reports.view','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(38,'reports.export','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(39,'audit_logs.view','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(40,'settings.manage','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(41,'assignments.view','web','2026-05-20 05:46:07','2026-05-20 05:46:07'),(42,'assignments.create','web','2026-05-20 05:46:07','2026-05-20 05:46:07'),(43,'assignments.delete','web','2026-05-20 05:46:07','2026-05-20 05:46:07');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_has_permissions`
--

DROP TABLE IF EXISTS `role_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_has_permissions_role_id_foreign` (`role_id`),
  CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_has_permissions`
--

LOCK TABLES `role_has_permissions` WRITE;
/*!40000 ALTER TABLE `role_has_permissions` DISABLE KEYS */;
INSERT INTO `role_has_permissions` VALUES (1,1),(2,1),(3,1),(4,1),(5,1),(6,1),(7,1),(8,1),(9,1),(10,1),(11,1),(12,1),(13,1),(14,1),(15,1),(16,1),(17,1),(18,1),(19,1),(20,1),(21,1),(22,1),(23,1),(24,1),(25,1),(26,1),(27,1),(28,1),(29,1),(30,1),(31,1),(32,1),(33,1),(34,1),(35,1),(36,1),(37,1),(38,1),(39,1),(40,1),(41,1),(42,1),(43,1),(2,2),(20,2),(21,2),(22,2),(29,2),(30,2),(31,2),(32,2),(33,2),(35,2);
/*!40000 ALTER TABLE `role_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'admin','web','2026-05-19 12:31:10','2026-05-19 12:31:10'),(2,'asset_manager','web','2026-05-19 12:31:10','2026-05-19 12:31:10');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('oPjLsRVER0QxWhaV5oVKFqkw2Qt47xPpAEtDJJkc',1,'100.64.0.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','YTo1OntzOjY6Il90b2tlbiI7czo0MDoiaFd6UUhsTG1CTWJlbGtyZDEyeWRrU3kwZHRCUHF6V0RvV1Q5RklwcCI7czozOiJ1cmwiO2E6MDp7fXM6OToiX3ByZXZpb3VzIjthOjI6e3M6MzoidXJsIjtzOjg2OiJodHRwOi8vc21hcnQtYXNzZXQtbWFuYWdlbWVudC1zeXN0ZW0tcHJvZHVjdGlvbi51cC5yYWlsd2F5LmFwcC9hZG1pbi90cmFja2luZy9saXZlLW1hcCI7czo1OiJyb3V0ZSI7czoyMzoiYWRtaW4udHJhY2tpbmcubGl2ZS1tYXAiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX1zOjUwOiJsb2dpbl93ZWJfNTliYTM2YWRkYzJiMmY5NDAxNTgwZjAxNGM3ZjU4ZWE0ZTMwOTg5ZCI7aToxO30=',1782257383);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tracker_devices`
--

DROP TABLE IF EXISTS `tracker_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tracker_devices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `device_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `imei` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sim_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `api_token_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','inactive','faulty') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `last_seen_at` timestamp NULL DEFAULT NULL,
  `battery_level` int DEFAULT NULL,
  `firmware_version` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tracker_devices_device_code_unique` (`device_code`),
  UNIQUE KEY `tracker_devices_api_token_hash_unique` (`api_token_hash`),
  UNIQUE KEY `tracker_devices_imei_unique` (`imei`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tracker_devices`
--

LOCK TABLES `tracker_devices` WRITE;
/*!40000 ALTER TABLE `tracker_devices` DISABLE KEYS */;
INSERT INTO `tracker_devices` VALUES (2,'trACKER 1','TEST333','4443332','3333','BASG','active',NULL,43,'43','2026-06-22 04:12:28','2026-06-22 04:12:28');
/*!40000 ALTER TABLE `tracker_devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_credentials`
--

DROP TABLE IF EXISTS `user_credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_credentials` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `temporary_password` text,
  `credentials_sent_at` timestamp NULL DEFAULT NULL,
  `password_reset_at` timestamp NULL DEFAULT NULL,
  `sent_to_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_credentials_user_id_index` (`user_id`),
  CONSTRAINT `user_credentials_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_credentials`
--

LOCK TABLES `user_credentials` WRITE;
/*!40000 ALTER TABLE `user_credentials` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_credentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_id` bigint unsigned DEFAULT NULL COMMENT 'Department assignment for asset managers. NULL for admin users.',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `two_factor_secret` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `two_factor_recovery_codes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `two_factor_confirmed_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_notifications_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `sms_notifications_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `push_notifications_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_department_id_index` (`department_id`),
  CONSTRAINT `users_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'System Administrator','admin@smartassets.test',NULL,NULL,NULL,'active',NULL,'$2y$12$ZgVnjVAdUdL/JRQP01MuS.tS.fbYJVDOAPGacDF0PwtPBbumZ0b4a',NULL,NULL,NULL,'zCL4edZKCzu0nZfb6gp9QK3vgAZB7MlOjte9aPkBX4JNL6VeZhLnMu8bakmK',1,0,0,'2026-05-19 12:31:10','2026-05-25 00:37:05'),(2,'Asset Manager','manager@smartassets.test',NULL,NULL,NULL,'active',NULL,'$2y$12$h77110GrMGh.snxK61AV6uB3t49PjNMLWjcACIn08Ha9WydyixDsm',NULL,NULL,NULL,NULL,1,0,0,'2026-05-19 12:31:10','2026-05-19 12:31:10'),(3,'eliya katindasa','eliya@gmail.com',NULL,'0617066702',1,'active',NULL,'$2y$12$RopHJgkzwuBvaKCzLaFD5.tpehOkpRVmti7mUbuDDAnQCC8g3GQQy',NULL,NULL,NULL,NULL,1,0,0,'2026-05-23 01:17:54','2026-05-25 00:37:57'),(4,'jonas athanas','jonas@gmail.com',NULL,'0617066702',NULL,'active',NULL,'$2y$12$FxpT1w9IkAJ6lWZ7nRcnZ.OBhwEsEmQ7obv0irxzCvEX/V2HC0IZW',NULL,NULL,NULL,NULL,1,0,0,'2026-05-23 01:19:41','2026-05-23 01:19:41'),(5,'test athanas','testjonas@gmail.com',NULL,'0617066702',NULL,'active',NULL,'$2y$12$niQfffHZIHLxEpnyQ4/GKO2K41nlNqmyCrGTWaXUXNNRWsRZFFwla',NULL,NULL,NULL,NULL,1,0,0,'2026-05-23 01:23:49','2026-06-22 02:55:43'),(6,'karia lumumba','lumumbakaria98@gmail.com',NULL,'0798281889',NULL,'active',NULL,'$2y$12$PMEsfgB8zurHVkvRdbJjQuhesWYBLpoIK96znhFamJkGyIwuZj1tG',NULL,NULL,NULL,NULL,1,0,0,'2026-05-25 00:24:44','2026-05-25 00:24:44'),(7,'ICTDEPARTMENBT','ictdepartment@gmail.com',NULL,'07878773388',1,'active',NULL,'$2y$12$jxlIM7J/w.LisZTs.YESnOlZYGd8fyuOUjkVp3GL2.GN4dyP/QIw6',NULL,NULL,NULL,NULL,1,0,0,'2026-06-22 02:57:03','2026-06-22 02:57:03');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'railway'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-23 23:57:03
