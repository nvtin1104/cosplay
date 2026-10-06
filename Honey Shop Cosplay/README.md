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

Tài khoản khách dùng bảng `customer_accounts` riêng với tài khoản nhân sự. Khách chỉ đăng nhập bằng Google; hồ sơ được tạo tự động ở lần đăng nhập đầu tiên, không có đăng ký/mật khẩu riêng. Trước khi thuê, đổi điểm hoặc gửi feedback, hồ sơ cần có ít nhất một cách liên hệ: link Facebook hoặc số điện thoại; khách có thể lưu cả hai. Yêu cầu thuê lấy tên, email và điện thoại từ hồ sơ Google đã xác thực. Lịch sử cũ chỉ được đối chiếu theo email Google đã xác minh. Feedback chỉ được gửi cho sản phẩm có trong một đơn của khách ở trạng thái `RETURNED`, và mỗi đơn/sản phẩm chỉ nhận một feedback.

Để bật Google Sign-In local, tạo OAuth 2.0 Web Client trong Google Cloud Console, thêm `http://localhost:3000` vào Authorized JavaScript origins, rồi đặt cùng Client ID vào `web/.env.local` (`NEXT_PUBLIC_GOOGLE_CLIENT_ID=...`) và `api/.dev.vars` (`GOOGLE_CLIENT_ID=...`). Có file mẫu `web/.env.example` và `api/.dev.vars.example`. Khởi động lại web và API sau khi cấu hình. Nếu thiếu Client ID, nút đăng nhập sẽ thông báo chưa cấu hình; đăng nhập khách không khả dụng cho tới khi thêm Client ID hợp lệ.

Chính sách quyền riêng tư được công bố tại `/quyen-rieng-tu`. Nội dung này mô tả cách xử lý dữ liệu và chức năng đang có, không tự quyết định website thuộc hoặc không thuộc một loại hình pháp lý nào.

Điểm thành viên mặc định cộng 1 điểm cho mỗi 10.000đ tiền thuê, có thể chỉnh tỷ lệ và giá trị quy đổi tại Cài đặt site. Mỗi sản phẩm có thể đặt điểm thưởng riêng (ghi đè cách tính mặc định) và giá điểm để đổi sản phẩm. Điểm thưởng chỉ được ghi vào sổ giao dịch một lần khi đơn chuyển sang `RETURNED`; yêu cầu đổi điểm bị hủy sẽ được hoàn điểm.
