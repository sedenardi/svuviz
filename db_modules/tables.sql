CREATE TABLE IF NOT EXISTS `Actors` (
  `ActorID` varchar(10) NOT NULL,
  `Name` varchar(45) NOT NULL,
  `Birthday` date DEFAULT NULL,
  `RecordedOn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ActorID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `Appearances` (
  `AppearanceID` int(11) NOT NULL AUTO_INCREMENT,
  `ActorID` varchar(10) NOT NULL,
  `TitleID` varchar(10) NOT NULL,
  `Character` varchar(45) DEFAULT NULL,
  `CharacterID` varchar(10) DEFAULT NULL,
  `RecordedOn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`AppearanceID`),
  KEY `idx_Appearances_Actor` (`ActorID`),
  KEY `idx_Appearances_Title` (`TitleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `BaseTitles` (
  `BaseTitleID` varchar(10) NOT NULL,
  `DisplayName` varchar(20) NOT NULL,
  `Sort` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `CommonTitleActors` (
  `ParentTitleID` varchar(10) DEFAULT NULL,
  `TitleID` varchar(10) DEFAULT NULL,
  `ActorID` varchar(10) DEFAULT NULL,
  KEY `IX_CommonTitleActors` (`ParentTitleID`,`TitleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `ParentTitleActors` (
  `ParentTitleID` varchar(10) DEFAULT NULL,
  `ActorID` varchar(10) DEFAULT NULL,
  KEY `IX_ParentTitleActors` (`ActorID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `ProcessActors` (
  `ActorID` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `ProcessTitles` (
  `TitleID` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `Titles` (
  `TitleID` varchar(10) NOT NULL,
  `ParentTitleID` varchar(10) DEFAULT NULL,
  `Season` tinyint(4) DEFAULT NULL,
  `Number` tinyint(4) DEFAULT NULL,
  `Title` varchar(45) NOT NULL,
  `Synopsis` varchar(250) DEFAULT NULL,
  `AirDate` date DEFAULT NULL,
  `Year` varchar(10) DEFAULT NULL,
  `RecordedOn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`TitleID`),
  KEY `idx_Titles_ParentTitleID_AirDate` (`ParentTitleID`,`AirDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

