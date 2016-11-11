/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `CommonTitleActors` (
  `ParentTitleID` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TitleID` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ActorID` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  KEY `IX_CommonTitleActors` (`ParentTitleID`,`TitleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
