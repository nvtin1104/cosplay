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

### Tài khoản khách và Google Sign-In

Tài khoản khách dùng bảng `customer_accounts` riêng với tài khoản nhân sự. Khách có thể đăng ký bằng email/mật khẩu, lưu link Facebook, gửi yêu cầu thuê từ trang sản phẩm và xem lịch sử thuê theo email. Mỗi yêu cầu mới gắn với email khách nhập; để yêu cầu cũ hiện trong tài khoản, email phải trùng khớp.

Để bật Google Sign-In, tạo OAuth 2.0 Web Client trong Google Cloud Console và khai báo domain web trong Authorized JavaScript origins. Đặt cùng Client ID ở biến build web `NEXT_PUBLIC_GOOGLE_CLIENT_ID` và biến Worker API `GOOGLE_CLIENT_ID`. Nếu không cấu hình Client ID, đăng ký và đăng nhập bằng email vẫn hoạt động.

Điểm thành viên mặc định cộng 1 điểm cho mỗi 10.000đ tiền thuê, có thể chỉnh tỷ lệ và giá trị quy đổi tại Cài đặt site. Mỗi sản phẩm có thể đặt điểm thưởng riêng (ghi đè cách tính mặc định) và giá điểm để đổi sản phẩm. Điểm thưởng chỉ được ghi vào sổ giao dịch một lần khi đơn chuyển sang `RETURNED`; yêu cầu đổi điểm bị hủy sẽ được hoàn điểm.
