import cover from '../../public/chapter1/main.jpg';
import sonoGarden from '../../public/chapter1/main1.jpg';
import sonoSunset from '../../public/chapter1/main2.jpg';
import photo1 from '../../public/chapter1/1.jpg';
import photo2 from '../assets/chapter1/moment-02.jpg';
import photo5 from '../../public/chapter1/5.jpg';
import evening from '../../public/chapter1/IMG20260927182214.jpg';
import chapter2Main from '../../public/chapter2/main.jpg';
import chapter2Garden from '../../public/chapter2/829196369_1884724082507223_7590794627811021438_n.jpg';
import chapter2Courtyard from '../../public/chapter2/828079060_1500299401856984_7265005007830470098_n.jpg';
import chapter2Entrance from '../../public/chapter2/825278971_2385557628944886_5943826653169708356_n.jpg';
import christmasPoster from '../../public/26–27.12.2026/699215081_1422556286583452_3543809180088858328_n.jpg';
export const chapterPhotos = [
  { src: cover, alt: 'TTP Cosplay Offline — Vũng Tàu' },
  { src: sonoGarden, alt: 'Không gian SONÓ với hàng dừa và bầu trời hoàng hôn' },
  { src: sonoSunset, alt: 'SONÓ — Coffee and Lounge bên bờ biển Vũng Tàu, số 66 Hạ Long' },
  { src: photo1, alt: 'Cosplayer tại cuộc gặp đầu tiên' },
  { src: photo2, alt: 'Cosplayer tóc hồng và xanh tại Chapter 1' },
  { src: photo5, alt: 'Khoảnh khắc cosplay tại Vũng Tàu' },
  { src: evening, alt: 'Kỷ niệm ngày 27 tháng 9 tại TTP Cosplay Offline' },
];
export const chapter2Photos = [
  { src: chapter2Main, alt: 'The Bapun 3 — địa điểm TTP Cosplay Offline Long Thành' },
  { src: chapter2Garden, alt: 'Góc vườn xanh và chỗ ngồi tại The Bapun 3' },
  { src: chapter2Courtyard, alt: 'Sân vườn với đài phun nước tại The Bapun 3' },
  { src: chapter2Entrance, alt: 'Không gian The Bapun 3 vào buổi tối' },
];
export const christmasPhotos = [
  { src: christmasPoster, alt: 'Poster TAKU Festival Year-end Festival cho nhánh Dàn off Giáng sinh 26–27.12.2026' },
];
export const journey = [
  { slug: 'chapter-1', number: '01', title: 'TTP Cosplay Offline', place: 'Vũng Tàu', venue: 'SONÓ – Coffee and Lounge', address: '66 Hạ Long, Phường Vũng Tàu, TP. Hồ Chí Minh', time: '14:00 – Till Late', venueUrl: 'https://www.facebook.com/Sonocafevungtau', date: '27.09.2026', dateTime: '2026-09-27', kind: 'chapter', done: true, composition: 'trio', mainCount: 3, photos: chapterPhotos },
  { slug: 'chapter-2', number: '02', title: 'TTP Cosplay Offline – Long Thành', place: 'Long Thành', venue: 'The Bapun 3', time: '14:00 – Till Late', mapUrl: 'https://maps.app.goo.gl/QwCeGRGSwbtC9UCk8', venueUrl: 'https://www.facebook.com/profile.php?id=61577407912672', date: '18.10.2026', dateTime: '2026-10-18', kind: 'chapter', done: false, composition: 'offset', mainCount: 1, photos: chapter2Photos },
  { slug: 'chapter-3', number: '03', title: 'TTP Cosplay Offline ss3', place: 'Vũng Tàu', date: '20.12.2026', dateTime: '2026-12-20', kind: 'chapter', done: false, composition: 'steps', mainCount: 1, photos: [] },
  { slug: 'christmas-offline', number: '✳', title: 'Dàn off Giáng sinh', place: 'Một nhánh nhỏ của hành trình', date: '26–27.12.2026', dateTime: '2026-12-26', kind: 'branch', done: false, composition: 'branch', mainCount: 1, photos: christmasPhotos },
  { slug: 'chapter-4', number: '04', title: 'TTP Cosplay Offline ss4', place: 'Thành phố ngàn hoa', date: '16.01.2027', dateTime: '2027-01-16', kind: 'chapter', done: false, composition: 'film', mainCount: 1, photos: [] },
];
