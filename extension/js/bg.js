/*global chrome */

(function(chrome, undefined){
  "use strict";

  // Chrome extension listener
  chrome.extension.onRequest.addListener(function(request){
    var fbid;
    switch(request.type){

      // Insert new record into database
      case "insert":
        fbid = request.fbid;
        console.info('inserting', fbid);
        $.db("INSERT INTO entry (fbid, updated_at)" +
         "values (?, datetime('now', 'localtime'));",
          [fbid]);
        break;

      // Update "clicked"
      case "update":
        fbid = request.fbid;
        console.info('updating', fbid);
        $.db("INSERT OR REPLACE INTO entry (fbid, updated_at, clicked)" +
          "values (?, datetime('now', 'localtime'), 1);",
          [fbid]);
        break;
    }
  });

}(chrome));