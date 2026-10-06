-- Idempotent production catalog/content seed. This preserves rentals and customer data.
INSERT OR IGNORE INTO settings (key,value) VALUES
  ('points_currency_step','10000'),('points_per_step','1'),('points_value_vnd','1000'),('points_redemption_enabled','1');
INSERT OR IGNORE INTO users (id,email,name,role,password_hash,password_salt,active,created_at,updated_at)
VALUES ('admin-demo','admin@honeyshop.local','Honey Admin','ADMIN','pbkdf2-sha256$100000$NmfL3djdLdUtPuf9Z5SDCX7AOHwshVHmg1yQcl5Kl1E=','IFcVAFx+IfR5esXadOooDg==',1,'2026-09-19T00:00:00.000Z','2026-09-19T00:00:00.000Z');

-- Product groups and guide topics use the local product poster assets served by Web.
INSERT INTO categories (id,name,slug,parent_id,created_at,image_url,sort_order) VALUES
  ('cat-wedding','Váy cưới & concept','vay-cuoi-concept',NULL,'2026-09-28T00:00:00.000Z','/assets/production/21.png',1),
  ('cat-school','Học đường & đồng phục','hoc-duong-dong-phuc',NULL,'2026-09-28T00:00:00.000Z','/assets/production/25.png',2),
  ('cat-freestyle','Freestyle','freestyle',NULL,'2026-09-28T00:00:00.000Z','/assets/production/28.png',3),
  ('cat-character','Nhân vật anime','nhan-vat-anime',NULL,'2026-09-28T00:00:00.000Z','/assets/production/22.png',4)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,image_url=excluded.image_url,sort_order=excluded.sort_order;

INSERT INTO post_categories (id,name,slug,created_at) VALUES
  ('guide-size','Chọn size','chon-size','2026-09-28T00:00:00.000Z'),
  ('guide-booking','Đặt thuê','dat-thue','2026-09-28T00:00:00.000Z'),
  ('guide-care','Sử dụng & bảo quản','su-dung-bao-quan','2026-09-28T00:00:00.000Z'),
  ('blog-stories','Câu chuyện Honey Shop','cau-chuyen-honey-shop','2026-09-28T00:00:00.000Z')
ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug;

-- Product tags are seeded separately so the catalog can be filtered by style and character.
INSERT INTO tags (id,name,slug,created_at) VALUES
  ('tag-wedding','Váy cưới','vay-cuoi','2026-09-28T00:00:00.000Z'),
  ('tag-school','Học đường','hoc-duong','2026-09-28T00:00:00.000Z'),
  ('tag-freestyle','Freestyle','freestyle','2026-09-28T00:00:00.000Z'),
  ('tag-bunny','Bunny','bunny','2026-09-28T00:00:00.000Z'),
  ('tag-marin','Marin Kitagawa','marin-kitagawa','2026-09-28T00:00:00.000Z'),
  ('tag-zero-two','Zero Two','zero-two','2026-09-28T00:00:00.000Z'),
  ('tag-original','Original character','original-character','2026-09-28T00:00:00.000Z')
ON CONFLICT(slug) DO UPDATE SET name=excluded.name;

-- Retire only unused placeholder products from the previous seed.
DELETE FROM products
WHERE id IN ('p-gojo','p-anya','p-witch')
  AND NOT EXISTS (SELECT 1 FROM rental_items WHERE rental_items.product_id=products.id)
  AND NOT EXISTS (SELECT 1 FROM product_feedback WHERE product_feedback.product_id=products.id);

