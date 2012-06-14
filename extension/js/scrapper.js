/*global WebKitMutationObserver, chrome */

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

  markAsSeen = function(fbid){
    console.log('SEEN:', fbid);
    // insert row into backend
    chrome.extension.sendRequest({ type: 'insert', fbid: fbid });

    delete storiesNotShown[fbid];
  },
  markAsClicked = function(fbid){
    // insert into or update into backend
    chrome.extension.sendRequest({ type: 'update', fbid: fbid });

    console.log('STORY', fbid, "clicked!");
  },

  // Process the story <li> with known facebook id.
  processStory = function($story, fbid){
    // Push into scroll-event checking queue.
    storiesNotShown[fbid] = $story;

    // Bind click event handlers.
    $story.click(function(e){
      if(! $(e.target).hasClass('unsub_link')){
        markAsClicked(fbid);
      }
    });
  },

  // Extract data from all story <li>s.
  getStories = function(stories){
    $(stories).each(function(){

      // Find all time link that contains <abbr>.
      // Note that not all timestamp <abbr> has the class .timeStamp,
      // especially in facebook groups.
      var $story = $(this),
          $link = $story.find('.uiStreamSource a').has('abbr'),
          href, match = null;


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
          processStory($story, match[1]);
        }else{
          console.log('STORY:', this, 'HREF: ', href);
        }

      }

    });
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
}(chrome));