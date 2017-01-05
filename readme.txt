onBeforeRequest（可选的同步）
请求即将发生，建立TCP连接前，可用于取消或重定向请求
onBeforeSendHeaders（可选的同步）
请求即将发生且Headers已被初始化，允许扩展去增加、修改、删除请求头
事件对象将传递给所有的事件订阅都，所以不同的订阅者可能尝试去修改请求
这个事件也可以被用来取消请求
onSendHeaders
Fires after all extensions have had a chance to modify the request headers, and presents the final (*) version. The event is triggered before the headers are sent to the network. This event is informational and handled asynchronously. It does not allow modifying or cancelling the request.
onHeadersReceived (optionally synchronous)
Fires each time that an HTTP(S) response header is received. Due to redirects and authentication requests this can happen multiple times per request. This event is intended to allow extensions to add, modify, and delete response headers, such as incoming Set-Cookie headers. The caching directives are processed before this event is triggered, so modifying headers such as Cache-Control has no influence on the browser's cache. It also allows you to redirect the request.
onAuthRequired (optionally synchronous)
Fires when a request requires authentication of the user. This event can be handled synchronously to provide authentication credentials. Note that extensions may provide invalid credentials. Take care not to enter an infinite loop by repeatedly providing invalid credentials.
onBeforeRedirect
Fires when a redirect is about to be executed. A redirection can be triggered by an HTTP response code or by an extension. This event is informational and handled asynchronously. It does not allow you to modify or cancel the request.
onResponseStarted
Fires when the first byte of the response body is received. For HTTP requests, this means that the status line and response headers are available. This event is informational and handled asynchronously. It does not allow modifying or cancelling the request.
onCompleted
Fires when a request has been processed successfully.
onErrorOccurred
Fires when a request could not be processed successfully.
The web request API guarantees that for each request either onCompleted or onErrorOccurred is fired as the final event with one exception: If a request is redirected to a data:// URL, onBeforeRedirect is the last reported event.
(*) Note that the web request API presents an abstraction of the network stack to the extension. Internally, one URL request can be split into several HTTP requests (for example to fetch individual byte ranges from a large file) or can be handled by the network stack without communicating with the network. For this reason, the API does not provide the final HTTP headers that are sent to the network. For example, all headers that are related to caching are invisible to the extension.




实现细节
有几个实现细节理解可能对web request api的开发比较重要

解决冲突
在当前的web request api中，如果至少一个扩展指示要取消请求，则被认为请求被取消
如果一个请求取消了请求，所有扩展将通过onErrorOccurred事件被通知
每次仅有一个扩展被允许重定向请求或修改Header，如果多个扩展尝试修改请求，
则只接收最近一次安装的扩展发出的请求，其他的请求请求将被忽略
如果修改或重定向的请求被忽略，则此扩展将不会被通知

缓存
Chrome使用两个缓存-基于磁盘和基于内存的
in-memory cache的生命周期附着在渲染进程上，大致相当于一个tab
发出的请求如果从in-memory cache中得到的应答，对于web request api是不可见的
如果请求处理器修改其形为（如阻止一个请求）一个刷新操作可能不会响应这个变更事件
要确保事件可能正常触发，调用handlerBehaviorChanged()去刷新in-memory cache
但不要经常做; 刷新缓存是一个非常昂贵的操作
在注册和注销一个事件监听后不需要调用handlerBehaviorChanged()

事件戳
timestamp作为web request event的属性仅用于保证其内部一致性
提供一个事件对象与其他事件对象之间偏移量
但如果拿当前系统时间与其做比较可能会得到无法预知的结果

错误处理
如果尝试使用无效的参数注册一个事件，将抛出一个异常，且事件注册失败
如果是事件在被处理时抛出了异常或者是事件处理器返回了一个无效的阻塞响应
一个错误消息将记录在你的扩展程序的控制台里，且请求的处理将被忽略