/*global chrome, CAS, FB, _, DB */
(function(CAS, FB, undefined){
  "use strict";

  var BATCH_COUNT = 10,

  // Batch processing the data in database rows.
  // First it queries the cache,
  // then it asks FB to get the items needed,
  // then it consults CAS to get tokenized text features.
  batch = function(rows){
    var
      dfd = $.Deferred(),
      fbids = _([]),   // FB IDs to query
      rowData = {}, // id -> database row data
      cached = {},  // id -> cached CAS result

      // Step 2:
      // Merge cached result with elements that do not need CAS, and CAS result.
      // put CAS results into cache.
      processTokenized = function(items, tokenized){

        // merge items with tokenized items
        $.extend(true, items, tokenized);
        _.each(items, function(obj, key){
          var fbid = FB.ID(obj.id);
          if( fbid ){
            DB.cache(fbid, obj);
            // mixin rowData only when data is returned from CAS
            items[key].rowData = rowData[fbid];
          }
        });

        // mixup cached items with newly tokenized data
        dfd.resolve($.extend(true, cached, items));
      },

      // Step 1:
      // Process the result returned by FB.get.
      processFB = function(data){
        var items = {}, itemsToTokenize = {};

        if(data.length === 0 || $.isEmptyObject(data)){
          processTokenized({}, {});
          return;
        }

        // Split item properties into 2 categories:
        // those to be tokenized, and those that are not.
        _.each(data, function(i){
          if(!i.type){
            throw "FB type error";
          }
          items[i.id] = {
            id : i.id,
            groupId : '',
            from : i.from.id,
            type: 'TYPE' + i.type || "",
            name : i.from.name,
            picture : i.picture || "",
            story : i.story || "",
            updated : i.updated_time || i.created_time,
            originMsg :   i.message || "",
            originCap : i.caption || "",
            originLink : i.link || "",
            originLinkName : i.name || "",
            originLinkDesct : i.description || ""
          };

          itemsToTokenize[i.id] = {
            message : i.message || "",
            link : i.link || "",
            linkName : i.name || "",
            linkDesct : i.description || "",
            caption: i.caption || ""
          };

          // Group message detection
          var tokens = i.id.split('_');
          if(tokens.length === 2){
            items[i.id].groupId = tokens[0];
            items[i.id].id = tokens[1];
          }
        });

        CAS(itemsToTokenize, function(tokenized){
          processTokenized(items, tokenized);
        }).fail(function(){

          // CAS query fail, reject.
          dfd.reject(arguments);
        });
      };

    _(rows).each(function(item){
      if(item.cache){

        // check cache from rows
        cached[item.fbid] = JSON.parse(item.cache);

        // mix-in rowData if the row is already cached.
        cached[item.fbid].rowData = item;
      }else{

        // no cache found in rows, put into fbids array
        fbids.push(item.fbid);

        // populate rowData, which will be inserted after CAS
        rowData[item.fbid] = item;
      }
    });

    if(! $.isEmptyObject(cached)){
      console.log('cache hit:', $.extend({}, cached));
    }

    if(! fbids.isEmpty()){

      // Query facebook with the fbids array
      FB.get('', {ids: fbids.join(',')}, processFB, function(){

        // FB query fail, reject.
        dfd.reject(arguments);
      });
    }else{

      // Cache all-hit in the rowData. Process token immediately.
      processTokenized({}, {});
    }

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
  window.GET = function(src, callback, allDoneCallback){

    // normalize the arguments
    var data, fbids;
    if($.isArray(src)){

      // set the 'src' to DB.getByFBIDs
      fbids = src;
      src = function(cb){
        DB.getByFBIDs(fbids, cb);
      };
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

            // All done! Trigger alldone callback if there is one
            if(i === rows.length && allDoneCallback){
              // Because the callback is in event queue
              _(allDoneCallback).defer();
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