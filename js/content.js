window.addEventListener('mouseup', function() {
  var selection = window.getSelection();
  // console.info(selection);
  if(selection.anchorOffset != selection.focusOffset){
    chrome.runtime.sendMessage({id: 'transbygoo', 'text': selection.toString()});
  }
});