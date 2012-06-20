/*global chrome, CAS, FB, _ */
(function(CAS, FB, undefined){
  "use strict";

  var BATCH_COUNT = 10,

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

      if(data.length === 0 || $.isEmptyObject(data)){
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
  };

  // Get tokenized data specified by src function, and invokes callback(data)
  // whenever a batch of processed data is ready.
  // src should be either a function that takes a callback(tx, result),
  // such as DB.getUntrained, or an array of facebook ids.
  // Example:
  // GET(["418597748185325", "413420318696220"], function(processedData){ ... })
  // GET(DB.getUntrained, function(processedData){ ... })
  //
  window.GET = function(src, callback){

    // normalize the arguments
    var data;
    if($.isArray(src)){
      // wrap the 'src' to mimic DB.get* interface,
      // which invokes a callback(tx, rowData)
      //
      data = _(src).map(function(i){return {fbid: i}; });
      data.item = function(i){return this[i]}; // DB row interface
      src = function(cb){
        cb(null, {rows: data});
      }
    }

    // Invoke src function to get and process rows.
    src(function(tx, result){
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
            if(!$.isEmptyObject(processedData)){
              _(callback).defer(processedData); // heavy-lifting
            }
          }).fail(function(){
            console.error('Batch processing failed: ', arguments);
          }).always(proceed);
        }
      };

      // Start processing.
      proceed();
    });
  }
}(CAS, FB));