INSERT INTO products (id,slug,title,description,test_price,fes_price,shoot_price,thumbnail_url,thumbnail_template,use_thumbnail_template,status,total_quantity,note,location,is_combo,reward_points,points_price,created_at,updated_at) VALUES
  ('asset-21','vay-cuoi-all-character','Váy cưới — All Character','Trang phục concept váy cưới, theo poster local của shop; size M.',80000,190000,150000,'/assets/production/21.png','honey-rizu',0,'AVAILABLE',1,'Full set, wig và phụ kiện theo poster. Giá chưa gồm giặt dưỡng; mặc đầy đủ bảo hộ.','Hồ Chí Minh',0,0,0,'2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z'),
  ('asset-22','kaitou-kid-original','Kaitou Kid — Original','Set Kaitou Kid, poster ghi size ML và đủ costume, wig, phụ kiện.',180000,260000,260000,'/assets/production/22.png','honey-rizu',0,'AVAILABLE',1,'Size ML. Giá chưa gồm giặt dưỡng; mặc đầy đủ bảo hộ.','Hồ Chí Minh',0,0,0,'2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z'),
  ('asset-23','himmel-wedding','Himmel — Wedding','Cosplay concept cưới của Himmel, size M; poster ghi không gồm áo sơ mi.',160000,230000,230000,'/assets/production/23.png','honey-rizu',0,'AVAILABLE',1,'Size M. Không gồm áo sơ mi. Giá chưa gồm giặt dưỡng; mặc đầy đủ bảo hộ.','Hồ Chí Minh',0,0,0,'2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z'),
  ('asset-25','zero-two-school','Zero Two — School','Cosplay học đường Zero Two, poster ghi size SM.',100000,190000,170000,'/assets/production/25.png','honey-rizu',0,'AVAILABLE',1,'Size SM. Full costume, wig và phụ kiện theo poster. Giá chưa gồm giặt dưỡng; mặc đầy đủ bảo hộ.','Hồ Chí Minh',0,0,0,'2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z'),
  ('asset-27','marin-wedding','Marin — Freestyle Wedding','Concept váy cưới Marin, size M; poster liệt kê khăn voan, găng và hoa cưới.',150000,280000,240000,'/assets/production/27.png','honey-rizu',0,'AVAILABLE',1,'Size M. Hoa cưới có ghi chú phụ thu trên poster; vui lòng xác nhận khi đặt. Giá chưa gồm giặt dưỡng; mặc đầy đủ bảo hộ.','Hồ Chí Minh',0,0,0,'2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z'),
  ('asset-28','marin-freestyle-ero-m','Marin — Freestyle Ero (M)','Set freestyle Marin, size M; poster ghi full costume, wig và phụ kiện.',80000,190000,150000,'/assets/production/28.png','honey-rizu',0,'AVAILABLE',1,'Size M. Giá chưa gồm giặt dưỡng; mặc đầy đủ bảo hộ.','Hồ Chí Minh',0,0,0,'2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z'),
  ('asset-29','marin-freestyle-ero-sml','Marin — Freestyle Ero (S/M/L)','Set freestyle Marin, poster ghi các size S, M, L.',80000,190000,150000,'/assets/production/29.png','honey-rizu',0,'AVAILABLE',1,'Các size được ghi trên poster: S/M/L. Giá chưa gồm giặt dưỡng; mặc đầy đủ bảo hộ.','Hồ Chí Minh',0,0,0,'2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z'),
  ('asset-30','marin-uniform','Marin — Uniform','Cosplay đồng phục Marin, poster ghi size M.',90000,250000,200000,'/assets/production/30.png','honey-rizu',0,'AVAILABLE',1,'Size M. Full costume, wig và phụ kiện theo poster. Giá chưa gồm giặt dưỡng; mặc đầy đủ bảo hộ.','Hồ Chí Minh',0,0,0,'2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z'),
  ('asset-31','marin-police','Marin — Freestyle Police','Cosplay cảnh sát Marin, poster ghi size freesize khoảng 70.',90000,180000,120000,'/assets/production/31.png','honey-rizu',0,'AVAILABLE',1,'Freesize khoảng 70 theo poster; có phụ kiện súng và bộ đàm. Giá chưa gồm giặt dưỡng; mặc đầy đủ bảo hộ.','Hồ Chí Minh',0,0,0,'2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z'),
  ('asset-32','marin-bunny','Marin — Freestyle Bunny','Set bunny Marin, poster ghi size S, M, L.',90000,250000,200000,'/assets/production/32.png','honey-rizu',0,'AVAILABLE',1,'Các size được ghi trên poster: S/M/L. Giá chưa gồm giặt dưỡng; mặc đầy đủ bảo hộ.','Hồ Chí Minh',0,0,0,'2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z'),
  ('asset-33','shizuku-tan-original','Shizuku Tan — Original','Cosplay Shizuku Tan, poster ghi size M.',90000,250000,200000,'/assets/production/33.png','honey-rizu',0,'AVAILABLE',1,'Size M. Giá chưa gồm giặt dưỡng; mặc đầy đủ bảo hộ.','Hồ Chí Minh',0,0,0,'2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z'),
  ('asset-34','rizu-original','Rizu — Original','Cosplay Rizu, poster ghi các size S, M, L.',90000,250000,200000,'/assets/production/34.png','honey-rizu',0,'AVAILABLE',1,'Các size được ghi trên poster: S/M/L. Giá chưa gồm giặt dưỡng; mặc đầy đủ bảo hộ.','Hồ Chí Minh',0,0,0,'2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z')
ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,title=excluded.title,description=excluded.description,test_price=excluded.test_price,fes_price=excluded.fes_price,shoot_price=excluded.shoot_price,thumbnail_url=excluded.thumbnail_url,thumbnail_template=excluded.thumbnail_template,use_thumbnail_template=excluded.use_thumbnail_template,status=excluded.status,total_quantity=excluded.total_quantity,note=excluded.note,location=excluded.location,is_combo=excluded.is_combo,updated_at=excluded.updated_at;

