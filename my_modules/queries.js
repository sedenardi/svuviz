var queries = function() {

  var showInfoQuery = function(baseTitleId) {
    var sql = '\
drop table if exists rActors; \
create table rActors ( ActorID varchar(10) ); \
create index ix on rActors (ActorID); \
insert into rActors \
select ActorID \
from Appearances a \
where exists \
  (Select 1 from Titles t \
    where t.TitleID = a.TitleID \
    and t.ParentTitleID = ?); \
select \
  t.TitleID \
, t.Season \
, t.Number \
, t.Title \
, t.Synopsis \
, t.AirDate \
, a.ActorID \
, c.Name as ActorName \
, a.Character \
, a.CharacterID \
, c.Commonalities \
from Titles t \
  inner join Appearances a \
    on a.TitleID = t.TitleID \
  inner join \
  (select \
    a1.ActorID \
  , a1.Name \
  , count(distinct c.ActorID2) as Commonalities \
  from Actors a1 \
    left outer join \
        (select \
          app1.ActorID as ActorID1 \
        , app2.ActorID as ActorID2 \
        from Appearances app1 \
          inner join Titles t \
            on t.TitleID = app1.TitleID \
            and coalesce(t.ParentTitleID,\'\') <> ? \
          inner join Appearances app2 \
            on app2.TitleID = app1.TitleID \
            and app2.ActorID <> app1.ActorID \
    where exists \
          (select 1 from rActors ra1 \
          where ra1.ActorID = app1.ActorID) \
    and exists \
          (select 1 from rActors ra2 \
          where ra2.ActorID = app2.ActorID)) c \
      on c.ActorID1 = a1.ActorID \
  group by a1.ActorID,a1.Name) c \
    on c.ActorID = a.ActorID \
where t.ParentTitleID = ? \
and t.AirDate is not null \
and c.Commonalities > 0 \
order by t.AirDate, c.Commonalities desc; \
drop table rActors;';
    return {
      sql: sql,
      inserts: [baseTitleId,baseTitleId,baseTitleId]
    };
  };

  this.showInfo = function(baseTitleId) {
    var cmd = showInfoQuery(baseTitleId);
    var process = function(dbRes) {
      var titles = {};
      var actors = {};
      for (var i = 0; i < dbRes.length; i++) {
        if (typeof titles[dbRes[i].TitleID] === 'undefined') {
          titles[dbRes[i].TitleID] = {
            TitleID: dbRes[i].TitleID,
            Season: dbRes[i].Season,
            Number: dbRes[i].Number,
            Title: dbRes[i].Title,
            Synopsis: dbRes[i].Synopsis,
            AirDate: dbRes[i].AirDate,
            Appearances: []
          };
        }
        titles[dbRes[i].TitleID].Appearances.push({
          ActorID: dbRes[i].ActorID,
          ActorName: dbRes[i].ActorName,
          Commonalities: dbRes[i].Commonalities,
          Character: dbRes[i].Character,
          CharacterID: dbRes[i].CharacterID
        });
      }
      var tArray = [];
      for (var titleId in titles) {
        tArray.push(titles[titleId]);
      }
      return {
        titles: titles,
        tArray: tArray/*,
        actors: actors*/
      };
    };
    return {
      cmd: cmd,
      process: process
    };
  };

  this.showInfoArray = function(baseTitleId) {
    var cmd = showInfoQuery(baseTitleId);
    var process = function(dbRes) {
      var titles = {};
      var actors = {};
      for (var i = 0; i < dbRes.length; i++) {
        if (typeof titles[dbRes[i].TitleID] === 'undefined') {
          titles[dbRes[i].TitleID] = [
            dbRes[i].TitleID,
            dbRes[i].Season,
            dbRes[i].Number,
            dbRes[i].Title,
            dbRes[i].Synopsis,
            dbRes[i].AirDate,
            []
          ];
        }
        titles[dbRes[i].TitleID][6].push([
          dbRes[i].ActorID,
          dbRes[i].ActorName,
          dbRes[i].Commonalities,
          dbRes[i].Character,
          dbRes[i].CharacterID
        ]);
      }
      var tArray = [];
      for (var titleId in titles) {
        tArray.push(titles[titleId]);
      }
      return {
        titles: titles,
        tArray: tArray/*,
        actors: actors*/
      };
    };
    return {
      cmd: cmd,
      process: process
    };
  };

  this.getColorCutoffs = function(baseTitleId) {
    var sql = '\
create table rActors ( ActorID varchar(10) ); \
create index ix on rActors (ActorID); \
insert into rActors \
select ActorID \
from Appearances a \
where exists \
  (Select 1 from Titles t \
    where t.TitleID = a.TitleID \
    and t.ParentTitleID = ?); \
create table commonalities ( Commonalities int, Row int ); \
SET @row_number:=0; \
insert into commonalities \
select \
  Commonalities, \
  @row_number:=@row_number+1 \
from \
  (select \
    a1.ActorID \
  , a1.Name \
  , count(distinct c.ActorID2) as Commonalities \
  from Actors a1 \
    left outer join \
        (select \
          app1.ActorID as ActorID1 \
        , app2.ActorID as ActorID2 \
        from Appearances app1 \
          inner join Titles t \
            on t.TitleID = app1.TitleID \
            and coalesce(t.ParentTitleID,\'\') <> ? \
          inner join Appearances app2 \
            on app2.TitleID = app1.TitleID \
            and app2.ActorID <> app1.ActorID \
    where exists \
          (select 1 from rActors ra1 \
          where ra1.ActorID = app1.ActorID) \
    and exists \
          (select 1 from rActors ra2 \
          where ra2.ActorID = app2.ActorID)) c \
      on c.ActorID1 = a1.ActorID \
  group by a1.ActorID,a1.Name) c \
where c.Commonalities > 0 \
order by c.Commonalities asc; \
set @total := 0; \
select @total := count(1) from commonalities; \
select \
  (select Commonalities from commonalities where row = FLOOR(@total/4)) as first, \
  (select Commonalities from commonalities where row = FLOOR(2*@total/4)) as second, \
  (select Commonalities from commonalities where row = FLOOR(3*@total/4)) as third; \
drop table rActors; \
drop table commonalities;';
    return {
      sql: sql,
      inserts: [baseTitleId,baseTitleId]
    };
  };

  var filterTitleQuery = function(baseTitleId) {
    var sql = '\
select \
  coalesce(pt.TitleID,t.TitleID) as TitleID \
, coalesce(pt.Title,t.Title) as Title \
, case when pt.TitleID is null then false else true end as TV \
from Titles t \
  left outer join Titles pt \
    on pt.TitleID = t.ParentTitleID \
where exists \
  (Select 1 from Appearances ap1 \
    where exists \
    (select 1 from Appearances acp1 \
    where acp1.ActorID = ap1.ActorID \
    and exists \
      (Select 1 from Titles t1 \
      where t1.TitleID = acp1.TitleID \
      and t1.ParentTitleID = ?)) \
  and ap1.TitleID = t.TitleID \
    and exists \
    (Select 1 from Appearances ap2 \
    where exists \
      (select 1 from Appearances acp2 \
      where acp2.ActorID = ap2.ActorID \
      and exists \
        (Select 1 from Titles t2 \
        where t2.TitleID = acp2.TitleID \
        and t2.ParentTitleID = ?)) \
        and ap2.TitleID = ap1.TitleID \
        and ap2.ActorID <> ap1.ActorID)) \
and coalesce(pt.TitleID,t.TitleID) <> ? \
group by TitleID,Title \
order by Title;';
    return {
      sql: sql,
      inserts: [baseTitleId,baseTitleId,baseTitleId]
    };
  };

  this.filterTitles = function(baseTitleId) {
    return filterTitleQuery(baseTitleId);
  };

  this.filterTitlesArray = function(baseTitleId) {
    var cmd = filterTitleQuery(baseTitleId);
    var process = function(dbRes) {
      var array = [];
      for (var i = 0; i < dbRes.length; i++) {
        array.push([
          dbRes[i].TitleID,
          dbRes[i].Title,
          dbRes[i].TV
        ]);
      }
      return array;
    };
    return {
      cmd: cmd,
      process: process
    };
  };

  this.getCommonActors = function(baseTitleId,ActorID,TitleID) {
    var sql = '\
select distinct a2.ActorID \
from Appearances a1 \
  inner join Appearances a2 \
    on a1.TitleID = a2.TitleID \
    and a1.ActorID <> a2.ActorID \
where a1.ActorID = ? \
and not exists \
  (select 1 from Titles t \
  where t.TitleID = a1.TitleID \
  and t.ParentTitleID = ?) \
and exists \
  (select 1 from Appearances app \
    inner join Titles t \
      on t.TitleID = app.TitleID \
  where a2.ActorID = app.ActorID \
    and t.ParentTitleID = ?) ';
    var inserts = [ActorID,baseTitleId,baseTitleId];
    if (typeof TitleID !== 'undefined') {
      sql += '\
and exists \
  (select 1 from Appearances app \
    where app.ActorID = a2.ActorID \
    and exists \
    (Select 1 from Titles t \
        where t.TitleID = app.TitleID \
        and coalesce(t.ParentTitleID,t.TitleID) = ?))';
      inserts.push(TitleID);
    }
    sql += ';';
    return {
      sql: sql,
      inserts: inserts
    };
  };

  this.getCommonTitles = function(ActorID1,ActorID2) {
    var sql = '\
select \
  coalesce(t.ParentTitleID,t.TitleID) as TitleID \
, coalesce(pt.Title,t.Title) as Title \
, case when t.ParentTitleID is null then false else true end as TV \
, a1.Character as Character1 \
, a1.CharacterID as CharacterID1 \
, a2.Character as Character2 \
, a2.CharacterID as CharacterID2 \
, count(1) as Episodes \
from Titles t \
  inner join Appearances a1 \
    on a1.TitleID = t.TitleID \
  inner join Appearances a2 \
    on a2.TitleID = t.TitleID \
  left outer join Titles pt \
    on pt.TitleID = t.ParentTitleID \
where a1.ActorID = ? \
and a2.ActorID = ? \
group by TitleID,Title,TV,a1.Character,a1.CharacterID,a2.Character,a2.CharacterID;';
    return {
      sql: sql,
      inserts: [ActorID1,ActorID2]
    };
  };

  this.getActorInfo = function(ActorID) {
    var sql = '\
select \
  app.ActorID \
, app.`Character` as `Character` \
, app.CharacterID \
, coalesce(t.ParentTitleID,app.TitleID) as TitleID \
, coalesce(pt.Title,t.Title) as Title \
, case when t.ParentTitleID is null then false else true end as TV \
, count(distinct t.TitleID) as Episodes \
, count(distinct app2.ActorID) as Commonalities \
from Appearances app \
  inner join Appearances app2 \
    on app2.TitleID = app.TitleID \
  inner join Titles t \
    on t.TitleID = app.TitleID \
  left outer join Titles pt \
    on pt.TitleID = t.ParentTitleID \
where app.ActorID = ? \
and app2.ActorID <> app.ActorID \
group by app.ActorID,`Character`,CharacterID,TitleID,Title \
order by Commonalities desc;';
    return {
      sql: sql,
      inserts: [ActorID]
    };
  };

  this.buildCommonTitles = function() {
    return {
      sql: '\
truncate table ParentTitleActors; \
insert into ParentTitleActors(ParentTitleID,ActorID) \
select distinct t.ParentTitleID,svu.ActorID \
from Appearances svu \
  inner join Titles t \
    on t.TitleID = svu.TitleID \
  inner join BaseTitles bt \
    on bt.BaseTitleID = t.ParentTitleID; \
truncate table CommonTitleActors; \
insert into CommonTitleActors(ParentTitleID,TitleID,ActorID) \
select distinct pta.ParentTitleID, \
coalesce(pt.ParentTitleID,pt.TitleID) as TitleID,pta.ActorID \
from ParentTitleActors pta \
  inner join Appearances app \
    on app.ActorID = pta.ActorID \
  inner join Titles pt \
    on pt.TitleID = app.TitleID \
where exists \
  (select 1 from Appearances ap1 \
  where ap1.ActorID = pta.ActorID \
  and exists \
    (select 1 from Appearances ap2 \
    where ap2.TitleID = ap1.TitleID \
    and ap2.ActorID <> ap1.ActorID \
    and exists \
      (select 1 from ParentTitleActors svu \
      where svu.ActorID = ap2.ActorID)));',
      inserts: []
    };
  };

  this.getTitleActors = function(baseTitleId,titleId) {
    var sql = '\
select ActorID from CommonTitleActors \
where ParentTitleID = ? and TitleID = ?;';
    return {
      sql: sql,
      inserts: [baseTitleId,titleId]
    };
  };

  this.baseTitles = function() {
    return {
      sql: '\
select bt.*, t.Title as TitleName \
from BaseTitles bt \
  inner join Titles t \
    on t.TitleID = bt.BaseTitleID \
order by Sort asc;',
      inserts: []
    };
  };

};

module.exports = new queries();
