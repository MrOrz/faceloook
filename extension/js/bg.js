/*global chrome, FB, DB, _, GET, BAYES */

(function(chrome, undefined){
  "use strict";

  // Chrome extension listener
  chrome.extension.onRequest.addListener(function(request, sender, resp){
    var fbid, isInterested = {};
    switch(request.type){

      // Insert new record into database
      case "insert":
        DB.insert(request.fbid);
        break;

      // Update updated_at if not seen before
      case "see":
        DB.see(request.fbid);
        break;

      // Update "clicked"
      case "update":
        DB.clicked(request.fbid);
        break;

      // Mark interested or not
      case "mark":
        DB.mark(request.fbid, request.interested);
        break;

      // Test if user is interested in a bunch of stories.
      case "query":
        GET(request.fbids, function(data){
          _.each(data, function(item){
            // If it is explicitly set to be interested or not interested
            if(_.isNumber(item.rowData.explicit)){
              isInterested[item.id] = item.rowData.explicit === 1;
            }else{
              // use classifier to determine if the user is interested
              isInterested[item.id] = BAYES.isInterested(item);
            }
          })
        }, function(){
          resp(isInterested);
        });
        break;

      default:
        console.error('Invalid request type ', request.type);
    }
  });

  // Train the untrained feeds
  //
  GET(DB.getUntrained, function(data){
    /*
      data = {
        131051573672766_242421059202483: {
          from: "1621831892"
          groupId: "131051573672766"
          id: "242421059202483"
          link: "https www facebook com photo php fbid 3902523854517 set o 131051573672766 type 1"
          linkDesct: ""
          linkName: ""
          message: "就在 這個 和 網頁 組 一同 奮鬥 並且 下著 大雨 的 夜晚 ， 讓 我們 文宣..."
          rowData: {
            clicked: 0
            explicit: null
            fbid: "242421059202483"
            id: 4129
            trained: 0
            updated_at: "2012-06-14 08:59:28"
          }
          updated: "2012-06-12T07:44:19+0000"
        }, ...
      }
    */

    // console.log('Data received by processData: ', data);

    BAYES.trainObj(data);
    DB.trainedAll(_(data).pluck('id'));
  });

}(chrome));
