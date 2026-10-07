import chapter1Poster from '../assets/moments/chapter1-poster.jpg';
import chapter1Stage from '../assets/moments/chapter1-stage.jpg';
import chapter1CoserPink from '../assets/moments/chapter1-coser-pink.jpg';
import chapter1Group from '../assets/moments/chapter1-group.jpg';
import communityPhoto1 from '../assets/moments/community-01.jpg';
import communityPhoto2 from '../assets/moments/community-02.jpg';

export const site = {
  title: 'TTP Cosplay Offline | Trần Tiến Phát',
  description: 'TTP Cosplay Offline — câu chuyện của Trần Tiến Phát (Phát), nơi những người yêu cosplay gặp nhau, kết nối và tạo nên kỷ niệm ngoài đời thật.',
  facebookUrl: '',
  person: { name: 'Trần Tiến Phát', alternateName: ['Phát', 'TTP'] },
};

export const about = [
  'Phát bắt đầu từ một người đơn giản chỉ thích cosplay, thích đi fes, thích chụp ảnh và gặp gỡ những người có cùng sở thích.',
  'Nhưng càng tham gia, Phát càng nhận ra điều mình thích nhất không hẳn là đứng trước ống kính. Mà là những người đứng phía sau những bức ảnh đó.',
];

export const story = [
  { title: 'Từ một chiếc màn hình', text: 'Những người từng chỉ biết nhau qua một cái tên trên Facebook. Những coser chỉ gặp nhau vài phút ở một fes. Những người từng nói chuyện với nhau qua một chiếc màn hình.' },
  { title: 'Đến một cuộc gặp thật', text: 'Phát muốn đưa tất cả những điều đó ra ngoài đời thật. Từ những cuộc gặp nhỏ, những bộ ảnh và những mối quan hệ được kết nối qua cosplay, TTP dần hình thành một cộng đồng của riêng mình.' },
  { title: 'Và một sân chơi của riêng mình', text: 'Phát không muốn chỉ là người tham gia vào những sân chơi có sẵn. Phát muốn tự mình tạo ra một sân chơi. Một nơi để những người từng xa lạ trở thành bạn bè, và một bộ cosplay trở thành một kỷ niệm.' },
];

export const moments = [
  { src: communityPhoto1, alt: 'Cộng đồng cosplayer tại sự kiện', caption: 'Một nơi để gặp nhau' },
  { src: chapter1Stage, alt: 'Cosplayer tạo dáng tại sân khấu TTP Cosplay Offline', caption: 'Nhân vật bước ra đời thật' },
  { src: chapter1CoserPink, alt: 'Cosplayer tóc hồng giao lưu tại sự kiện', caption: 'Những người cùng một tình yêu' },
  { src: communityPhoto2, alt: 'Các cosplayer cùng tạo dáng tại sự kiện', caption: 'Những gương mặt thân quen' },
  { src: chapter1Poster, alt: 'Poster TTP Cosplay Offline với hình ảnh bờ biển Vũng Tàu', caption: 'TTP Cosplay Offline' },
  { src: chapter1Group, alt: 'Các cosplayer chụp ảnh nhóm tại sự kiện SONO × TTP Cosplay Offline', caption: 'Cùng nhau tại SONO × TTP Cosplay Offline' },
];

export const heroPhotos = [moments[0], moments[3]];

export const chapter1 = {
  slug: 'chapter-1',
  title: 'Chương đầu tiên',
  date: '27.09.2026',
  dateTime: '2026-09-27',
  summary: 'Từ một ý tưởng đến một cuộc gặp. TTP Cosplay Offline — nơi những khoảnh khắc vốn chỉ tồn tại trên mạng trở thành một phần của đời thật.',
  moments: [
    { src: chapter1Poster, alt: 'Poster TTP Cosplay Offline với hình ảnh bờ biển Vũng Tàu', caption: 'TTP Cosplay Offline' },
    { src: chapter1Stage, alt: 'Cosplayer tạo dáng tại sân khấu TTP Cosplay Offline', caption: 'Nhân vật bước ra đời thật' },
    { src: chapter1CoserPink, alt: 'Cosplayer tóc hồng giao lưu tại sự kiện', caption: 'Những người cùng một tình yêu' },
    { src: chapter1Group, alt: 'Các cosplayer chụp ảnh nhóm tại sự kiện SONO × TTP Cosplay Offline', caption: 'Cùng nhau tại SONO × TTP Cosplay Offline' },
  ],
};

export const community = [
  'Không cần phải là người nổi tiếng.',
  'Không cần phải có hàng nghìn follower.',
  'Không cần phải có một bộ cosplay đắt tiền.',
];
