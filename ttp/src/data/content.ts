import type { ImageMetadata } from 'astro';

export type Photo = {
  id: string;
  src?: ImageMetadata;
  alt: string;
  caption: string;
  position: string;
  shape: 'landscape' | 'portrait';
};

export const site = {
  title: 'TTP Cosplay Offline | Trần Tiến Phát',
  description: 'TTP Cosplay Offline — câu chuyện của Trần Tiến Phát (P), nơi những người yêu cosplay gặp nhau, kết nối và tạo nên kỷ niệm ngoài đời thật.',
  facebookUrl: '',
  person: { name: 'Trần Tiến Phát', alternateName: ['P', 'TTP'] },
};

export const about = [
  'P bắt đầu từ một người đơn giản chỉ thích cosplay, thích đi fes, thích chụp ảnh và gặp gỡ những người có cùng sở thích.',
  'Nhưng càng tham gia, P càng nhận ra điều mình thích nhất không hẳn là đứng trước ống kính. Mà là những người đứng phía sau những bức ảnh đó.',
];

export const story = [
  { title: 'Từ một chiếc màn hình', text: 'Những người từng chỉ biết nhau qua một cái tên trên Facebook. Những coser chỉ gặp nhau vài phút ở một fes. Những người từng nói chuyện với nhau qua một chiếc màn hình.' },
  { title: 'Đến một cuộc gặp thật', text: 'P muốn đưa tất cả những điều đó ra ngoài đời thật. Từ những cuộc gặp nhỏ, những bộ ảnh và những mối quan hệ được kết nối qua cosplay, TTP dần hình thành một cộng đồng của riêng mình.' },
  { title: 'Và một sân chơi của riêng mình', text: 'P không muốn chỉ là người tham gia vào những sân chơi có sẵn. P muốn tự mình tạo ra một sân chơi. Một nơi để những người từng xa lạ trở thành bạn bè, và một bộ cosplay trở thành một kỷ niệm.' },
];

export const photos: Photo[] = [
  { id: 'hero', alt: 'P cùng cộng đồng tại TTP Cosplay Offline', caption: 'Một nơi để gặp nhau', position: 'center', shape: 'landscape' },
  { id: 'portrait', alt: 'Chân dung Trần Tiến Phát — P', caption: 'P / Trần Tiến Phát', position: '50% 35%', shape: 'portrait' },
  { id: 'event', alt: 'Toàn cảnh TTP Cosplay Offline ngày 27 tháng 9 năm 2026', caption: '27.09.2026 — Chương đầu tiên', position: 'center', shape: 'landscape' },
  { id: 'coser', alt: 'P gặp gỡ các coser tại event', caption: '01 / Những người cùng một tình yêu', position: 'center', shape: 'portrait' },
  { id: 'fashion', alt: 'Khoảnh khắc fashion show tại event', caption: '02 / Khi nhân vật bước ra đời thật', position: 'center', shape: 'landscape' },
  { id: 'award', alt: 'Khoảnh khắc trao giải tại event', caption: '03 / Những điều đáng nhớ', position: 'center', shape: 'landscape' },
  { id: 'dance', alt: 'Random dance và giao lưu tại event', caption: '04 / Cùng nhau, trong một nhịp', position: 'center', shape: 'portrait' },
];

export const community = [
  'Không cần phải là người nổi tiếng.',
  'Không cần phải có hàng nghìn follower.',
  'Không cần phải có một bộ cosplay đắt tiền.',
];