INSERT INTO product_categories (product_id,category_id) VALUES
  ('asset-21','cat-wedding'),('asset-23','cat-wedding'),('asset-27','cat-wedding'),
  ('asset-25','cat-school'),('asset-30','cat-school'),
  ('asset-28','cat-freestyle'),('asset-29','cat-freestyle'),('asset-31','cat-freestyle'),('asset-32','cat-freestyle'),
  ('asset-22','cat-character'),('asset-33','cat-character'),('asset-34','cat-character')
ON CONFLICT(product_id,category_id) DO NOTHING;

WITH mapping(product_id,slug) AS (VALUES
  ('asset-21','vay-cuoi'),('asset-23','vay-cuoi'),('asset-27','vay-cuoi'),
  ('asset-25','hoc-duong'),('asset-30','hoc-duong'),('asset-25','zero-two'),
  ('asset-27','marin-kitagawa'),('asset-28','marin-kitagawa'),('asset-29','marin-kitagawa'),('asset-30','marin-kitagawa'),('asset-31','marin-kitagawa'),('asset-32','marin-kitagawa'),
  ('asset-28','freestyle'),('asset-29','freestyle'),('asset-31','freestyle'),('asset-32','freestyle'),
  ('asset-32','bunny'),('asset-22','original-character'),('asset-33','original-character'),('asset-34','original-character')
)
INSERT INTO product_tags (product_id,tag_id)
SELECT mapping.product_id,tags.id FROM mapping JOIN tags ON tags.slug=mapping.slug
ON CONFLICT(product_id,tag_id) DO NOTHING;

INSERT INTO product_images (id,product_id,url,alt,kind) VALUES
  ('asset-image-21','asset-21','/assets/production/21.png','Váy cưới All Character','gallery'),
  ('asset-image-22','asset-22','/assets/production/22.png','Kaitou Kid Original','gallery'),
  ('asset-image-23','asset-23','/assets/production/23.png','Himmel Wedding','gallery'),
  ('asset-image-25','asset-25','/assets/production/25.png','Zero Two School','gallery'),
  ('asset-image-27','asset-27','/assets/production/27.png','Marin Freestyle Wedding','gallery'),
  ('asset-image-28','asset-28','/assets/production/28.png','Marin Freestyle Ero size M','gallery'),
  ('asset-image-29','asset-29','/assets/production/29.png','Marin Freestyle Ero size S M L','gallery'),
  ('asset-image-30','asset-30','/assets/production/30.png','Marin Uniform','gallery'),
  ('asset-image-31','asset-31','/assets/production/31.png','Marin Freestyle Police','gallery'),
  ('asset-image-32','asset-32','/assets/production/32.png','Marin Freestyle Bunny','gallery'),
  ('asset-image-33','asset-33','/assets/production/33.png','Shizuku Tan Original','gallery'),
  ('asset-image-34','asset-34','/assets/production/34.png','Rizu Original','gallery'),
  ('asset-photo-bunny','asset-32','/assets/Fb.jpg','Ảnh cosplay bunny tại shop','gallery'),
  ('asset-photo-zerotwo-1','asset-25','/assets/Fb(1).jpg','Ảnh cosplay Zero Two','gallery'),
  ('asset-photo-zerotwo-2','asset-25','/assets/Fb(2).jpg','Ảnh cosplay Zero Two tại fes','gallery'),
  ('asset-photo-bunny-costume','asset-32','/assets/Fb(8).jpg','Ảnh bộ bunny đen tại shop','gallery'),
  ('asset-photo-marin-wedding','asset-27','/assets/Fb(12).jpg','Ảnh concept váy cưới tóc hồng','gallery'),
  ('asset-photo-wedding-blue','asset-21','/assets/Fb(13).jpg','Ảnh concept váy cưới tóc xanh','gallery')
