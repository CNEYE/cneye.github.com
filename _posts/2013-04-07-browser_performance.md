---
layout: index
title: 如何探测浏览器的繁忙程度 
tags: 浏览器、性能
category: 浏览器
---

##浏览器的繁忙程度受哪些因素？##
1、资源加载时
    + 页面渲染之前
        + 可以判断为浏览器资源加载繁忙，domready之后就为资源加载空闲
    + 页面渲染之后
        + 如何判断？
2、dom树构建和渲染UI时、js运算时
    + 原理资料：[[http://hi.baidu.com/821402834/item/950fadfa82b3fdbe31c199ca|浏览器的渲染机制]] 、[[http://www.doc88.com/p-707864123247.html|深入理解javascript定时机制]] 、[[http://msdn.microsoft.com/zh-cn/library/ie/hh920765(v=vs.85).aspx|requestAnimationFrame 函数介绍]]
    + 浏览器内核中javascript引擎线程和界面渲染线程是互斥的，即**其中一个运行的时候另一个将会挂起**。
    + 调用setTimeout、setInterval会将该“任务”放到javascript的执行队列之后（**排队**）
    + setTimeout和requestAnimationFrame 的一些区别
        + 回调函数执行时间：requestAnimationFrame 在浏览器需要**更新页面显示**时（而且仅在这种情况下）获得通知，而setTimeout函数是在javascript执行队列执行到该回调“任务”的时候才会获得通知
        + requestAnimationFrame 在浏览器最小化不会有通知

##如何判断浏览器资源加载繁忙状态##
1、方案（仅仅是方案，没有验证）
    + 通过网速判断 @游侠 
        + 通过加载一个资源的前后时间差，判断是否有大量资源在下载
    + 通过hooks浏览器支援操作函数、类（appendChild、Image，Audio），配合domready
        + 在浏览器发生该类有可能产生支援请求的函数、类的调用的时候监听支援的加载、完成情况。
    + 更好的方案 for what？
          * 
##如何从侧面判断浏览器繁忙程度 (非资源)##
1、按道理 setInterval,requestAnimationFrame函数的执行时间间隔应该固定，我们希望的理论状态。但是在通常情况下，这个执行时间间隔是由延迟的。
    + WHY？
        + 当浏览器渲染的时候（界面渲染线程时间）会冻结javascript解析线程，javascript执行队列也就挂起了。
        + 当js执行的时候（javascript解析线程时间）会冻结界面渲染线程，requestAnimationFrame的获得通知的时间也就挂起了。
        + 如果界面渲染比较繁忙或则JS执行比较繁忙。则相应的javascript解析线程、界面渲染线程的挂起时间就会更久了。
    + HOW ？ 
        + 尝试用setInterval，和requestAnimationFrame函数的执行延迟时间来侧面体现浏览器  dom树构建和渲染UI 和 JS执行渲染的繁忙程度。