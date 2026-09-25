# Honey Shop Cosplay

Monorepo MVP cho shop cho thuê đồ cosplay:

- `web`: Next.js storefront + admin dashboard tại `http://localhost:3000`
- `api`: Cloudflare Worker + Hono tại `http://localhost:8787/api/v1`
- Cloudflare D1 + Drizzle ORM cho dữ liệu nghiệp vụ
- Cloudflare R2/Images sẵn binding để mở rộng lưu media

## Chạy local

```bash
npm install
npm run dev:all
# Hoặc: npm start
```

*(Lệnh `dev:all` sẽ tự động chạy migrate DB, seed dữ liệu mẫu và bật đồng thời cả API lẫn Web)*


Web public: `http://localhost:3000`  
Admin demo: `http://localhost:3000/admin`  
API health: `http://localhost:8787/api/v1/health`

## Deploy Cloudflare

```bash
npx wrangler login
npx wrangler d1 create honey-shop-db
```

Thay `database_id` trong `api/wrangler.toml` bằng ID Cloudflare trả về, sau đó:

```bash
npm run db:migrate:remote
npm run db:seed:remote --workspace api
npm run deploy:api
```

API production chạy trên `*.workers.dev` hoặc custom domain. Local D1 được Wrangler lưu riêng, không ảnh hưởng database production. PostgreSQL/Docker và Prisma không còn là runtime của API Worker.
