// 1. 定义缓存名称（建议添加版本号，方便后续更新缓存时清理旧缓存）
const APP_NAME = "对账3"
const CACHE_NAME = `${APP_NAME}-pwa-offline-v1.0.3`;
// 2. 定义需要提前缓存的核心资源列表（对应项目中的静态资源）
const CORE_ASSETS = [
    "./index.html",
    "./index.js",
    "./512.png",
    './filterArgType_a29e0efbe809077351b59a6faa4e2f35.txt'
];

// 3. 安装阶段：缓存核心资源
self.addEventListener("install", (event) => {
    console.log("Service Worker 开始安装...");
    // waitUntil：确保安装完成前，缓存操作全部完成（否则安装可能提前终止）
    event.waitUntil(
        // caches.open：打开指定名称的缓存（不存在则创建）
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log("缓存仓库打开成功，开始缓存核心资源");
                // cache.addAll：批量添加资源到缓存（资源路径必须正确，否则缓存失败）
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => {
                // skipWaiting：跳过等待，直接激活新的 Service Worker（可选，加快更新速度）
                return self.skipWaiting();
            })
    );
});

// 4. 激活阶段：清理旧缓存（避免缓存冗余，占用空间）
self.addEventListener("activate", (event) => {
    console.log("Service Worker 开始激活...");
    event.waitUntil(
        // 遍历所有缓存名称，删除非当前版本的缓存
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    const capp = cacheName.slice(0, cacheName.indexOf('-'))
                    // 如果缓存名称不是当前版本，删除旧缓存
                    if ((capp === APP_NAME) && (cacheName !== CACHE_NAME)) {
                        console.log(`清理旧缓存：${cacheName}`);
                        return caches.delete(cacheName);
                    } else {
                        return Promise.resolve(false)
                    }
                })
            );
        }).then(() => {
            // clients.claim()：让新激活的 Service Worker 立即控制所有打开的页面
            return self.clients.claim();
        })
    );
});

// 5. 拦截请求阶段：返回缓存资源（离线核心逻辑）
self.addEventListener("fetch", (event) => {
    console.log(`拦截到请求：${event.request.url}`);
    // respondWith：自定义请求的返回结果（替代默认的网络请求）
    event.respondWith(
        // 先从缓存中查找对应请求的资源
        caches.match(event.request)
            .then((response) => {
                // 缓存中有该资源：直接返回缓存资源（离线时就是这里生效）
                // 缓存中没有：发起网络请求，获取资源并返回
                return response || fetch(event.request)
            })
    );
});