/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Appearances` (
  `AppearanceID` int(11) NOT NULL AUTO_INCREMENT,
  `ActorID` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TitleID` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Character` text COLLATE utf8mb4_unicode_ci,
  `CharacterID` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `RecordedOn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`AppearanceID`),
  KEY `idx_Appearances_Actor` (`ActorID`),
  KEY `idx_Appearances_Title` (`TitleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
