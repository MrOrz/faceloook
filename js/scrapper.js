(function(doc){
  var stories = doc.querySelectorAll('.uiStreamStory'), i;
  for(i=0; i<stories.length; i+=1){
    console.log('STORY:',stories[i],stories[i].dataset);
    // find input[name=feedback_params]
  }
}(document));