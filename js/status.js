var increCount = (function() {
  let count = 0;
  return function() {
    return String(++count);
  };
})();

function httpRequest(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      callback(xhr);
    }
  }
  xhr.onerror = function() {
    callback(false);
  }
  xhr.send();
}

function parseXML(data) {
  var xml;
  if (!data || typeof data !== "string") {
    return null;
  }
  try {
    if (window.DOMParser) { // Standard
      xml = (new window.DOMParser()).parseFromString(data, "text/xml");
    } else { // IE
      xml = new window.ActiveXObject("Microsoft.XMLDOM");
      xml.async = "false";
      xml.loadXML(data);
    }
  } catch (e) {
    xml = undefined;
  }
  if (!xml || !xml.documentElement || xml.getElementsByTagName("parsererror").length) {
    console.info("Invalid XML: " + data);
  }
  return xml;
};

function createMenu() {

  // A generic onclick callback function.
  function genericOnClick(info, tab) {
    console.log("item " + info.menuItemId + " was clicked");
    console.log("info: " + JSON.stringify(info));
    console.log("tab: " + JSON.stringify(tab));
  }

  // Create one test item for each context type.
  // "all"不包括launcher 且只有app可使用"launcher"
  /*
  var contexts = ["page", "frame", "selection", "link", "editable", "image", "video", "audio",
  "browser_action", "page_action"];
  for (var i = 0; i < contexts.length; i++) {
    var context = contexts[i];
    var title = "Test '" + context + "' menu item";
    var id = chrome.contextMenus.create({ "id": increCount(), "title": title, "contexts": [context] });
    console.log("'" + context + "' item:" + id);
  }*/

  chrome.contextMenus.create({
    id: 'transbygoo',
    title: '使用Google翻译',
    contexts: ['selection'],
    type: 'normal'
  });

  // Create a parent item and two children.
  var parent = chrome.contextMenus.create({ "id": "tabMoveMenu", "title": "Test tab move" });
  var child1 = chrome.contextMenus.create({ "id": "tab_forward", "title": "Forward", "parentId": parent });
  var child2 = chrome.contextMenus.create({ "id": "tab_backward", "title": "Backward", "parentId": parent });
  console.log("parent:" + parent + " child1:" + child1 + " child2:" + child2);

  parent = chrome.contextMenus.create({"id": "tabChangeMenu", "title": 'Test tab update'});
  chrome.contextMenus.create({ "id": "tab_highlighted", "type": "checkbox", "title": "Highlighted", "parentId": parent });
  chrome.contextMenus.create({ "id": "tab_pinned", "type": "checkbox", "title": "Pinned", "parentId": parent });
  chrome.contextMenus.create({ "id": "tab_muted", "type": "checkbox", "title": "Muted", "parentId": parent });
  chrome.contextMenus.create({ "id": "tab_autoDiscardable", "type": "checkbox", "title": "autoDiscardable", "parentId": parent });

  // Create some radio items.
  function radioOnClick(info, tab) {
    console.log("radio item " + info.menuItemId +
      " was clicked (previous checked state was " +
      info.wasChecked + ")");
  }
  var radio1 = chrome.contextMenus.create({
    "id": increCount(),
    "title": "Radio 1",
    "type": "radio"
  });
  var radio2 = chrome.contextMenus.create({
    "id": increCount(),
    "title": "Radio 2",
    "type": "radio"
  });
  console.log("radio1:" + radio1 + " radio2:" + radio2);

  // Create some checkbox items.
  function checkboxOnClick(info, tab) {
    console.log(JSON.stringify(info));
    console.log("checkbox item " + info.menuItemId +
      " was clicked, state is now: " + info.checked +
      "(previous state was " + info.wasChecked + ")");

  }
  var checkbox1 = chrome.contextMenus.create({ "id": increCount(), "title": "Checkbox1", "type": "checkbox" });
  var checkbox2 = chrome.contextMenus.create({ documentUrlPatterns: ['*://*.verycd.com/*'], "id": increCount(), "title": "Checkbox2", "type": "checkbox" });
  // targetUrlPatterns based on the src attribute of img/audio/video tags
  console.log("checkbox1:" + checkbox1 + " checkbox2:" + checkbox2);
  // 几种ItemType "normal", "checkbox", "radio", or "separator"

  // Intentionally create an invalid item, to show off error checking in the
  // create callback.
  /*console.log("About to try creating an invalid item - an error about " +
    "item 999 should show up");
  chrome.contextMenus.create({ "id": increCount(), "title": "Oops", "parentId": 999 }, function() {
    if (chrome.extension.lastError) {
      console.log("Got expected error: " + chrome.extension.lastError.message);
    }
  });*/
}

