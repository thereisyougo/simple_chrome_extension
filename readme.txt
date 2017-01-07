onBeforeRequest（可选为同步）
请求即将发生，建立TCP连接前，可用于取消或重定向请求
onBeforeSendHeaders（可选为同步）
请求即将发生且Headers已被初始化，允许扩展去增加、修改、删除请求头
事件对象将传递给所有的事件订阅都，所以不同的订阅者可能尝试去修改请求
这个事件也可以被用来取消请求
onSendHeaders
在所有的扩展获得一个修改请求头的机会后触发，表现为最终(*)的请求发送版本，在Header发送至网络前事件被触发。事件信息化且异步处理。这里不允许修改或取消请求
onHeadersReceived（可选为同步）
在每次接收到HTTP(S)响应时触发，诸如重定向和认证请求可能在每次请求会发生多次。这个事件被用来增加，修改和删除响应头信息，如服务器回传的Set-Cookie头信息在事件触发之前缓存指令将得到执行，所以像修改Cache-Control这类头信息并不影响到浏览器缓存。它也允许你重定向请求
onAuthRequired (可选为同步)
当一个请求需要取得用户认证信息时触发，该事件可被用于同步的处理受权认证
注意扩展可能提供了一个错误的认证请求，所以要防止这里出现一再认证失败的情况
onBeforeRedirect
在重定向即将发生时触发，一个重定向可以被HTTP响应代码或一个扩展触发。该事件是信息化的且是异步处理的。不允许修改或取消请求
onResponseStarted
当从响应体里接受到第一个字节时触发。对于HTTP请求来说，此时的状态行与响应头都是有效的。该事件是信息化的且是异步处理的。。不允许修改或取消请求
onCompleted
当一个请求处理成功时触发
onErrorOccurred
当一个请求无法被成功处理时触发

web request api保证每一个请求最终都会去触发onCompleted或onErrorOccurred事件，除了
在一个重定向请求到URL为data://的地址时，onBeforeRedirect将作为最后的事件被触发

(*)注意web request api对扩展来说它只一个对网络栈的抽象
在内部，一个URL的请求可被划分为数个HTTP请求（如从一个大文件中每次获取一定量的数据）或可以由网络堆栈处理而不与网络通信
因为这个原因，api无法提供最终发送到网络中的头信息，如与缓存相关的头信息对扩展是不可见的

以下的Headers无法在onBeforeSendHeaders事件中提供，这份列表不一定完整且是稳定的
Authorization
Cache-Control
Connection
Content-Length
Host
If-Modified-Since
If-None-Match
If-Range
Partial-Data
Pragma
Proxy-Authorization
Proxy-Connection
Transfer-Encoding

使用webRequest api需要相应的权限，且只有以下协议可以被访问
http://, https://, ftp://, file://, or chrome-extension://
有时候甚至会隐藏具有使用上述方案之一的URL的某些请求
又chrome-extension://other_extension_id引用一个不存在的扩展ID时
来自扩展的同步XMLHTTPRequests请求会被阻塞事件处理器屏蔽，以防死锁
部分受支持的协议可能有部分事件会受到相应协议自己的限制
如文件协议file:仅有onBeforeRequest, onResponseStarted, onCompleted, and onErrorOccurred可被分派

概念
如下所说，web request api中的事件使用请求ID，当你在注册事件监听器时可选的指定过滤器和额外信息
Request IDs
每个请求由request ID标识，这个ID在当前浏览器会话和扩展上下文中保持唯一，在整个请求周期内保持不变
而且可用于匹配与同一个请求关联的其他事件。注意出现HTTP重定向或HTTP认证时，会将几个HTTP请求映射到一个Web请求
Registering event listeners
为WEB请求注册一个监听器，通常使用变量上的addListener()函数，指定一个回调，
必须指定一个过滤器参数，还可以指定一个可选的额外信息参数
如：
var callback = function(details) {...};
var filter = {...};
var opt_extraInfoSpec = [...];
chrome.webRequest.onBeforeRequest.addListener(callback, filter, opt_extraInfoSpec);
每个addListener的第一个参数强制性规定必须是一个回调
这个回调被传递给一个包含当前URL请求信息的字典
此字典中的信息取决于特定的事件类型以及opt_extraInfoSpec的内容

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

webRequest接口无法在Event Page中使用
阻止网络请求，需要声明webRequestBlocking权限