ON CONFLICT(id) DO UPDATE SET product_id=excluded.product_id,url=excluded.url,alt=excluded.alt,kind=excluded.kind;

INSERT INTO product_variants (id,product_id,name,quantity,attributes) VALUES
  ('asset-variant-21','asset-21','M',1,'{}'),('asset-variant-22','asset-22','ML',1,'{}'),('asset-variant-23','asset-23','M',1,'{}'),
  ('asset-variant-25','asset-25','SM',1,'{}'),('asset-variant-27','asset-27','M',1,'{}'),('asset-variant-28','asset-28','M',1,'{}'),
  ('asset-variant-29','asset-29','S/M/L',1,'{}'),('asset-variant-30','asset-30','M',1,'{}'),('asset-variant-31','asset-31','Freesize ~70',1,'{}'),
  ('asset-variant-32','asset-32','S/M/L',1,'{}'),('asset-variant-33','asset-33','M',1,'{}'),('asset-variant-34','asset-34','S/M/L',1,'{}')
ON CONFLICT(id) DO UPDATE SET product_id=excluded.product_id,name=excluded.name,quantity=excluded.quantity,attributes=excluded.attributes;

INSERT INTO posts (id,slug,title,excerpt,content,cover_url,type,status,seo_title,seo_description,published_at,created_at,updated_at,category_id,sort_index) VALUES
  ('post-size','cach-chon-size-do-cosplay','Cách chọn size đồ cosplay','Đối chiếu số đo cơ thể với size ghi trên poster để chọn trang phục vừa vặn.','<p>Size trên poster là thông tin tham khảo cho từng sản phẩm. Trong bộ ảnh hiện có, shop ghi các size M, ML, SM, S/M/L và freesize khoảng 70.</p><h2>Trước khi đặt</h2><ol><li>Dùng thước dây đo vòng ngực, vòng eo và vòng mông tại vị trí lớn nhất.</li><li>Ghi chiều cao và cân nặng để shop tư vấn thêm khi cần.</li><li>Mở poster của sản phẩm muốn thuê, đối chiếu size ghi trên ảnh với số đo của bạn.</li><li>Nếu nằm giữa hai size hoặc cần xác nhận freesize, gửi số đo cho shop trước khi chốt lịch.</li></ol><p>Mỗi mẫu có thông số khác nhau; đừng chọn chỉ dựa vào size thường dùng của mình.</p>','/assets/production/21.png','GUIDE','PUBLISHED','Cách chọn size đồ cosplay','Cách đọc size và chuẩn bị số đo trước khi thuê cosplay.','2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z','guide-size',1),
  ('guide-pricing','doc-gia-test-fes-shoot','Cách đọc giá TEST, FES và SHOOT','Mỗi poster có ba mức giá; chọn mức phù hợp với lịch sử dụng và hỏi shop nếu cần làm rõ.','<p>Poster sản phẩm hiển thị giá theo ba mục TEST, FES và SHOOT. Hãy đối chiếu đúng dòng giá của sản phẩm trước khi gửi yêu cầu thuê.</p><h2>Lưu ý về giá</h2><ul><li>Giá trên các poster được nhập vào hệ thống theo đơn vị đồng Việt Nam.</li><li>Poster ghi giá thuê chưa bao gồm giặt dưỡng.</li><li>Poster cũng nhắc khách mặc đầy đủ đồ bảo hộ khi sử dụng trang phục.</li><li>Nếu chưa rõ gói nào phù hợp với lịch của mình, gửi ngày thuê và mục đích sử dụng để shop xác nhận.</li></ul><p>Giá cuối cùng và tình trạng còn đồ sẽ được shop xác nhận khi tiếp nhận yêu cầu.</p>','/assets/production/30.png','GUIDE','PUBLISHED','Cách đọc giá thuê cosplay','Giải thích ba mức giá hiển thị trên poster sản phẩm Honey Shop.','2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z','guide-booking',2),
  ('guide-booking','cach-dat-thue-cosplay','Cách gửi yêu cầu thuê trang phục','Chọn mẫu, size và thời gian dự kiến rồi gửi thông tin liên hệ để shop xác nhận.','<p>Bạn có thể gửi yêu cầu thuê ngay từ trang sản phẩm mà không cần đăng nhập.</p><ol><li>Chọn mẫu cosplay và xem poster để kiểm tra size, phụ kiện và giá.</li><li>Chọn ngày bắt đầu, ngày kết thúc và size muốn thuê.</li><li>Điền tên, số điện thoại hoặc email để shop liên hệ.</li><li>Gửi yêu cầu và chờ shop xác nhận tình trạng sản phẩm cùng chi tiết lịch thuê.</li></ol><p>Honey sẽ liên hệ theo thông tin bạn cung cấp để xác nhận yêu cầu và lịch thuê.</p>','/assets/production/22.png','GUIDE','PUBLISHED','Cách đặt thuê cosplay','Các bước gửi yêu cầu thuê trang phục cosplay từ website.','2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z','guide-booking',3),
  ('guide-care','luu-y-su-dung-va-bao-quan-cosplay','Lưu ý khi sử dụng và bảo quản đồ cosplay','Một vài bước đơn giản giúp giữ trang phục và phụ kiện gọn gàng trong buổi thuê.','<p>Để trang phục và phụ kiện được giữ nguyên trạng trong thời gian sử dụng:</p><ul><li>Mặc đầy đủ lớp bảo hộ như lưu ý trên poster sản phẩm.</li><li>Giữ wig, phụ kiện và chi tiết nhỏ trong túi riêng khi không dùng.</li><li>Tránh để trang phục ẩm hoặc dính mỹ phẩm trực tiếp; không tự giặt hay dùng chất tẩy nếu chưa hỏi shop.</li><li>Nếu có sự cố hoặc phụ kiện bị thất lạc, liên hệ shop sớm để được hướng dẫn.</li></ul><p>Hãy hỏi shop về cách xử lý riêng cho chất liệu hoặc phụ kiện đặc biệt của mẫu bạn thuê.</p>','/assets/production/23.png','GUIDE','PUBLISHED','Bảo quản đồ cosplay khi thuê','Lưu ý cơ bản về bảo hộ, phụ kiện và chăm sóc đồ cosplay thuê.','2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z','guide-care',4)
ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,title=excluded.title,excerpt=excluded.excerpt,content=excluded.content,cover_url=excluded.cover_url,type=excluded.type,status=excluded.status,seo_title=excluded.seo_title,seo_description=excluded.seo_description,published_at=excluded.published_at,updated_at=excluded.updated_at,category_id=excluded.category_id,sort_index=excluded.sort_index;

