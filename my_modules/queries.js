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
            and t.ParentTitleID <> \'tt0203259\' \
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
      return {
        titles: titles/*,
        actors: actors*/
      };
    };
    return {
      cmd: cmd,
      process: process
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
  and t.ParentTitleID = \'tt0203259\');';
    return {
      sql: sql,
      inserts: [ActorID]
    };
  };

  this.getCommonTitles = function(ActorID1,ActorID2) {
    var sql = '\
select \
  t.TitleID \
, t.ParentTitleID \
, t.Season \
, t.Number \
, t.Title \
, pt.Title as ParentTitle \
from Titles t \
  left outer join Titles pt \
    on pt.TitleID = t.ParentTitleID \
where exists \
  (select 1 from Appearances a \
  where a.TitleID = t.TitleID \
  and a.ActorID = ?) \
and exists \
  (select 1 from Appearances a \
  where a.TitleID = t.TitleID \
  and a.ActorID = ?);';
    return {
      sql: sql,
      inserts: [ActorID1,ActorID2]
    };
  };

};

module.exports = new queries();
