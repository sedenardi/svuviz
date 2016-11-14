'use strict';

var _ = require('lodash');

module.exports = function(db) {
  return {
    baseTitles: function() {
      var sql = `
      select bt.*, t.Title as TitleName
      from BaseTitles bt
        inner join Titles t
          on t.TitleID = bt.BaseTitleID
      order by Sort asc;`;
      return db.query([sql]);
    },
    showInfo: function(baseTitleId, seqNo) {
      var sql = `
      drop table if exists rActors_${seqNo};
      create table rActors_${seqNo} ( ActorID varchar(10) );
      create index ix on rActors_${seqNo} (ActorID);
      insert into rActors_${seqNo}
      select ActorID
      from Appearances a
      where exists
        (Select 1 from Titles t
          where t.TitleID = a.TitleID
          and t.ParentTitleID = ?);
      select
        t.TitleID
      , t.Season
      , t.Number
      , t.Title
      , t.Synopsis
      , t.AirDate
      , a.ActorID
      , c.Name as ActorName
      , a.Character
      , a.CharacterID
      , c.Commonalities
      from Titles t
        inner join Appearances a
          on a.TitleID = t.TitleID
        inner join
        (select
          a1.ActorID
        , a1.Name
        , count(distinct c.ActorID2) as Commonalities
        from Actors a1
          left outer join
              (select
                app1.ActorID as ActorID1
              , app2.ActorID as ActorID2
              from Appearances app1
                inner join Titles t
                  on t.TitleID = app1.TitleID
                  and coalesce(t.ParentTitleID,'') <> ?
                inner join Appearances app2
                  on app2.TitleID = app1.TitleID
                  and app2.ActorID <> app1.ActorID
          where exists
                (select 1 from rActors_${seqNo} ra1
                where ra1.ActorID = app1.ActorID)
          and exists
                (select 1 from rActors_${seqNo} ra2
                where ra2.ActorID = app2.ActorID)) c
            on c.ActorID1 = a1.ActorID
        group by a1.ActorID,a1.Name) c
          on c.ActorID = a.ActorID
      where t.ParentTitleID = ?
      and t.AirDate is not null
      and c.Commonalities > 0
      order by t.AirDate, c.Commonalities desc;
      drop table rActors_${seqNo};`;
      return db.query([sql, [baseTitleId, baseTitleId, baseTitleId]]).then((res) => {
        var titles = _.reduce(res[4], (res, v) => {
          if (!res[v.TitleID]) {
            res[v.TitleID] = [v.TitleID, v.Season, v.Number, v.Title, v.Synopsis, v.AirDate, []];
          }
          res[v.TitleID][6].push([v.ActorID, v.ActorName, v.Commonalities, v.Character, v.CharacterID]);
          return res;
        }, {});
        var tArray = _.values(titles);
        return Promise.resolve(tArray);
      });
    },
    filterTitles: function(baseTitleId) {
      var sql = `
      select
        coalesce(pt.TitleID,t.TitleID) as TitleID
      , coalesce(pt.Title,t.Title) as Title
      , case when pt.TitleID is null then false else true end as TV
      from Titles t
        left outer join Titles pt
          on pt.TitleID = t.ParentTitleID
      where exists
        (Select 1 from Appearances ap1
          where exists
          (select 1 from Appearances acp1
          where acp1.ActorID = ap1.ActorID
          and exists
            (Select 1 from Titles t1
            where t1.TitleID = acp1.TitleID
            and t1.ParentTitleID = ?))
        and ap1.TitleID = t.TitleID
          and exists
          (Select 1 from Appearances ap2
          where exists
            (select 1 from Appearances acp2
            where acp2.ActorID = ap2.ActorID
            and exists
              (Select 1 from Titles t2
              where t2.TitleID = acp2.TitleID
              and t2.ParentTitleID = ?))
              and ap2.TitleID = ap1.TitleID
              and ap2.ActorID <> ap1.ActorID))
      and coalesce(pt.TitleID,t.TitleID) <> ?
      group by TitleID,Title
      order by Title;`;
      return db.query([sql, [baseTitleId, baseTitleId, baseTitleId]]).then((res) => {
        var titles = _.map(res, (r) => {
          return [r.TitleID, r.Title, r.TV];
        });
        return Promise.resolve(titles);
      });
    },
    colorCutoffs: function(baseTitleId, seqNo) {
      var sql = `
      drop table if exists cActors_${seqNo};
      create table cActors_${seqNo} ( ActorID varchar(10) );
      create index ix on cActors_${seqNo} (ActorID);
      insert into cActors_${seqNo}
      select ActorID
      from Appearances a
      where exists
        (Select 1 from Titles t
          where t.TitleID = a.TitleID
          and t.ParentTitleID = ?);
      drop table if exists commonalities_${seqNo};
      create table commonalities_${seqNo} ( Commonalities int, Row int );
      SET @row_number:=0;
      insert into commonalities_${seqNo}
      select
        Commonalities,
        @row_number:=@row_number+1
      from
        (select
          a1.ActorID
        , a1.Name
        , count(distinct c.ActorID2) as Commonalities
        from Actors a1
          left outer join
              (select
                app1.ActorID as ActorID1
              , app2.ActorID as ActorID2
              from Appearances app1
                inner join Titles t
                  on t.TitleID = app1.TitleID
                  and coalesce(t.ParentTitleID,'') <> ?
                inner join Appearances app2
                  on app2.TitleID = app1.TitleID
                  and app2.ActorID <> app1.ActorID
          where exists
                (select 1 from cActors_${seqNo} ra1
                where ra1.ActorID = app1.ActorID)
          and exists
                (select 1 from cActors_${seqNo} ra2
                where ra2.ActorID = app2.ActorID)) c
            on c.ActorID1 = a1.ActorID
        group by a1.ActorID,a1.Name) c
      where c.Commonalities > 0
      order by c.Commonalities asc;
      set @total := 0;
      select @total := count(1) from commonalities_${seqNo};
      select
        (select Commonalities from commonalities_${seqNo} where row = FLOOR(@total/4)) as first,
        (select Commonalities from commonalities_${seqNo} where row = FLOOR(2*@total/4)) as second,
        (select Commonalities from commonalities_${seqNo} where row = FLOOR(3*@total/4)) as third;
      drop table cActors_${seqNo};
      drop table commonalities_${seqNo};`;
      return db.query([sql, [baseTitleId, baseTitleId]]).then((res) => {
        var cutoffs = [res[10][0].first, res[10][0].second, res[10][0].third];
        return Promise.resolve(cutoffs);
      });
    },
    baseTitleInfo: function(baseTitleId, seqNo) {
      return Promise.all([
        this.showInfo(baseTitleId, seqNo),
        this.filterTitles(baseTitleId),
        this.colorCutoffs(baseTitleId, seqNo)
      ]).then((res) => {
        return Promise.resolve({
          showInfo: res[0],
          filterTitles: res[1],
          colorCutoffs: res[2]
        });
      });
    },
    buildCommonTitles: function() {
      var sql = `
      truncate table ParentTitleActors;
      insert into ParentTitleActors(ParentTitleID,ActorID)
      select distinct t.ParentTitleID,svu.ActorID
      from Appearances svu
        inner join Titles t
          on t.TitleID = svu.TitleID
        inner join BaseTitles bt
          on bt.BaseTitleID = t.ParentTitleID;
      truncate table CommonTitleActors;
      insert into CommonTitleActors(ParentTitleID,TitleID,ActorID)
      select distinct pta.ParentTitleID,
      coalesce(pt.ParentTitleID,pt.TitleID) as TitleID,pta.ActorID
      from ParentTitleActors pta
        inner join Appearances app
          on app.ActorID = pta.ActorID
        inner join Titles pt
          on pt.TitleID = app.TitleID
      where exists
        (select 1 from Appearances ap1
        where ap1.ActorID = pta.ActorID
        and exists
          (select 1 from Appearances ap2
          where ap2.TitleID = ap1.TitleID
          and ap2.ActorID <> ap1.ActorID
          and exists
            (select 1 from ParentTitleActors svu
            where svu.ActorID = ap2.ActorID)));`;
      return db.query([sql]);
    },
    getCommonActors: function(baseTitleId, actorId, titleId) {
      var inserts = [actorId, baseTitleId, baseTitleId];
      var titleSql = '';
      if (titleId) {
        titleId = `
        and exists
          (select 1 from Appearances app
            where app.ActorID = a2.ActorID
            and exists
            (Select 1 from Titles t
                where t.TitleID = app.TitleID
                and coalesce(t.ParentTitleID,t.TitleID) = ?))`;
        inserts.push(titleId);
      }
      var sql = `
      select distinct a2.ActorID
      from Appearances a1
        inner join Appearances a2
          on a1.TitleID = a2.TitleID
          and a1.ActorID <> a2.ActorID
      where a1.ActorID = ?
      and not exists
        (select 1 from Titles t
        where t.TitleID = a1.TitleID
        and t.ParentTitleID = ?)
      and exists
        (select 1 from Appearances app
          inner join Titles t
            on t.TitleID = app.TitleID
        where a2.ActorID = app.ActorID
          and t.ParentTitleID = ?) ${titleSql};`;
      return db.query([sql, inserts]).then((res) => {
        var actors = _.map(res, 'ActorID');
        return Promise.resolve(actors);
      });
    },
    getCommonTitles: function(actorId1, actorId2) {
      var sql = `
      select
        coalesce(t.ParentTitleID,t.TitleID) as TitleID
      , coalesce(pt.Title,t.Title) as Title
      , case when t.ParentTitleID is null then false else true end as TV
      , a1.Character as Character1
      , a1.CharacterID as CharacterID1
      , a2.Character as Character2
      , a2.CharacterID as CharacterID2
      , count(1) as Episodes
      from Titles t
        inner join Appearances a1
          on a1.TitleID = t.TitleID
        inner join Appearances a2
          on a2.TitleID = t.TitleID
        left outer join Titles pt
          on pt.TitleID = t.ParentTitleID
      where a1.ActorID = ?
      and a2.ActorID = ?
      group by TitleID,Title,TV,a1.Character,a1.CharacterID,a2.Character,a2.CharacterID;`;
      return db.query([sql, [actorId1, actorId2]]);
    },
    getActorInfo: function(actorId) {
      var sql = `
      select
        app.ActorID
      , app.Character as Character
      , app.CharacterID
      , coalesce(t.ParentTitleID,app.TitleID) as TitleID
      , coalesce(pt.Title,t.Title) as Title
      , case when t.ParentTitleID is null then false else true end as TV
      , count(distinct t.TitleID) as Episodes
      , count(distinct app2.ActorID) as Commonalities
      from Appearances app
        inner join Appearances app2
          on app2.TitleID = app.TitleID
        inner join Titles t
          on t.TitleID = app.TitleID
        left outer join Titles pt
          on pt.TitleID = t.ParentTitleID
      where app.ActorID = ?
      and app2.ActorID <> app.ActorID
      group by app.ActorID,Character,CharacterID,TitleID,Title
      order by Commonalities desc;`;
      return db.query([sql, [actorId]]);
    },
    getTitleActors: function(baseTitleId, titleId) {
      var sql = `
      select ActorID from CommonTitleActors \
      where ParentTitleID = ? and TitleID = ?;`;
      return db.query([sql, [baseTitleId, titleId]]).then((res) => {
        var actors = _.map(res, 'ActorID');
        return Promise.resolve(actors);
      });
    }
  };
};
