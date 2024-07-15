const Koa = require("koa")
const Router = require("koa-router")
const bodyParser = require("koa-bodyparser")
const webpush = require("web-push")
const cors = require("@koa/cors")
const schedule = require("node-schedule")

const app = new Koa()
const router = new Router()

// 替换为你生成的 VAPID 公钥和私钥
const vapidKeys = {
  publicKey:
    "BM52cAZGBfOYkvLPOfgPi6EkbeOYzG2394T7CqdOdcfQBLITNqV6q-wvLy2hQYXEfLBH5NHSm8gRh4qahem95Hc",
  privateKey: "ighxtNAAzYFl97LRyFn52cHH8x3pOjMEMyCAoDaOPRk",
}

// 设置 VAPID 详细信息
webpush.setVapidDetails(
  "mailto:wangdongovo0@gmail.com", // 替换为你的邮箱地址
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

let subscriptions = [] // 存储订阅信息的数组

// CORS 中间件配置，允许所有域名跨域访问
app.use(
  cors({
    origin: "*", // 允许所有域名跨域访问
    credentials: true, // 如果请求需要带上 cookie 或认证信息，需要设置为 true
  })
)

// 处理订阅通知的路由
router.post("/subscribe", (ctx) => {
  const subscription = ctx.request.body
  if (!isValidSubscription(subscription)) {
    ctx.status = 400
    ctx.body = "无效的订阅对象"
    return
  }
  subscriptions.push(subscription)
  ctx.status = 201
  console.log("收到订阅信息:", subscription, subscriptions)
})

// 验证订阅对象是否有效的辅助函数
function isValidSubscription(subscription) {
  return subscription && subscription.endpoint
}

// 显示欢迎信息的路由
router.get("/", (ctx) => {
  ctx.body = "欢迎来到 PWA 推送通知服务。"
})

// 定时任务，每隔 10 秒发送一次通知
schedule.scheduleJob("*/10 * * * * *", async () => {
  const timestamp = new Date().toLocaleString()
  const payload = JSON.stringify({
    title: "定时通知",
    body: `这是一个定时推送的通知，发送时间：${timestamp}`,
    url:'https://www.baidu.com/'
  })

  console.log(`开始发送定时通知：${timestamp}`)
  subscriptions.forEach((subscription) => {
    webpush
      .sendNotification(subscription, payload)
      .then(() => {
        console.log(`成功发送通知至 ${subscription.endpoint}`)
      })
      .catch((error) => {
        console.error(`发送通知时发生错误: ${error}`)
      })
  })
})

// 使用中间件
app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

// 启动服务器
app.listen(3000, () => {
  console.log("服务器已启动，监听端口 3000")
})
