/*global WebKitMutationObserver */

(function(undefined){
  "use strict";

  var
  getStories = function(stories){
    $(stories).each(function(){

      // Find all time link that contains <abbr>.
      // Note that not all timestamp <abbr> has the class .timeStamp,
      // especially in facebook groups.
      var $link = $(this).find('.uiStreamSource a').has('abbr');

      // It is possible that a story has no uiStreamSource.
      // (for trivial stories, or stories not viewable(?))
      // It is also possible that a story has multiple uiStreamSource,
      // if an object is shared by multiple people.
      console.log('STORY:',this,'URL: ', $link);
    });
  };

  var

  // Ajax-load stories handler
  newStoryObserver = new WebKitMutationObserver(function(mutations){
    console.log('New story detected', mutations);

    // call getStories with newly inserted stories
    getStories(mutations[0].addedNodes);
  }),

  // Page change handler
  pageChangeObserver = new WebKitMutationObserver(function(mutations){
    console.log('pageChangeObserver', mutations);

    var current_ul = $('.uiStreamHomepage').get(0);
    this.ul = this.ul || null;

    // If the page is surely changed, unregister the old story observer
    // and reset newStoryObserver to observe the new <ul>
    if(mutations[0].addedNodes.length > 0 &&
       this.ul !== current_ul){
      console.log('UL is re-constructed!');
      newStoryObserver.disconnect();
      this.ul = current_ul;

      newStoryObserver.init(
        $(mutations[0].addedNodes).find('.uiStreamHomepage').get(0));
    }
  });

  // Mixin methods into newStoryObserver
  newStoryObserver.init = function(ul){
    console.log('Initailizing new-story observer');
    ul = ul || $('.uiStreamHomepage').get(0);
    if(ul){
      this.observe(ul, {childList: true} );
    }else{
      console.log('No stream detected on this page.');
    }
  }

  var testSubtreeObserver = new WebKitMutationObserver(function(mutations){

    // squash all added nodes into one jQuery object.
    var $nodes = $();
    $.each(mutations, function(){
      $nodes = $nodes.add(this.addedNodes);
    });

    var
    $ul = $nodes.filter('.uiStreamHomepage'),
    $stories = $nodes.filter('.uiStreamStory');

    if($ul.length){
      console.log('=== PAGE CHANGE ===');
    }else if($stories.length){
      console.log('=== STORY ADDED ===', $stories);
    }else{
      console.log('Subtree Mutations: ', $nodes);
    }
  });

  testSubtreeObserver.observe( $('#contentCol').get(0), {subtree: true, childList: true} );

  // Initialize page-change observer
  pageChangeObserver.observe( $('#contentCol').get(0), {childList: true} );

  // Initialize new-story observer
  newStoryObserver.init();

  getStories($('.uiStreamStory'));
}());