function popupNotify() {
  let c = increCount();

  chrome.notifications.create('normalNotify' + c, {
    type: 'progress',
    iconUrl: 'images/icon48.png',
    title: `SAMPLE MESSAGE ${c}`,
    message: 'good kids',
    contextMessage: `${c} lambs`,
    progress: 0,
    //priority: 0,
    //eventTime: Date.now() + 500,
    buttons: [{
      title: 'aaa',
      iconUrl: 'images/aa.png'
    }, {
      title: 'bbb',
      iconUrl: 'images/ic_star_border_black_48dp_1x.png'
    }, {
      title: 'ccc',
      iconUrl: 'images/ic_star_black_48dp_1x.png'
    }]
    //imageUrl: 'images/logo.png'
    /*items: [{
      title: 'aaa',
      message: 'aaa'
    }, {
      title: 'bbb',
      message: 'bbb'
    }, {
      title: 'ccc',
      message: 'ccc'
    }]*/
  }, function(notificationId) {
    let prog = 0;

    function cal() {
      prog += 2;
      chrome.notifications.update(notificationId, {
        progress: prog
      });
      if (prog < 100)
        setTimeout(cal, 100);
      else {
        setTimeout(function() {
          chrome.notifications.clear(notificationId);
          createNotify('OK', 'progress done');
        }, 200);
      }
    }
    setTimeout(cal, 100);
  });
}

function createNotify(msg, title = chrome.i18n.getMessage('hint')) {
  chrome.notifications.create('sampleNotify' + increCount(), {
    iconUrl: 'images/ic_star_border_black_48dp_1x.png',
    title: title,
    message: msg,
    contextMessage: '2 lambs',
    type: 'basic'
  });
}

function activeAlarm(name, alarmInfo) {
  // chrome.alarms.create(name, alarmInfo);
}

function downloadNode(arch) {
  var newTabId;
  function myListener2(tabId, info, tab) {
    if (tab.status === 'complete' && tabId === newTabId) {
      chrome.tabs.executeScript(tabId, {
        code: `[].map.call(document.links, it=>it.href).filter(item=>/-x${arch}.msi$/.test(item))`
      }, function(results) {
        let result = results[0];
        chrome.downloads.download({
          url: result[0],
          conflictAction: 'overwrite'
        }, function(downloadId) {
          console.info(downloadId);
          chrome.tabs.remove(tabId);
        });
      });
      chrome.tabs.onUpdated.removeListener(myListener2);
    }
  }
  function myListener(tabId, info, tab) {
    if (tab.status === 'complete' && tabId === newTabId) {
      chrome.tabs.executeScript(tabId, {
        code: '[].map.call(document.links, it=>it.href)'
      }, function(results) {
        //console.info(results);
        let allversions = results[0].filter(link=>/v[0-9\.]+\/$/.test(link)).map(function(link) {
          return link.match(/v[0-9\.]+/)[0].substring(1);
        }).sort(function(a, b) {
          let x = a.split(/\./),
              y = b.split(/\./);
          return y[0] - x[0] || y[1] - x[1] || y[2] - x[2]
        });
        chrome.tabs.executeScript(tabId, {
          code: `[].filter.call(document.links, it=>new RegExp("v${allversions[0]}").test(it.href)).map(link=>link.href)`
        }, function(rs) {
          let result = rs[0];
          chrome.tabs.onUpdated.addListener(myListener2);
          chrome.tabs.update(tabId, {
            url: result[0]
          }, function(tab) {
            newTabId = tab.id;
          });
        })
      });
      chrome.tabs.onUpdated.removeListener(myListener);
    }
  }
  chrome.tabs.onUpdated.addListener(myListener);
  chrome.tabs.create({
    url: 'https://nodejs.org/dist/',
    active: false
  }, function(tab) {
    newTabId = tab.id;
  });
}


