/*global DB */
(function(openDatabase, undefined){
  "use strict";
  var
  DB_VERSION = '0.1',
  DB_SIZE = 50 * 1024 * 1024, // 50MB database
  dfd = $.Deferred(), // deferred database initialization
  database = openDatabase('faceloook', DB_VERSION, 'faceloook database', DB_SIZE);

  // Initialize database.
  database.transaction(
    function(tx){
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS entry(' +
          'id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,' +
          'fbid TEXT NOT NULL,' +
          'cache TEXT,' +
          'clicked INTEGER NOT NULL DEFAULT 0,' +
          'trained INTEGER NOT NULL DEFAULT 0,' +
          'explicit INTEGER,' +
          "updated_at TEXT" +
        ');'
      );
      tx.executeSql('CREATE UNIQUE INDEX IF NOT EXISTS entry_fbid ON entry(fbid);');
    }, function(e){ // transaction error callback
      console.error('DB Creation Error', e);
      dfd.reject(e);
    }, function(results){ // transaction success callback
      console.info('Database Initialized Successfully.');
      dfd.resolve(database);
    }
  );

  // Execute SQL commands
  window.DB = function(cmd, args, callback){
    dfd.done(function(db){
      db.transaction(function(tx){
        tx.executeSql(cmd, args, callback);
      }, function(){
        console.error('Execution fail: ',arguments);
      });
    });
  };

  // select all untrained
  DB.getUntrained = function(callback){
    DB('SELECT * FROM entry WHERE trained = 0;', {}, callback)
  }

  // new record in entry
  DB.insert = function(fbid){
    console.info('inserting', fbid);
    DB("INSERT INTO entry (fbid, updated_at)" +
     "values (?, datetime('now', 'localtime'));",
      [fbid]);
  };

  // set as clicked
  DB.clicked = function(fbid){
    console.info('updating', fbid);
    DB("INSERT OR REPLACE INTO entry (fbid, updated_at, clicked)" +
      "values(?, datetime('now', 'localtime'), 1);",
      [fbid]);
  };

  // set fbids as trained
  DB.trainedAll = function(fbids){
    console.info('trained', fbids);
    DB("UPDATE entry SET trained=1 WHERE fbid IN (" + fbids.join(',') + ");");
  };
  // set all as untrained
  DB.untrainAll = function(){
    console.log('All entries are set as "untrained".');
    DB("UPDATE entry SET trained=0;");
  };

  // delete all fbids
  DB.deleteAll = function(fbids){
    console.info('deleting', fbids);
    DB('DELETE FROM entry WHERE fbid IN (' + fbids.join(',') + ');');
  };

  // Get cache from fbid array.
  // the callback(data) will get data in the form {fbid: object}
  //
  DB.getCache = function(fbids, callback){
    DB("SELECT fbid, cache FROM entry WHERE fbid IN (" + fbids.join(',') + ")"+
       "AND cache IS NOT NULL;",
    {}, function(tx, data){
      var i, ret = {}, item;
      for(i = 0; i < data.rows.length; i+=1){
        item = JSON.parse(data.rows.item(i).cache);
        ret[item.id] = item;
      }

      callback(ret);
    });
  };

  // set cache
  // should be in the form of {fbid: entire object to cache}
  DB.cache = function(fbid, cacheItem){
    console.info("Caching fbid =", fbid);
    DB("INSERT OR REPLACE INTO entry (fbid, cache) " +
       "VALUES (?, ?);", [fbid, JSON.stringify(cacheItem)]);
  }

}(window.openDatabase));
