/*global chrome, FB */

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

  FB.get('', {ids: "376434952420447,308419275917340,253421998091422,479693128713020"},function(data){
    $.each(data, function(){

      var item = {
        id : this.id,
        groupId : '',
        message : this.message || "",
        from : this.from.name,
        updated : this.updated_time || this.created_time,
        link : this.link || "",
        linkName : this.name || "",
        linkDesct : this.description || ""
      };

      // Group message detection
      var tokens = this.id.split('_');
      if(tokens.length === 2){
        item.groupId = tokens[0];
        item.id = tokens[1];
      }

      console.log('ITEM', item);
    });
  });
}(chrome));