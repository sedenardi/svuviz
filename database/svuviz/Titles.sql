/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Titles` (
  `TitleID` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ParentTitleID` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Season` tinyint(4) DEFAULT NULL,
  `Number` tinyint(4) DEFAULT NULL,
  `Title` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `Synopsis` text COLLATE utf8mb4_unicode_ci,
  `AirDate` date DEFAULT NULL,
  `Year` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `RecordedOn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`TitleID`),
  KEY `idx_Titles_ParentTitleID_AirDate` (`ParentTitleID`,`AirDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