function $(id) {
  return {
    [0]: document.querySelector(id),
    val(value, func) {
      if (!this[0]) return void 0;
      if (typeof value === 'function') {
        let v = this[0].value
        value.call(this[0], v);
        return v;
      }
      if (typeof func === 'function') {
        this[0].value = value;
        func.call(this[0], value);
      }
      if (arguments.length === 0) {
        return this[0].value;
      } else {
        this[0].value = value;
        return this;
      }
    }
  };
}

const local = chrome.storage.local;

function loadStorage() {
  local.get(['badgeColor', 'badgeText'], function(items) {
    if (items.badgeColor) {
      $('#badgeColor').val(items.badgeColor, function(val) {
        lo.setBadgeBackgroundColor(val);
      });
    }
    if (items.badgeText) {
      $('#badgeText').val(items.badgeText, function(val) {
        lo.setBadgeText(val);
      });
    }
  });
}


chrome.runtime.onInstalled.addListener(function(info) {
  console.info('install reason: ', info);
  createMenu();
  loadStorage();
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  // info => menuItemId, parentMenuItemId, mediaType, linkUrl, srcUrl, pageUrl, frameUrl, frameId, selectionText, editable, wasChecked, checked
  //console.info(info);
  //console.info(tab);
  if (info.menuItemId === 'transbygoo') {
    var url = 'http://translate.google.com.hk/#auto/zh-CN/' + info.selectionText;
    window.open(url, '_blank');
  }
  if (info.parentMenuItemId === 'tabChangeMenu') {
    let propName = info.menuItemId.substring(4);
    chrome.tabs.update({
      [propName]: info.checked
    })
  } else if (info.parentMenuItemId === 'tabMoveMenu') {
    let propName = info.menuItemId.substring(4);
    chrome.windows.getCurrent({
      populate: true
    }, function(window) {
      let lastIndex = window.tabs.length - 1;
      if (lastIndex === 0) return;
      let direction = propName.startsWith('f') ? -1 : 1;
      chrome.tabs.query({active: true}, function(tabs) {
        let tab = tabs[0];
        if (tab.index === lastIndex && direction === 1) return;
        if (tab.index === 0 && direction === -1) return;
        chrome.tabs.move([tab.id], {
          windowId: window.id,
          index: tab.index + direction
        }, function(tabs) {
          // ...
        });
      });
    });
  }
});

chrome.notifications.onClicked.addListener(function(notificationId) {

});
chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {

});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  console.info(msg);
  if (msg.id) {
    switch (msg.id) {
      case 'transbygoo':
        chrome.contextMenus.update('transbygoo', {
          title: `使用Google翻译"${msg.text}"`
        }, function() {});
        break;
      case 'popupNotify':
        popupNotify();
        break;
      case 'gotoYahoo':
        gotoYahoo(msg.params);
        break;
      case 'alarm':
        activeAlarm(msg.name, msg.alarmInfo);
        break;
      case 'cpu':
        chrome.system.cpu.getInfo(function(info) {
          sendResponse(info);
        });
        return true;
      case 'memory':
        chrome.system.memory.getInfo(function(info) {
          sendResponse(info);
        });
        return true;
      case 'storage':
        chrome.system.storage.getInfo(function(info) {
          sendResponse(info);
        });
        return true;
      case 'download_node':
        downloadNode(msg.arch | '64');
        break;
    }
  }
});

/*chrome.omnibox.setDefaultSuggestion({
  description: '<match>%s</match>'
});*/


