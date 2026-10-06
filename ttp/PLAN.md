# Landing page TTP Cosplay Offline

## Kế hoạch đã chốt

Landing page tiếng Việt dùng Astro + TypeScript, xuất HTML tĩnh tại `D:\project\cosplay\ttp`. Giai đoạn đầu làm source local. Theo yêu cầu tiếp theo ngày 06.10.2026, đã deploy lên Cloudflare Pages. Tập trung câu chuyện của Trần Tiến Phát (P / TTP), cộng đồng cosplay và event ngày 27.09.2026.

### Thiết kế

- Xanh rêu `#354638`, olive `#69704D`, nâu gỗ `#584334`, kem `#F2EBDD`.
- Vibe nghệ thuật, tự nhiên, cinematic, Japanese aesthetic nhẹ; ảnh lớn, nhiều khoảng thở, hạn chế card.
- Noto Serif cho tiêu đề/trích dẫn; Be Vietnam Pro cho nội dung, font cục bộ hỗ trợ tiếng Việt.
- Cành liễu SVG, texture giấy/grain nhẹ, bố cục bất đối xứng.
- Header có điều hướng nội trang, menu mobile dùng bàn phím được. Animation nhẹ, hỗ trợ reduced motion và không JavaScript.

### Bảy phần

1. Hero: TTP Cosplay Offline / Một nơi để gặp nhau / Khám phá câu chuyện.
2. About P: Trần Tiến Phát, sở thích cosplay và những người phía sau bức ảnh.
3. Story: từ kết nối qua màn hình đến cuộc gặp thật và sân chơi của riêng mình.
4. 27.09.2026: Chương đầu tiên; ảnh toàn cảnh, fashion show, trao giải, random dance và giao lưu.
5. Gallery: ảnh lớn xen kẽ tỷ lệ dọc/ngang, có caption; chưa có lightbox/bộ lọc.
6. Community: cộng đồng chào đón mọi người, không yêu cầu danh tiếng/follower/cosplay đắt tiền.
7. Next Chapter: câu chuyện vẫn tiếp tục, kết nối Facebook khi có URL.

Biên tập nội dung để đọc mượt, giữ giọng P và trích dẫn chủ đạo. Lưu câu chuyện gốc trong README. Không tự thêm thống kê, địa điểm, đối tác, lời chứng thực hoặc lịch mới.

### Triển khai và SEO

- CSS thuần, component Astro theo phần; dữ liệu TypeScript tách nội dung, thông tin P, Facebook và ảnh.
- Ảnh có nguồn, alt, caption, điểm căn ảnh; khung minh họa ghi rõ đang chờ cập nhật, không dùng ảnh event khác.
- Ảnh thật qua `astro:assets`, responsive, kích thước cố định; lazy dưới fold, hero tải ưu tiên.
- Chưa có Facebook: CTA về Community; có URL: “Tham gia cộng đồng”.
- Nội dung trong HTML tĩnh, `lang=vi`, một H1, heading theo cấp, title/description, Open Graph/Twitter, favicon và Person JSON-LD.
- `SITE_URL` là cấu hình domain production; chỉ tạo canonical tuyệt đối, sitemap chính thức Astro và sitemap trong robots khi có domain.
- SVG thương hiệu dùng làm nguồn ảnh chia sẻ; PNG xuất từ SVG để nền tảng mạng xã hội có thể hiển thị.
- Không backend, CMS, tài khoản, form hoặc Event schema khi chưa đủ thông tin.

## Checklist triển khai

- [x] Khởi tạo Astro + TypeScript, font cục bộ, CSS và component.
- [x] Bảy phần với nội dung đã biên tập, minh họa liễu và ảnh chờ.
- [x] Cấu hình ảnh/Facebook và SEO theo domain.
- [x] PLAN và README, nội dung gốc, hướng dẫn cập nhật.
- [x] TypeScript không lỗi và build HTML tĩnh.
- [x] Kiểm tra metadata/JSON-LD/anchors và cấu hình domain.
- [x] QA 375px / 768px / 1440px, menu bàn phím, không JS, reduced motion.
- [x] Lighthouse production preview, mục tiêu Accessibility và SEO ≥95.
- [x] Deploy Cloudflare Pages: https://ttp-cosplay-offline.pages.dev.
- [x] Kiểm tra HTTP production, canonical, Open Graph, robots, sitemap và ảnh chia sẻ.
- [x] Bổ sung chuyển động nhẹ, header sticky/active, tiến độ đọc và điều hướng hành trình bảy phần theo yêu cầu tiếp theo.
- [x] Kiểm tra flow tiếp/quay lại/về đầu, tạm dừng chuyển động và reduced motion trên desktop/mobile.

## Chờ cập nhật

- [ ] Ảnh chân dung P và event thật; xác nhận caption, alt, crop, quyền sử dụng.
- [ ] URL Facebook group/fanpage.
- [x] Hosting production và `SITE_URL` với domain Cloudflare Pages.
- [ ] Custom domain nếu cần.
- [ ] Chạy lại QA, hiệu năng và kiểm tra preview chia sẻ sau khi thay ảnh/domain.

## Kiểm chứng

Kết quả cuối cùng được ghi trong README. Screenshot và báo cáo kiểm tra local nằm ở `qa/` (gitignored).
