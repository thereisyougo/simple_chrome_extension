document.addEventListener('click', function(e) {
  var target = e.target;
  if (!('id' in target)) return;
  switch (target.id) {
    case 'reszieBtn':
      lo.resizeBtn();
      break;
    case 'tab0':
      lo.firstTab();
      break;
    case 'tab1':
      lo.lastTab();
      break;
    case 'closeTab':
      lo.closeTab();
      break;
    case 'changeTitle':
      lo.changeTitle();
      break;
    case 'changeBadge':
      lo.changeBadge();
      break;
    case 'popupNotify':
      lo.popupNotify();
      break;
  }
});

const lo = {
  empty() {},
  popupNotify() {
    chrome.runtime.sendMessage({id: 'popupNotify'});
  },
  setBadgeBackgroundColor(color) {
    if (color.startsWith('[')) {
      let result = _.attempt(function(array) {
        return JSON.parse(array);
      }, color)
      if (!_.isError(result)) {
        color = result;
      }
    }
    chrome.browserAction.setBadgeBackgroundColor({ color: color });
  },
  setBadgeText(text) {
    chrome.browserAction.setBadgeText({ text: text });
  },
  changeBadge() {
    let badgeColor = $('#badgeColor').val();
    let badgeText = $('#badgeText').val();
    if (!_.isEmpty(badgeColor)) {
      this.setBadgeBackgroundColor(badgeColor);
      local.set({ badgeColor });
    }
    if (!_.isEmpty(badgeText)) {
      this.setBadgeText(badgeText);
      local.set({ badgeText });
    }
  },
  resizeBtn() {
    chrome.windows.getCurrent({ populate: true }, function(w) {
      // console.info(w.id);
      // console.info(w);
      chrome.windows.update(w.id, {
        width: 1280,
        height: 800,
        drawAttention: true
      }, function(w) {

      });
    });
  },
  firstTab() {
    chrome.windows.getCurrent({ populate: true }, function(w) {
      chrome.tabs.update(w.tabs[0].id, {
        active: true,
        //highlighted: true,
        //pinned: true
        //muted: true
      });
    });
  },
  lastTab() {
    chrome.windows.getCurrent({ populate: true }, function(w) {
      //console.info(w.tabs instanceof Array);
      chrome.tabs.update(_.last(w.tabs).id, {
        active: true,
      });
    });
  },
  closeTab() {
    let matchUrl = document.getElementById('matchUrl').value;
    if (matchUrl.trim() !== '') {
      local.set({ matchUrl: matchUrl })
    } else {
      local.get('matchUrl', function(items) {
        if (items.matchUrl)
          matchUrl = items.matchUrl;
        else
          matchUrl = 'http://*.anonymous.*/*';
      });
    }

    chrome.tabs.query({
      url: matchUrl
    }, function(tabs) {
      if (tabs && tabs.length > 0)
        tabs.forEach(function(i) {
          chrome.tabs.remove(i.id);
        });
    });
  },
  changeTitle() {
    let badgeTitle = document.getElementById('badgeTitle').value;
    chrome.browserAction.setTitle({ title: badgeTitle });
  }
}

const local = chrome.storage.local;

local.get(['matchUrl', 'badgeColor', 'badgeText'], function(items) {
  if (items.matchUrl)
    $('#matchUrl').val(items.matchUrl);
  if (items.badgeColor) {
    $('#badgeColor').val(items.badgeColor);
    lo.setBadgeBackgroundColor(items.badgeColor);
  }
  if (items.badgeText) {
    $('#badgeText').val(items.badgeText);
    lo.setBadgeText(items.badgeText);
  }
});



//jpgmnamnpadjhlgacaemfcfgdonjdjnl
//chrome-extension://jpgmnamnpadjhlgacaemfcfgdonjdjnl/popup.html
