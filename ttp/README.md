# TTP Cosplay Offline

Landing page tiếng Việt của Trần Tiến Phát — P / TTP. Bảy phần kể chuyện, xanh rêu/nâu gỗ/kem, minh họa Dương Liễu, HTML tĩnh hỗ trợ SEO.

Website production: [ttp-cosplay-offline.pages.dev](https://ttp-cosplay-offline.pages.dev).

## Chạy dự án

Node.js 24 LTS và npm. Các font được phục vụ từ source cục bộ, không gọi Google Fonts.

```powershell
npm ci --force
npm run dev
```

Mở URL local terminal in ra (mặc định `http://127.0.0.1:4321`).

```powershell
npm run check
npm run build
npm run verify
npm run preview
```

`dist/` chứa website tĩnh được deploy lên Cloudflare Pages. `verify` chạy sau build và kiểm tra HTML, metadata, JSON-LD, ID và anchor nội trang.

## Deploy Cloudflare Pages

Project: `ttp-cosplay-offline`, production branch: `main`, direct upload, output: `dist/`. Cấu hình nằm trong `wrangler.jsonc`. Không cần SSR adapter vì toàn bộ website là HTML tĩnh.

```powershell
npm run deploy
node scripts/verify-live.mjs
```

`deploy` tự build, kiểm tra SEO, rồi upload bằng Wrangler 4.147.0. Mặc định `SITE_URL` là `https://ttp-cosplay-offline.pages.dev`; biến môi trường hoặc `.env` có thể thay bằng custom domain thật sau. Đăng nhập Cloudflare trên máy mới bằng `npx wrangler@4.147.0 login` trước khi deploy. Credentials do Wrangler lưu ngoài dự án, không đưa vào source.

Deploy đầu tiên ngày 06.10.2026: [4bf74cd5.ttp-cosplay-offline.pages.dev](https://4bf74cd5.ttp-cosplay-offline.pages.dev). Đã kiểm tra URL production trả HTTP 200 cho trang chủ, robots, hai sitemap và ảnh chia sẻ PNG; canonical và Open Graph dùng đúng URL production.

Quy trình này dùng [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/). Chưa kết nối Git để tự deploy theo commit, chưa gắn custom domain.

Máy Windows này chặn native compiler của Astro bằng Application Control. Dự án có thêm compiler WebAssembly chính thức làm fallback; `npm ci --force` cho phép cài package WASM khai báo CPU `wasm32` trên máy x64. Không thay đổi chính sách Windows. Vite được khóa ở bản đã kiểm chứng; lockfile được lưu để tái lập cài đặt. Cảnh báo WASI experimental của Node không ảnh hưởng build.

## Cập nhật nội dung và liên kết

Sửa `src/data/content.ts`:

- `site`: title, description, Facebook, tên và tên gọi của P.
- `about`, `story`, `community`: nội dung các phần.
- `photos`: nguồn ảnh, alt, caption, position và shape.

Nội dung riêng của Hero, event và Next Chapter nằm trong component tương ứng ở `src/components/`.

`site.facebookUrl` mặc định trống. Điền URL Facebook group/fanpage thật để CTA cuối trang đổi thành “Tham gia cộng đồng”. Khi chưa có URL, CTA dẫn đến `#community`. Không dùng URL giả.

## Thay ảnh thật

Tạo thư mục `src/assets/photos/`, đặt ảnh tại đó rồi import vào `src/data/content.ts`:

```ts
import portrait from '../assets/photos/p-portrait.jpg';
// Trong mục photos có id: 'portrait':
// src: portrait,
// alt: 'Mô tả chính xác nội dung ảnh',
// position: '50% 35%',
```

Các ID: `hero`, `portrait`, `event`, `coser`, `fashion`, `award`, `dance`. Bỏ `src` để dùng minh họa chờ cập nhật. Component `Photo` dùng `astro:assets` tạo ảnh responsive; ảnh bên dưới tải lazy, hero tải eager/high. Điều chỉnh `position` để căn người/chi tiết quan trọng và caption theo ảnh thực tế. Không để ảnh thật ở `public/` nếu muốn Astro tối ưu.

Ưu tiên ảnh có P, P cùng coser, toàn cảnh event, fashion show, trao giải, random dance và giao lưu. Không tự diễn giải ảnh khi chưa nhận source. Kiểm tra chất lượng và crop ở cả ba kích thước sau khi thay.

## SEO và domain

Copy `.env.example` thành `.env`, đặt `SITE_URL` bằng domain HTTPS thật rồi build lại; hoặc đặt biến môi trường trong PowerShell/hosting:

```powershell
$env:SITE_URL = 'https://domain-cua-ban.vn'
npm run build
npm run verify
```

Domain trên chỉ minh họa cú pháp, không phải domain của TTP. Khi chưa đặt `SITE_URL`, không xuất canonical/og:url/domain giả và không tạo sitemap; robots vẫn có `Allow: /`. Khi có domain, sitemap được tạo bởi `@astrojs/sitemap`, robots trỏ đến `/sitemap-index.xml`, Person có URL website.

Metadata: title/description tiếng Việt, Open Graph và Twitter Card; JSON-LD chỉ có Person với thông tin đã được cung cấp. Chưa tạo Event schema vì thiếu địa điểm và thông tin cần thiết. `public/social.svg` là nguồn ảnh chia sẻ, `public/social.png` là bản raster tương thích mạng xã hội; favicon là SVG.

## Thiết kế

| Token | Màu |
| --- | --- |
| Xanh rêu | `#354638` |
| Olive | `#69704D` |
| Nâu gỗ | `#584334` |
| Kem | `#F2EBDD` |

Biến màu và responsive ở `src/styles/global.css`. Font: Noto Serif 400/italic và Be Vietnam Pro 400/500, subset Latin + Vietnamese, cài qua Fontsource. SVG liễu ở `Willow.astro`. Texture SVG inline nên không tải ảnh bên ngoài. Menu dùng `<details>` để hoạt động khi không JavaScript; JavaScript bổ sung đóng sau khi chọn và phím Escape. Reduced motion tắt animation và cuộn mượt.

### Chuyển động và hành trình đọc

- `src/styles/motion.css`: liễu đung đưa, ánh sáng nhẹ ở hero, tương tác hover ảnh/nút; chỉ chuyển động khi phần minh họa ở trong viewport và trang đang được xem.
- `src/scripts/journey.ts`: nội dung dịch chuyển nhẹ khi xuất hiện, header sticky đánh dấu phần hiện tại, thanh tiến độ đọc và điều hướng tuần tự bảy phần.
- Thanh hành trình có nút quay lại, phần tiếp theo và tạm dừng chuyển động. Tùy chọn tạm dừng được nhớ trong session; reduced motion của thiết bị được ưu tiên.
- Không JavaScript: mọi nội dung/anchor vẫn đọc và sử dụng được, thanh hành trình được ẩn. Nội dung không bị ẩn bằng opacity trong lúc chờ animation.
- QA đã kiểm tra flow đi đủ bảy phần, quay lại, về đầu trang, trạng thái nav, thanh tiến độ và ghi nhớ tạm dừng sau reload trên cả ba kích thước.
- Bản animation/hành trình đã deploy: [645a800d.ttp-cosplay-offline.pages.dev](https://645a800d.ttp-cosplay-offline.pages.dev). Đo lại Lighthouse: mobile Performance 98, desktop 100; Accessibility, Best Practices và SEO đều 100.

## Kiểm tra giao diện

Sau `npm run build`, chạy preview ở port 4321 rồi chạy:

```powershell
node scripts/browser-qa.mjs
```

Script dùng Chrome đã cài trên máy qua Playwright, kiểm tra 375/768/1440px, tràn ngang, menu bàn phím, không JS, reduced motion và lỗi HTTP/JavaScript. Screenshot và kết quả ở `qa/`; đồng thời xuất `public/social.png` từ SVG. Sau khi đổi SVG, chạy script rồi build lại để cập nhật ảnh chia sẻ.

### Kết quả ngày 06.10.2026

| Kiểm tra | Kết quả |
| --- | --- |
| Cài lại bằng `npm ci --force` | Thành công |
| `npm run check` | 0 lỗi, 0 cảnh báo |
| Production build + kiểm tra HTML | Đạt |
| Canonical, sitemap, robots và Person có/chưa có domain | Đạt; domain thử nghiệm không lưu vào source/bản build bàn giao |
| 375px / 768px / 1440px | Không tràn ngang; đã xem screenshot |
| Menu bàn phím, không JavaScript, reduced motion | Đạt |
| HTTP / lỗi JavaScript | Không có lỗi |
| Lighthouse mobile | Performance 98 / Accessibility 100 / Best Practices 100 / SEO 100 |
| Lighthouse desktop | Performance 100 / Accessibility 100 / Best Practices 100 / SEO 100 |
| Tối ưu ảnh Sharp sang WebP | Đạt |
| `npm audit` | 0 lỗ hổng tại thời điểm kiểm tra |

Báo cáo: `qa/lighthouse-mobile.json`, `qa/lighthouse-desktop.json`, `qa/browser-results.json`. Screenshot: `qa/landing-375.png`, `qa/landing-768.png`, `qa/landing-1440.png`. Thư mục `qa/` không đưa vào Git.

Điểm Lighthouse là đo trên production preview local với minh họa/ảnh chờ. Cần chạy lại sau khi có ảnh thật và trên domain/hosting production; xác nhận cả preview Open Graph thực tế. Nội dung hiển thị vẫn giữ nguyên độ tương phản trước khi cuộn tới; hiệu ứng chỉ dịch chuyển nhẹ.

Các đầu vào còn chờ: ảnh event/chân dung, URL Facebook và custom domain. Đã deploy Cloudflare Pages; chưa công bố ngày event tiếp theo.

## Câu chuyện gốc

Trần Tiến Phát — thường được gọi là P hoặc TTP.

P bắt đầu từ một người đơn giản chỉ thích cosplay, thích đi fes, thích chụp ảnh và gặp gỡ những người có cùng sở thích.

Nhưng càng tham gia, P càng nhận ra điều mình thích nhất không hẳn là đứng trước ống kính.

Mà là những người đứng phía sau những bức ảnh đó.

Những người từng chỉ biết nhau qua một cái tên trên Facebook.
Những coser chỉ gặp nhau vài phút ở một fes.
Những người từng nói chuyện với nhau qua một chiếc màn hình.

P muốn đưa tất cả những điều đó ra ngoài đời thật.

Và TTP Cosplay Offline bắt đầu từ ý tưởng rất đơn giản:

> “Đã có một nơi để mọi người đi fes,
> thì tại sao không có một nơi để mọi người tự tìm đến nhau?”

Từ những cuộc gặp nhỏ, những bộ ảnh và những mối quan hệ được kết nối qua cosplay, TTP dần hình thành một cộng đồng của riêng mình.

Không cần phải là người nổi tiếng.
Không cần phải có hàng nghìn follower.
Không cần phải có một bộ cosplay đắt tiền.

Chỉ cần bạn yêu thích điều này và muốn gặp những người giống mình.

TTP Cosplay Offline vì thế không chỉ là một event.

Đó là một nơi để gặp nhau.

Một nơi để những người từng xa lạ trở thành bạn bè.
Một nơi để một bộ cosplay trở thành một kỷ niệm.
Và một nơi để những khoảnh khắc vốn chỉ tồn tại trên mạng trở thành một phần của đời thật.

P không muốn chỉ là người tham gia vào những sân chơi có sẵn.

P muốn tự mình tạo ra một sân chơi.

Và 27/09/2026 chỉ là chương đầu tiên.

> “Không chỉ đi đến một nơi có cộng đồng.
> Tự mình tạo ra nơi cộng đồng gặp nhau.”
