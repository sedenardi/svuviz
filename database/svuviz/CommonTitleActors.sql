/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `CommonTitleActors` (
  `ParentTitleID` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `TitleID` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `ActorID` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`ParentTitleID`,`TitleID`,`ActorID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
