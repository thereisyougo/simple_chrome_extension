window.addEventListener('contextmenu', function(evt) {
  var selection = window.getSelection();
  // console.info(selection);
  if(selection.anchorOffset != selection.focusOffset){
    try {
      chrome.runtime.sendMessage({id: 'transbygoo', 'text': selection.toString()});
    } catch(e) {
      console.info(e);
    }
  }
});