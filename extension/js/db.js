/*global DB, _ */
(function(openDatabase, undefined){
  "use strict";
  var
  RECENT_COUNT = 50,
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
          'href TEXT,' +
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

  // select all with valid id
  DB.getUntrained = function(callback){
    DB('SELECT * FROM entry WHERE trained = 0 AND updated_at IS NOT NULL ORDER BY id DESC;', {},
    //DB('SELECT * FROM entry WHERE trained = 0 ORDER BY id DESC;', {},
     callback);
  };

  // select most recent 100 seen posts
  DB.getRecentlySeen = function(callback){
    DB('SELECT * FROM entry WHERE updated_at IS NOT NULL '+
       'ORDER BY updated_at DESC LIMIT ' + RECENT_COUNT + ';', [],
     callback);
  };

  // Get all entries with FBID array
  DB.getByFBIDs = function(fbids, callback){
    DB("SELECT * FROM entry WHERE fbid IN (" + fbids.join(',') + ");",
      [], callback);
  };

  // new record in entry
  DB.insert = function(fbid, href){
    console.info('inserting', fbid);
    DB("INSERT INTO entry (fbid, href) values (?, ?);", [fbid, href]);
  };

  DB.see = function(fbid){
    console.info('seeing', fbid);
    DB("UPDATE entry SET updated_at=datetime('now', 'localtime') " +
       "WHERE fbid=? AND updated_at IS NULL;", [fbid]);
  };

  // set as clicked
  DB.clicked = function(fbid){
    console.info('updating', fbid);
    DB("UPDATE entry SET updated_at=datetime('now', 'localtime'), clicked=1 " +
       "WHERE fbid=?;", [fbid]);
  };

  // mark explicit interest
  DB.mark = function(fbid, isInterested){
    console.info('explicitly set ', fbid, ' interested = ', isInterested);
    DB("UPDATE entry SET explicit=? WHERE fbid=?;", [+isInterested, fbid]);
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

  // get all cached items for training
  DB.getCached = function(callback){
    DB('SELECT * FROM entry WHERE cache IS NOT NULL;', [], callback);
  }

  // set cache
  // should be in the form of {fbid: entire object to cache}
  DB.cache = function(fbid, cacheItem){
    console.info("Caching fbid =", fbid);
    DB("UPDATE entry SET cache=? WHERE fbid=?;",
       [JSON.stringify(cacheItem), fbid]);
  };

  // Clear cache for all rows
  DB.clearCache = function(){
    console.info("All cache are clear.");
    DB("UPDATE entry SET cache=NULL;");
  };

}(window.openDatabase));