var url = 'https://query.yahooapis.com/v1/public/yql?q=SELECT%20*%20FROM%20yahoo.finance.xchange%20where%20pair%20%3D%20%27USDCNY%27&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&diagnostics=false&format=xml';
// http://finance.yahoo.com/quote/USDCNY=X?ltr=1
// http://finance.yahoo.com/webservice/v1/symbols/allcurrencies/quote?format=xml
var price;

(function loadRate() {
  httpRequest(url, function(r) {
    var doc = r.responseXML;
    var rate = doc.querySelector('Rate');
    price = Number(rate.textContent);
    console.info(price);
  });
})();

function gotoYahoo({c1, c2}) {
  chrome.tabs.create({
    // windowId
    // index
    url: `http://finance.yahoo.com/q?s=${c1}${c2}=X`,
    // active: true
    // pinned: false
    // openerTabId
  }, function(tab) {
  });
  // window.open('http://finance.yahoo.com/q?s=USDCNY=X');
}

function updateAmount(amount, exchange) {
  if (!price) return;
  amount = Number(amount);
  if (isNaN(amount) || !amount) {
    exchange([{
      'content': '$1 = ¥' + price.toFixed(4),
      'description': '$1 = ¥' + price.toFixed(4)
    }, {
      'content': '¥1 = $' + (1 / price).toFixed(6),
      'description': '¥1 = $' + (1 / price).toFixed(6)
    }]);
  } else {
    exchange([{
      'content': '$' + amount + ' = ¥' + (amount * price).toFixed(4),
      'description': '$' + amount + ' = ¥' + (amount * price).toFixed(4)
    }, {
      'content': '¥' + amount + ' = $' + (amount / price).toFixed(6),
      'description': '¥' + amount + ' = $' + (amount / price).toFixed(6)
    }]);
  }
}

chrome.omnibox.onInputStarted.addListener(function() {
  console.info('started.');

});

chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
  // suggest([]SuggestResult)
  /*if (text === 'v') {
    suggest([{
      content: 'http://www.verycd.com',
      description: '<match>V</match>ERYCD<dim>.COM</dim> - <url>http://www.verycd.com</url>'
    }]);
  }*/ 
  if (text !== '') {
    suggest([{
      content: `https://cdict.net/q/${text}`,
      description: `Query Word: <match>${text}</match>`
    }])
  } else if (text.startsWith('msg:') && text.indexOf('{', 4) < text.lastIndexOf('}')) {
    let msg = /\{([^\}]*)\}/.exec(text)[1];
    if (msg.trim() !== '') {
      createNotify(msg);
    }
  } else if (text.startsWith('moz:')) {
    suggest([{
      content: `https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/${text.substring(4)}`,
      description: 'MOZ JAVASCRIPT DOC'
    }])
  } else if (!isNaN(text)) {
    updateAmount(text, suggest);
  }
});

chrome.omnibox.onInputEntered.addListener(function(text, onInputEnteredDisposition) {
  // "currentTab", "newForegroundTab", or "newBackgroundTab"
  console.info(text, onInputEnteredDisposition);
  chrome.tabs.query({
    active: true
  }, function(tabs) {
    if (tabs.length > 0) {
      chrome.tabs.update(tabs[0].id, {
        url: text
      });
    }
  });
});
chrome.omnibox.onInputCancelled.addListener(function() {
  console.info('cancelled.');
});

chrome.management.onInstalled.addListener(function(exInfo) {
  console.log('Extension '+exInfo.id+' has been installed.');
});

chrome.management.onUninstalled.addListener(function(exId) {
  console.log('Extension '+exId+' has been uninstalled.');
});

chrome.management.onEnabled.addListener(function(exInfo) {
  console.log('Extension '+exInfo.id+' has been enabled.');
});

chrome.management.onDisabled.addListener(function(exInfo) {
  console.log('Extension '+exInfo.id+' has been disabled.');
});

/*chrome.alarms.onAlarm.addListener(function(alarm) {
    console.log('Alarm info ', alarm);
});*/