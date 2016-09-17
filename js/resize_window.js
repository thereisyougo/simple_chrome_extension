const local = chrome.storage.local;
const tabs = [];
var translateCurrencyUrl = 'https://query.yahooapis.com/v1/public/yql?q=SELECT%20*%20FROM%20yahoo.finance.xchange%20where%20pair%20%3D%20%27{{ fromCurrency }}{{ toCurrency }}%27&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&diagnostics=false&format=xml';


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
    case 'removeHistory':
      lo.removeHistory();
      break;
    case 'changeDirection':
      lo.changeDirection();
      break;
    case 'translateCurrency':
      lo.translateCurrency();
      break;
    case 'fromCurrency':
      lo.focus.call(target);
      break;
    case 'toCurrency':
      lo.focus.call(target);
      break;
    case 'gotoOptions':
      lo.gotoOptions();
      break;
    case 'extensionsInfo':
      lo.extensionsInfo();
      break;
    case 'extensionInfo':
      lo.extensionInfo();
      break;
    case 'enableExtension':
      lo.enableExtension();
      break;
    case 'uninstallExtension':
      lo.uninstallExtension();
      break;
  }
});



const lo = {
  empty() {},
  uninstallExtension() {
    let extensionId = $('#extensionId').val();
    if (_.isEmpty(extensionId)) {
      chrome.management.uninstallSelf({showConfirmDialog: true}, function() {
        // ...
        lo.createNotify('Resize Window was uninstalled')
      });
    } else {
      chrome.management.uninstall(extensionId, {showConfirmDialog: true}, function() {
        $('#marks_content').val(`Extension ${extensionId} has been removed from browser`);
      })
    }
  },
  enableExtension() {
    let extensionId = $('#extensionId').val();
    let enabled = $('#whetherEnable').prop('checked');
    if (!_.isEmpty(extensionId)) {
      chrome.management.setEnabled(extensionId, enabled, function() {});
    }
  },
  extensionInfo() {
    let extensionId = $('#extensionId').val();
    if (_.isEmpty(extensionId)) {
      chrome.management.getSelf(function(extensionInfo) {
        $('#marks_content').val(JSON.stringify(extensionInfo));
      });
    } else {
      chrome.management.get(extensionId, function(extensionInfo) {
        $('#marks_content').val(JSON.stringify(extensionInfo));
      })
    }
  },
  extensionsInfo() {
    chrome.management.getAll(function(extensionInfos) {
      $('#marks_content').val(JSON.stringify(extensionInfos));
    });
  },
  gotoOptions() {
    if (chrome.runtime.openOptionsPage) {
      // New way to open options pages, if supported (Chrome 42+).
      chrome.runtime.openOptionsPage();
    } else {
      // Reasonable fallback.
      window.open(chrome.runtime.getURL('options.html'));
    }
  },
  focus() {
    this.select();
  },
  price: 0,
  translateCurrency() {
    let toCurrency = $('#toCurrency').val();
    let fromCurrency = $('#fromCurrency').val();
    if (_.isEmpty(toCurrency) || _.isEmpty(fromCurrency)) return;
    // 存储下来
    local.set({
      toCurrency,
      fromCurrency
    });

    let url = Mustache.render(translateCurrencyUrl, {toCurrency, fromCurrency})
    // console.info(url);
    $.get(url, function(data) {
      let rate = data.querySelector('Rate');
      lo.price = Number(rate.textContent)
      $('#resultCurrency').val(rate.textContent);
    }, 'xml').fail(function(jqXHR, textStatus, errorThrown) {
      // console.info(arguments);
      lo.createNotify(textStatus);
    });
  },
  changeDirection() {
    let [x, y] = [$('#fromCurrency').val(), $('#toCurrency').val()];
    $('#toCurrency').val(x);
    $('#fromCurrency').val(y);
  },
  removeHistory() {
    chrome.history.search(lo.getHistoryQueryObject(), function(historyItems) {
      historyItems.forEach(function(item) {
        chrome.history.deleteUrl({
          url: item.url
        }, function() {});
      });
      $('#marks_content').val(`${historyItems.length} history has removed`);
    });
  },
  searchHistory() {
    chrome.history.search(lo.getHistoryQueryObject(), function(historyItems) {
      let pros = [];
      historyItems.forEach(function(item) {
        pros.push(new Promise(function(resolve) {
          chrome.history.getVisits({
            url: item.url
          }, function(visitItems) {
            item.visit = visitItems;
            resolve();
          })
        }));
      });
      Promise.all(pros).then(function() {
        $('#marks_content').val(JSON.stringify(historyItems));
      });
    });
  },
  getHistoryQueryObject() {
    let historyText = $('#historyText').val();
    let startTime = $('#startTime').val();
    let endTime = $('#endTime').val();
    let maxResults = $('#maxResults').val();

    return {
      text: historyText,
      startTime: lo.datetimeToDate(startTime).getTime(),
      endTime: lo.datetimeToDate(endTime).getTime(),
      maxResults: Number(maxResults)
    };
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
  },
  addDays(days) {
    let d = new Date();
    d.setDate(d.getDate() + days);
    let dateString = d.toISOString();
    return dateString.substring(0, dateString.length - 8);
  },
  createNotify(msg, title = 'TIPS', contextMessage) {
    chrome.notifications.create('sampleNotify' + increCount(), {
      iconUrl: 'images/ic_star_border_black_48dp_1x.png',
      title: title,
      message: msg,
      contextMessage: contextMessage,
      type: 'basic'
    });
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
  $('#countCurrency').on('keyup mouseup', function(e) {
    let target = e.target;
    //console.info(target);
    if (lo.price !== 0) {
      $('#resultCurrency').val((Number(target.value).toFixed(4) * lo.price.toFixed(4)).toFixed(4))
    }
  });

  // 初始化历史时间
  $('#startTime').val(lo.addDays(-1));
  $('#endTime').val(lo.addDays(0));

  // 加载货币下拉选项
  $.get('js/currency_name.json', function(data) {
    data.forEach(function(item) {
      $('#currency').append($('<option/>', { value: item.symbol, text: item.name }))
    })
  }, 'json');

  local.get(['matchUrl', 'badgeColor', 'badgeText', 'browserWidth', 'browserHeight', 'currentTab', 'toCurrency', 'fromCurrency'], function(items) {
    assertAssign = assertAssign.bind(items);
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
    assertAssign('browserWidth')
    assertAssign('browserHeight')
    assertAssign('fromCurrency')
    assertAssign('toCurrency')

    lo.changeTab(items.currentTab);
  });

  function assertAssign(name) {
    if (this[name]) {
      $(Mustache.render('#{{.}}', name)).val(this[name]);
    }
  }
});

var increCount = (function() {
  let count = 0;
  return function() {
    return String(++count);
  };
})();


//jpgmnamnpadjhlgacaemfcfgdonjdjnl
//chrome-extension://jpgmnamnpadjhlgacaemfcfgdonjdjnl/popup.html
//chrome-extension://oimcnnhpjpepmhonikdllcleijcnfben/popup.html
