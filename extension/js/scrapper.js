/*global WebKitMutationObserver, chrome, _ */

(function(chrome, undefined){
  "use strict";


  var
  $window = $(window),

  // a queue containing id -> <li> that has not been shown on screen
  storiesNotShown = {},

  // Possible href formats regular expressions.
  PATTERNS = [

    // "/permalink.php?story_fbid=<id>&id=<author_id>"
    // example ID: 115097898626834
    /permalink\.php\?story_fbid=(\d+)/,

    // "/<author>/posts/<id>"
    // example ID: 409990302374999
    /\/posts\/(\d+)/,

    // "https://www.facebook.com/photo.php?fbid=<id>&set=<unknown>&type=1"
    // example ID: 407494649290908
    /photo\.php\?fbid=(\d+)/,

    // "/events/<event_id>/permalink/<id>/"
    // "/groups/<group_id>/permalink/<id>/"
    /\/permalink\/(\d+)/,

    // "https://www.facebook.com/media/set/?set=a.<id>.<unknown>.<unknown>&type=i"
    /\?set=\w+\.(\d+)/


    // IGNORED pattern:
    // https://www.facebook.com/<author>/activity/<id> : Game activity
    //
  ],
  CLS = {
    INTERESTED: "faceloook-interested",
    UNINTERESTED: "faceloook-uninterested",
    INVALID: "faceloook-invalid"
  },

  // update udpated_at if not seen before
  markAsSeen = function(fbid){
    console.log('SEEN:', fbid);
    chrome.extension.sendRequest({ type: 'see', fbid: fbid });

    delete storiesNotShown[fbid];
  },

  // update clicked if not seen before
  markAsClicked = function(fbid){
    chrome.extension.sendRequest({type: 'update', fbid: fbid});

    console.log('STORY', fbid, "clicked!");
  },

  // mark as interested
  markInterested = function(fbid, val){
    chrome.extension.sendRequest({type: 'mark', fbid: fbid, interested: val});
    console.log('INTEREST', fbid, val);
  },

  // Process the story <li> with known facebook id.
  processStory = function($link, $story, fbid){

    // Try inserting the story into database
    chrome.extension.sendRequest({
      type: 'insert', fbid: fbid, href: $link.attr('href')
    });

    // Push into scroll-event checking queue.
    storiesNotShown[fbid] = $story;

    // Bind click event handlers.
    $story.click(function(e){
      if(! $(e.target).hasClass('unsub_link')){
        markAsClicked(fbid);
      }
    });

    // Install "interested" markers
    var $marker = $('<div class="faceloook-marker">★</div>').appendTo($story);
    $marker.click(function(e){
      if($story.hasClass(CLS.INTERESTED)){
        $story.removeClass(CLS.INTERESTED).addClass(CLS.UNINTERESTED);
        markInterested(fbid, false);
      }else if($story.hasClass(CLS.UNINTERESTED)){
        $story.removeClass(CLS.UNINTERESTED).addClass(CLS.INTERESTED);
        markInterested(fbid, true);
      }else{
        console.error('Error toggling the marker');
      }

      // Do not set 'clicked' for the story
      e.stopPropagation();
    });
  },

  // Mark as interested or not.
  // fbStories: {fbid: jQuery facebook story element}
  markStories = function(fbStories){
    var fbids = _.keys(fbStories);
    chrome.extension.sendRequest({type: 'query', fbids: fbids},
      function(isInterested){
        console.log('QUERY RESULT', isInterested);
        var invalidFBID = _(fbids).difference(_(isInterested).keys());
        if(invalidFBID.length){
          console.error('Invalid FBID : ', invalidFBID);
        }
        _.each(fbStories, function($story, fbid){
          if(isInterested[fbid] === true){
            $story.addClass(CLS.INTERESTED);
          }else if(isInterested[fbid] === false){
            $story.addClass(CLS.UNINTERESTED);
          }else{
            $story.addClass(CLS.INVALID);
          }
        });
      });
  },

  // Extract data from all story <li>s.
  getStories = function(stories){
    // fbid -> jQuery facebook story element
    var fbStories = {};
    $(stories).each(function(){

      // Find all time link that contains <abbr>.
      // Note that not all timestamp <abbr> has the class .timeStamp,
      // especially in facebook groups.
      var $story = $(this),
          $link = $story.find('.uiStreamSource a').has('abbr'),
          href, match = null,
          fbid;


      // Extracting id.
      // It is possible that a story has no uiStreamSource.
      // (for trivial stories, or stories not viewable(?))
      // It is also possible that a story has multiple uiStreamSource,
      // if an object is shared by multiple people.
      if($link.size){
        href = $link.attr('href');

        $.each(PATTERNS, function(i, pattern){
          match = pattern.exec(href);

          // break if match is found.
          if(match){
            return false;
          }
        });

        if(match){
          //console.log('STORY:', this, 'ID: ', match[1]);
          fbid = match[1];
          fbStories[fbid] = $story;
          processStory($link, $story, fbid);
        }else{
          console.log('STORY:', this, 'HREF: ', href);
        }

      }

    });

    markStories(fbStories);
  };

  // Listening to the subtree change of #contentCol div.
  var subtreeObserver = new WebKitMutationObserver(function(mutations){

    // squash all added nodes in mutations into one jQuery object.
    var $nodes = $();
    $.each(mutations, function(){
      $nodes = $nodes.add(this.addedNodes);
    });

    // .uiStreamHomepage is re-contstructed during page change.
    var
    $ul = $nodes.filter('.uiStreamHomepage'),

    // .uiStreamStory is inserted into DOM after ajax story fetch.
    $stories = $nodes.filter('.uiStreamStory');

    if($ul.length){
      console.log('=== PAGE CHANGE ===');
      getStories($ul.find('.uiStreamStory'));
      $window.scroll(); // trigger message visibility check
    }else if($stories.length){
      console.log('=== STORY ADDED ===');
      getStories($stories);
    }/*else{
      console.log('Subtree Mutations: ', $nodes);
    }*/
  });

  // Check whether the story is in screen during window scroll event.
  $window.scroll(function(e){
    var
    foldTop = $window.scrollTop(),
    foldBottom = foldTop + $window.height();

    $.each(storiesNotShown, function(fbid, $li){
      var middle = $li.offset().top + $li.height()/2;

      // Check if the middle-line of a message is shown in screen.
      // This is to prevent a feed with excessive height would be marked
      // "not seen" all the time.
      if(middle >= foldTop && middle <= foldBottom){
        markAsSeen(fbid);
      }
    });
  });

  // Initialize the scrapper.
  subtreeObserver.observe( $('#content').get(0), {
    subtree: true, childList: true
  });
  getStories($('.uiStreamStory'));

  // Trigger scroll handler
  $window.trigger('scroll');
}(chrome));