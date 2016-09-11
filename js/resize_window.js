const local = chrome.storage.local;
const tabs = [];

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
    case 'showMarks':
      lo.showMarks();
      break;
    case 'searchMark':
      lo.searchMark();
      break;
    case 'getCookies':
      lo.getCookies();
      break;
    case 'removeCookies':
      lo.removeCookies();
      break;
    case 'searchHistory':
      lo.searchHistory();
      break;
  }
});

const lo = {
  empty() {},
  searchHistory() {
    let historyText = $('#historyText').val();
    let startTime = $('#startTime').val();
    let endTime = $('#endTime').val();
    let maxResults = $('#maxResults').val();

    $('#marks_content').val();
    let queryObj = {
      text: historyText,
      startTime: lo.datetimeToDate(startTime).getTime(),
      endTime: lo.datetimeToDate(endTime).getTime(),
      maxResults: Number(maxResults)
    };
    chrome.history.search(queryObj, function(historyItems) {
      $('#marks_content').val(JSON.stringify(historyItems));
    });
  },
  datetimeToDate(value) {
    return new Date(...(value.split(/\D/).map(function(v, i) {
      if (i === 1) return String(Number(v) - 1);
      return v;
    })));
  },
  removeCookies() {
    chrome.tabs.query({active: true}, function(tabs) {
      if (tabs.length === 0) return;
      chrome.cookies.getAll(lo.queryCookieCondition(tabs[0].url), function(cookies) {
        let array = [];
        cookies.forEach(function(cookie) {
          chrome.cookies.remove({
            url: tabs[0].url,
            name: cookie.name//,
            //storeId: cookie.storeId
          }, function(details) {
            array.push(details);
          })
        });
        $('#marks_content').val(JSON.stringify(array));
      });
    })
  },
  getCookies() {
    chrome.tabs.query({active: true}, function(tabs) {
      if (tabs.length === 0) return;
      chrome.cookies.getAll(lo.queryCookieCondition(tabs[0].url), function(cookies) {
        $('#marks_content').val(JSON.stringify(cookies));
      });
    })
  },
  queryCookieCondition(url) {
    let queryObj = {
      url: url,
    }
    let cookieName = $('#cookieName').val();
    if (!_.isEmpty(cookieName)) {
      $.extend(queryObj, {name: cookieName})
    }
    return queryObj;
  },
  searchMark() {
    let kw = $('#markKeyword').val();
    if (_.isEmpty(kw)) return;
    let array = [];
    chrome.bookmarks.search(kw, function(treeNodes) {
      treeNodes.forEach(function(entry) {
        array.push(entry);
      });
      $('#marks_content').val(JSON.stringify(array));
    });
  },
  showMarks() {
    let array = [];
    function walk(nodes) {
      nodes.forEach(function(entry) {
        if ('children' in entry && entry.children.length) {
          walk(entry.children);
          delete entry.children;
          Object.defineProperty(entry, 'type', { value: 'folder', enumerable: true })
          //entry.type = 'folder';
        }
        array.push(entry);
      });
    }
    chrome.bookmarks.getTree(function(treeNodes) {
      walk(treeNodes);
      $('#marks_content').val(JSON.stringify(array));
    });
  },
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
    //if (!_.isEmpty(badgeText)) {
      this.setBadgeText(badgeText);
      local.set({ badgeText });
    //}
  },
  resizeBtn() {
    chrome.windows.getCurrent({ populate: true }, function(win) {
      // console.info(win.id);
      // console.info(win);
      let f = (val, defaultVal) => _.isEmpty(val) ? defaultVal : val;

      let w = $('#browserWidth').val();
          h = $('#browserHeight').val();
      w = f(w, 1280);
      h = f(h, 800);
      local.set({
        browserWidth: w,
        browserHeight: h
      });
      chrome.windows.update(win.id, {
        width: Number(w),
        height: Number(h),
        drawAttention: true
      }, function(win) {

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
  },
  changeTab(index) {
    if (tabs.length === 0) return;
    if (!_.isNumber(index)) {
      tabs.slice(1).forEach(function(el) {
        $(el).hide();
      });
    } else {
      $(tabs[index]).show();
      let copy = tabs.slice()
      copy.splice(index, 1);
      copy.forEach(function(el) {
        $(el).hide();
      });
    }
  }
}



$(function() {
  (function buildTab() {
    let index = 1;
    $('.wrapper > div[id^="tab"]').each(function(_, el) {
      tabs.push(el);
      $('header').append($('<span/>').addClass('as-button').text(index++))
    });
  }());
  $(document).on('click', function(e) {
    let target = e.target;
    if ($(target).hasClass('as-button')) {
      let index = Number($(target).text()) - 1;
      lo.changeTab(index);
      local.set({currentTab: index});
    }
  });

  local.get(['matchUrl', 'badgeColor', 'badgeText', 'browserWidth', 'browserHeight', 'currentTab'], function(items) {
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
    if (items.browserWidth) {
      $('#browserWidth').val(items.browserWidth);
    }
    if (items.browserHeight) {
      $('#browserHeight').val(items.browserHeight);
    }
    lo.changeTab(items.currentTab);

  });
});


//jpgmnamnpadjhlgacaemfcfgdonjdjnl
//chrome-extension://jpgmnamnpadjhlgacaemfcfgdonjdjnl/popup.html
//chrome-extension://oimcnnhpjpepmhonikdllcleijcnfben/popup.html
