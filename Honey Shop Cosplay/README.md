# Honey Shop Cosplay

Monorepo MVP cho shop cho thuê đồ cosplay:

- `web`: Next.js storefront + admin dashboard tại `http://localhost:3000`
- `api`: Cloudflare Worker + Hono tại `http://localhost:8787/api/v1`
- Cloudflare D1 + Drizzle ORM cho dữ liệu nghiệp vụ
- Cloudflare R2/Images sẵn binding để mở rộng lưu media

## Chạy local

```bash
pnpm install
pnpm dev:all
# Hoặc: pnpm start
```

*(Lệnh `dev:all` chạy migration và bật API cùng Web; không ghi đè dữ liệu đã nhập. Chỉ chạy `pnpm db:seed:local` khi chủ động muốn nạp lại dữ liệu demo.)*


Web public: `http://localhost:3000`  
Admin demo: `http://localhost:3000/admin`  
API health: `http://localhost:8787/api/v1/health`

## Deploy Cloudflare

```bash
pnpm --filter honey-shop-api exec wrangler login
pnpm --filter honey-shop-api db:migrate:remote
pnpm deploy:api
pnpm deploy:web
```

Cấu hình tài khoản Cloudflare và `NEXT_PUBLIC_SITE_URL` theo domain web thực tế; cập nhật `API_ORIGIN`, `CORS_ORIGIN` và `APP_URL` nếu không dùng các URL workers.dev mặc định. Web được deploy bằng Vinext Worker để render nội dung D1 theo yêu cầu. Seed demo không chạy khi khởi động hoặc deploy. Local D1 được Wrangler lưu riêng, không ảnh hưởng database production.
