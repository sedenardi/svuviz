var queries = function() {

  this.showInfo = function() {
    var sql = '\
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
from svumap.Titles t \
  inner join svumap.Appearances a \
    on a.TitleID = t.TitleID \
  inner join \
  (select \
    a1.ActorID \
  , a1.Name \
  , count(distinct c.ActorID2) as Commonalities \
  from svumap.Actors a1 \
    left outer join \
        (select \
          app1.ActorID as ActorID1 \
        , app2.ActorID as ActorID2 \
        from svumap.Appearances app1 \
          inner join svumap.Titles t \
            on t.TitleID = app1.TitleID \
            and coalesce(t.ParentTitleID,\'\') <> \'tt0203259\' \
          inner join svumap.Appearances app2 \
            on app2.TitleID = app1.TitleID \
            and app2.ActorID <> app1.ActorID) c \
      on c.ActorID1 = a1.ActorID \
  group by a1.ActorID,a1.Name) c \
    on c.ActorID = a.ActorID \
where t.ParentTitleID = \'tt0203259\' \
and t.AirDate is not null \
and c.Commonalities > 0 \
order by t.AirDate, c.Commonalities desc;';
    var cmd = {
      sql: sql,
      inserts: []
    };
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

  this.filterTitles = function() {
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
    (select 1 from Actors ac1 \
        where ac1.ActorID = ap1.ActorID \
        and exists \
      (select 1 from Appearances acp1 \
      where acp1.ActorID = ac1.ActorID \
            and exists \
        (Select 1 from Titles t1 \
                where t1.TitleID = acp1.TitleID \
                and t1.ParentTitleID = \'tt0203259\'))) \
  and ap1.TitleID = t.TitleID \
    and exists \
    (Select 1 from Appearances ap2 \
    where exists \
      (select 1 from Actors ac2 \
      where ac2.ActorID = ap2.ActorID \
      and exists \
        (select 1 from Appearances acp2 \
        where acp2.ActorID = ac2.ActorID \
        and exists \
          (Select 1 from Titles t2 \
          where t2.TitleID = acp2.TitleID \
          and t2.ParentTitleID = \'tt0203259\'))) \
        and ap2.TitleID = ap1.TitleID \
        and ap2.ActorID <> ap1.ActorID)) \
group by TitleID,Title \
order by Title;';
    return {
      sql: sql,
      inserts: []
    };
  };

  this.actorsAndTitles = function() {
    var sql = '\
select distinct \
  a1.ActorID \
, a1.Name \
, app1.Character \
, app1.CharacterID \
, t.TitleID \
, t.Title \
, t.ParentTitleID \
, pt.Title as ParentTitle \
from svumap.Actors a1 \
  inner join svumap.Appearances app1 \
    on a1.ActorID = app1.ActorID \
  inner join svumap.Titles t \
    on t.TitleID = app1.TitleID \
  left outer join svumap.Titles pt \
    on pt.TitleID = t.ParentTitleID \
where t.ParentTitleID <> \'tt0203259\' \
and exists \
  (Select 1 from svumap.Appearances app2 \
  where app2.TitleID = app1.TitleID \
  and app2.ActorID <> app1.ActorID);';
    var cmd = {
      sql: sql,
      inserts: []
    };
    var process = function(dbRes) {
      var actors = {};
      var titles = {};
      for (var i = 0; i < dbRes.length; i++) {
        if (typeof actors[dbRes[i].ActorID] === 'undefined') {
          actors[dbRes[i].ActorID] = {
            //ActorID: dbRes[i].ActorID,
            Name: dbRes[i].Name,
            Appearances: []
          };
        }
        actors[dbRes[i].ActorID].Appearances.push({
          //ActorID: dbRes[i].ActorID,
          TitleID: dbRes[i].TitleID,
          Character: dbRes[i].Character,
          CharacterID: dbRes[i].CharacterID
        });
        if (typeof titles[dbRes[i].TitleID] === 'undefined') {
          titles[dbRes[i].TitleID] = {
            //TitleID: dbRes[i].TitleID,
            Title: dbRes[i].Title,
            ParentTitleID: dbRes[i].ParentTitleID,
            ParentTitle: dbRes[i].ParentTitle/*,
            Appearances: []*/
          };
        }
        /*titles[dbRes[i].TitleID].Appearances.push({
          ActorID: dbRes[i].ActorID,
          Character: dbRes[i].Character,
          CharacterID: dbRes[i].CharacterID
        });*/
      }
      return {
        titles: titles,
        actors: actors
      };
    };
    return {
      cmd: cmd,
      process: process
    };
  };

  this.commonalities = function() {
    var sql = '\
select \
  app1.ActorID as ActorID1 \
, app2.ActorID as ActorID2 \
,  t.TitleID \
,  t.ParentTitleID \
from svumap.Appearances app1 \
  inner join svumap.Titles t \
    on t.TitleID = app1.TitleID \
    and t.ParentTitleID <> \'tt0203259\' \
  inner join svumap.Appearances app2 \
    on app2.TitleID = app1.TitleID \
    and app2.ActorID <> app1.ActorID;';
    var cmd = {
      sql: sql,
      inserts: []
    };
    var process = function(dbRes) {
      var actors = {};
      for (var i = 0; i < dbRes.length; i++) {
        if (typeof actors[dbRes[i].ActorID1] === 'undefined') {
          actors[dbRes[i].ActorID1] = [];
        }
        actors[dbRes[i].ActorID1].push({
          ActorID: dbRes[i].ActorID2,
          TitleID: dbRes[i].TitleID
        });
      }
      return {
        actors: actors
      };
    };
    return {
      cmd: cmd,
      process: process
    };
  };

  this.getCommonActors = function(ActorID) {
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
  and t.ParentTitleID = \'tt0203259\') \
and exists \
  (select 1 from Appearances app \
    inner join Titles t \
      on t.TitleID = app.TitleID \
  where a2.ActorID = app.ActorID \
    and t.ParentTitleID = \'tt0203259\');';
    return {
      sql: sql,
      inserts: [ActorID]
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

};

module.exports = new queries();
