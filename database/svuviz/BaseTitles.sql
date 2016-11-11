/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `BaseTitles` (
  `BaseTitleID` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DisplayName` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Sort` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
