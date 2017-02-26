const local = chrome.storage.local;
const tabs = [];
var translateCurrencyUrl = 'https://query.yahooapis.com/v1/public/yql?q=SELECT%20*%20FROM%20yahoo.finance.xchange%20where%20pair%20%3D%20%27{{ fromCurrency }}{{ toCurrency }}%27&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&diagnostics=false&format=xml';


document.addEventListener('click', function(e) {
  var target = e.target;
  if (!('id' in target)) return;
  switch (target.id) {
    case 'tab0':
      lo.firstTab();
      break;
    case 'tab1':
      lo.lastTab();
      break;
    case 'fromCurrency':
      lo.focus.call(target);
      break;
    case 'toCurrency':
      lo.focus.call(target);
      break;
    case 'resizeBtn':
    case 'closeTab':
    case 'changeTitle':
    case 'changeBadge':
    case 'popupNotify':
    case 'showMarks':
    case 'searchMark':
    case 'getCookies':
    case 'removeCookies':
    case 'searchHistory':
    case 'removeHistory':
    case 'changeDirection':
    case 'translateCurrency':
    case 'gotoOptions':
    case 'extensionsInfo':
    case 'extensionInfo':
    case 'enableExtension':
    case 'uninstallExtension':
    case 'duplicateTab':
    case 'gotoYahoo':
    case 'alarm':
    case 'cpu':
    case 'memory':
    case 'storage':
    case 'nodedist':
      lo[target.id](target.dataset);
    default:
      //lo.createNotify('no function');
  }
});



const lo = {
  empty() {},
  nodedist() {
    chrome.runtime.sendMessage(_.assign({id: 'download_node'}, arguments[0]), function(response) {

    });
  },
  memory() {
    chrome.runtime.sendMessage({id: 'memory'}, function(response) {
      lo.createNotify3({obj: response});
    });
  },
  storage() {
    chrome.runtime.sendMessage({id: 'storage'}, function(response) {
      lo.createNotify3({obj: response});
    });
  },
  cpu() {
    chrome.runtime.sendMessage({id: 'cpu'}, function(response) {
      lo.createNotify3({obj: response});
    })
  },
  alarm() {
    chrome.runtime.sendMessage({id: 'alarm', name: 'self_alarm', alarmInfo: {
        when : 1000 * 3,
        //delayInMinutes: 0,
        periodInMinutes: 60
    }});
  },
  gotoYahoo() {
    let toCurrency = $('#toCurrency').val();
    let fromCurrency = $('#fromCurrency').val();
    chrome.runtime.sendMessage({id: 'gotoYahoo', params: {c1:fromCurrency, c2: toCurrency}});
  },
  duplicateTab() {
    chrome.tabs.query({active: true}, function(tabs) {
      // if (tabs.length === 0) return;
      chrome.windows.getCurrent({populate: true}, function(win) {
        let activeTabs = tabs.map(t=>t.id);
        let currentTab = win.tabs.find(function(item) {
          return activeTabs.includes(item.id)
        });
        chrome.tabs.duplicate(currentTab.id, function(tab) {
          lo.createNotify('current tab has been duplicated');
        });
      });
      
    })
  },
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
      let currentCount = $('#countCurrency').val();
      if (Number(currentCount) > 0) {
        let r = Number($('#resultCurrency').val());
        $('#resultCurrency').val((Number(currentCount) * r).toFixed(4));
      }
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
      // Date的月份从0 ~ 11, 所以从页面上取值后减1
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
  createNotify(msg, title = chrome.i18n.getMessage('hint'), contextMessage) {
    chrome.notifications.create('sampleNotify' + increCount(), {
      iconUrl: 'images/ic_star_border_black_48dp_1x.png',
      title: title,
      message: msg,
      contextMessage: contextMessage,
      type: 'basic'
    });
  },
  createNotify2(msg) {
    Notification.requestPermission().then(function(result) {
      if (result === 'denied') {
        lo.createNotify('Permission wasn\'t granted. Allow a retry.');
        return;
      }
      if (result === 'default') {
        lo.createNotify('The permission request was dismissed.');
        return;
      }
      new Notification(chrome.i18n.getMessage('hint'), {
        icon: 'images/ic_star_border_black_48dp_1x.png',
        body: msg
      })
    });
  },
  createNotify3({msg = '', title = chrome.i18n.getMessage('hint'), obj = {}, extraOptions = {}}) {
    if (Object.keys(obj).length === 0) {
      lo.createNotify('obj is empty')
      return;
    }
    let listOptions = {
      type: 'list',
      items: Object.keys(obj).map(function(name) {
        return {title: name, message: JSON.stringify(obj[name])}
      })
    };
    chrome.notifications.create('sampleNotify' + increCount(), $.extend({
      iconUrl: 'images/ic_star_border_black_48dp_1x.png',
      title: title,
      message: msg,
      type: 'basic'
    }, listOptions));
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
  
  // 取当前WIN尺寸
  chrome.windows.getCurrent({ populate: true }, function(win) {
    $('#currentSize').data({width: win.width, height: win.height}).text(`${win.width}x${win.height}`).on('click', function(e) {
      let w = Number($(this).data('width'));
      let h = Number($(this).data('height'));
      $('#browserWidth').val(w);
      $('#browserHeight').val(h);
      local.set({
        browserWidth: w,
        browserHeight: h
      });
      lo.createNotify('current window size has been stored')
    });
  });

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
