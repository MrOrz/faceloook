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

      // Step 3:
      // Merge cached result with elements that do not need CAS, and CAS result.
      // put CAS results into cache.
      processTokenized = function(items, tokenized){
        // merge items with tokenized items
        $.extend(true, items, tokenized);
        _.each(items, function(obj){
          var fbid = FB.ID(obj.id);
          if( fbid ){
            DB.cache(fbid, obj);
          }
        });

        // extend cached items with newly tokenized data
        $.extend(true, cached, items);

        // mixin rowData only when data is returned from facebook
        _.each(cached, function(value, key){
          cached[key].rowData = rowData[value.id];
        });
        dfd.resolve(cached);
      },

      // Step 2:
      // Process the result returned by FB.get.
      processFB = function(data){
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
            type: this.type || "",
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
          processTokenized(items, tokenized);
        }).fail(function(){
          // CAS query fail, reject.
          dfd.reject(arguments);
        });
      },

      // Step 1:
      // Process the result returned by DB cache.
      // Do FB.get for cache-missed items
      processCached = function(cacheData){
        // Put queried cacheData into cached result.
        $.extend(true, cached, cacheData);

        // Determine the rest to be asked with Facebook
        var fbidInCachedData = _(cacheData).keys().map(FB.ID),
            fbidsToQuery = fbids.difference(fbidInCachedData);

        if(fbidsToQuery.length > 0){
          // Start querying FB
          FB.get('', {ids: fbidsToQuery.join(',')}, processFB, function(){
            // FB query fail, reject.
            dfd.reject(arguments);
          });
        }else{
          // Cache all-hit in the rowData. Process token immediately.
          processTokenized({}, {});
        }
      };

    _(rows).each(function(item){
      // populate rowData, which will be inserted to result
      rowData[item.fbid] = item;

      if(item.cache){
        // check cache from rows
        cached[item.fbid] = JSON.parse(item.cache);
      }else{
        // no cache found in rows, put into fbids array
        fbids.push(item.fbid);
      }
    });

    if(! fbids.isEmpty()){
      // Kick-start the 3-step process.
      DB.getCache(fbids, processCached);
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