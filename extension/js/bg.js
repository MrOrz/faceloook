/*global chrome, FB, DB, _, CAS */
var bayes = new Bayesian();

(function(chrome, undefined){
  "use strict";

  var BATCH_COUNT = 5;

  // Chrome extension listener
  chrome.extension.onRequest.addListener(function(request){
    var fbid;
    switch(request.type){

      // Insert new record into database
      case "insert":
        DB.insert(request.fbid);
        break;

      // Update "clicked"
      case "update":
        DB.clicked(request.fbid);

        break;
    }
  });

  // Processing untrained data
  var

  // Batch processing the data in database rows.
  // First it asks FB to get the items needed,
  // then it consults CAS to get tokenized text features.
  batch = function(rows){
    var
      dfd = $.Deferred(),
      fbids = _(rows).pluck('fbid'),
      rowData = {}; // id -> database row data

    _(rows).each(function(item){
      rowData[item.fbid] = item;
    });

    // Start querying FB
    FB.get('', {ids: fbids.join(',')}, function(data){
      var items = {}, itemsToTokenize = {};

      if(data.length === 0){
        dfd.resolve({});
        return;
      }

      // Split item properties into 2 categories:
      // those to be tokenized, and those that are not.
      $.each(data, function(){
        items[this.id] = {
          id : this.id,
          groupId : '',
          from : this.from.id,
          updated : this.updated_time || this.created_time
        };

        itemsToTokenize[this.id] = {
          message : this.message || "",
          link : this.link || "",
          linkName : this.name || "",
          linkDesct : this.description || ""
        };

        // Group message detection
        var tokens = this.id.split('_');
        if(tokens.length === 2){
          items[this.id].groupId = tokens[0];
          items[this.id].id = tokens[1];
        }
      });

      CAS(itemsToTokenize, function(tokenized){
        // merge items with tokenized items
        var ret = $.extend(true, {}, items, tokenized);

        // mixin rowData only when data is returned from facebook
        _(ret).each(function(value, key){
          ret[key].rowData = rowData[value.id];
        });
        dfd.resolve(ret);
      }).fail(function(){
        // CAS query fail, reject.
        dfd.reject(arguments);
      });
    }, function(){
      // FB query fail, reject.
      dfd.reject(arguments);
    });

    // Return dfd.
    return dfd.promise();
  },

  // Fetch data from database, FB and CAS, and calls callback
  // whenever any data is ready.
  processData = function(callback){
    DB.getUntrained(function(tx, result){
      var rows = result.rows, i = 0;

      console.log('Processing ', rows.length, ' items...');

      // Proceed processing BATCH_COUNT items.
      var proceed = function(){
        var j = 0, buffer = [];
        for(; i < rows.length && j<BATCH_COUNT; i+=1, j+=1){
          buffer.push(rows.item(i));
        }
        if(buffer.length){
          // Process the items in buffer. When the batch process is done,
          // invoke callback and proceed to the next BATCH_COUNT items.
          batch(buffer).done(function(processedData){
            console.log('First ', i, ' items are processed.', processedData);
            //callback(processedData);
            _(callback).defer(processedData); // heavy-lifting
          }).fail(function(){
            console.error('Batch processing failed: ', arguments);
          }).always(proceed);
        }
      };

      // Start processing.
      proceed();
    });
  };

  processData(function(data){
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

    
    console.log('Data received by processData: ', data);
    $.each(data,function(k,v){
      console.log('train,msg: ',v['message']);
      console.log('train,from: ',v['from']);
      console.log('train,gId: ',v['groupId']);
      // console.log('train,clicked: ',v['rowData']['clicked']);
      // var tmp = {input:v.,output:data.}
      if(v['message']!=''){
        bayes.train(v['message'],v['rowData']['clicked']);
        bayes.train(v['id'],v['rowData']['clicked']);
        if(v['groupId']!='')
          bayes.train(v['groupId'],v['rowData']['clicked']);        
      }
    });
    //DB.trainedAll(_(data).pluck('id'));
    // bayes.train(data);
    var category = bayes.classify(data[3422545118629]);   // "spam"
    console.log('category: ',category);
  });

}(chrome));


function testC(){
};