INSERT INTO posts (id,slug,title,excerpt,content,cover_url,type,status,seo_title,seo_description,published_at,created_at,updated_at,category_id,sort_index)
VALUES ('post-fes','honey-shop-chuan-bi-cosplay-di-fes','Chọn cosplay cho buổi đi fes','Tham khảo các mẫu cosplay và lưu ý về size, giá trên poster trước khi lên lịch.','<p>Từ váy cưới đến đồng phục học đường, các poster sản phẩm của Honey Shop ghi rõ mức giá TEST, FES, SHOOT và size tham khảo.</p><p>Hãy chọn mẫu phù hợp concept, kiểm tra phụ kiện đi kèm và gửi lịch dự kiến để shop xác nhận sản phẩm còn trống.</p>','/assets/production/25.png','ARTICLE','PUBLISHED','Cosplay đi fes cùng Honey Shop','Gợi ý chọn mẫu cosplay và chuẩn bị lịch thuê đi fes.','2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z','2026-09-28T00:00:00.000Z','blog-stories',0)
ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,title=excluded.title,excerpt=excluded.excerpt,content=excluded.content,cover_url=excluded.cover_url,type=excluded.type,status=excluded.status,seo_title=excluded.seo_title,seo_description=excluded.seo_description,published_at=excluded.published_at,updated_at=excluded.updated_at,category_id=excluded.category_id;
