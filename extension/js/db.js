(function(openDatabase, undefined){
  "use strict";
  var
  DB_VERSION = '0.1',
  DB_SIZE = 10 * 1024 * 1024, // 10MB database
  dfd = $.Deferred(), // deferred database initialization
  database = openDatabase('faceloook', DB_VERSION, 'faceloook database', DB_SIZE);

  // Initialize database.
  database.transaction(
    function(tx){
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS entry(' +
          'id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,' +
          'fbid TEXT NOT NULL,' +
          'clicked INTEGER NOT NULL DEFAULT 0,' +
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
  $.db = function(cmd, args, callback){
    dfd.done(function(db){
      db.transaction(function(tx){
        tx.executeSql(cmd, args, callback);
      }, function(){
        console.error('Execution fail: ',arguments);
      });
    });
  };
}(window.openDatabase));