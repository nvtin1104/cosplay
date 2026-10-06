import Image from 'next/image';
import type { Product } from '../lib/types';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

export const thumbnailTemplates = [
  { value: 'honey-rizu', label: 'Honey RIZU · bố cục poster', background: '#b25269', panel: '#803744', accent: '#f6dbe1', text: '#fffaf9', frameRadius: 'rounded-2xl', layout: 'poster' },
  { value: 'honey-sakura', label: 'Honey Sakura · bố cục lookbook', background: '#f1d8df', panel: '#a74661', accent: '#f7a9bc', text: '#542b37', frameRadius: 'rounded-3xl', layout: 'lookbook' },
  { value: 'honey-night', label: 'Honey Night · bố cục photo-first', background: '#28252e', panel: '#49303d', accent: '#d36c83', text: '#fff8f7', frameRadius: 'rounded-md', layout: 'photo-first' },
  { value: 'honey-classic', label: 'Honey Classic · bố cục editorial', background: '#e8d9cf', panel: '#62434a', accent: '#b25269', text: '#fffaf6', frameRadius: 'rounded-lg', layout: 'editorial' },
] as const;

type Template = (typeof thumbnailTemplates)[number];
type ProductThumbnailData = Partial<Product>;

function Photo({ src, alt, template, className = '' }: { src?: string; alt: string; template: Template; className?: string }) {
  return <div className={`relative min-h-0 min-w-0 overflow-hidden border-2 border-white/90 bg-white/90 ${className}`}>
    {src ? <Image src={src} alt={alt} fill sizes="(max-width:768px) 50vw, 33vw" className="object-contain p-0.5" /> : <div style={{ color: template.panel, backgroundColor: `${template.background}22` }} className="grid h-full place-items-center p-1 text-center text-[clamp(.45rem,1.5cqw,.9rem)] font-semibold">Coming Soon</div>}
  </div>;
}

function Header({ product, template, compact = false }: { product: ProductThumbnailData; template: Template; compact?: boolean }) {
  return <header className={`flex shrink-0 flex-col items-center justify-center text-center ${compact ? 'h-[9%]' : 'h-[11%]'}`}>
    <p style={{ color: template.text }} className={`display max-w-full truncate font-semibold leading-none tracking-[.04em] ${compact ? 'text-[clamp(1.15rem,4.5cqw,2.8rem)]' : 'text-[clamp(1.4rem,5.2cqw,3.5rem)]'}`}>{product.title || 'HONEY SHOP'}</p>
    <span style={{ color: template.text }} className="mt-1 text-[clamp(.45rem,1.3cqw,.8rem)] italic tracking-[.25em] opacity-90">— Honey Shop —</span>
  </header>;
}

function Prices({ product, template, direction = 'column' }: { product: ProductThumbnailData; template: Template; direction?: 'column' | 'row' }) {
  const slots = [['TEST', product.testPrice], ['FES', product.fesPrice], ['SHOOT', product.shootPrice]] as const;
  return <div className={direction === 'row' ? 'grid grid-cols-3 gap-[1.5%]' : 'flex shrink-0 flex-col gap-[1.2%]'}>
    {slots.map(([label, value]) => <div key={label} style={{ backgroundColor: template.panel, color: template.text }} className={`flex min-w-0 items-center justify-center gap-1 ${template.frameRadius} ${direction === 'row' ? 'min-h-0 px-1 py-[3%] text-center' : 'h-[2.7rem] justify-start rounded-xl px-[4%] sm:h-[3.3rem]'} text-[clamp(.58rem,2cqw,1.25rem)] leading-tight`}>
      {direction === 'column' && <span style={{ color: template.accent }} aria-hidden="true" className="text-[1.25em]">✦</span>}<span className="truncate"><b>{label}:</b> {money(Number(value) || 0)}đ</span>
    </div>)}
  </div>;
}

function SizeBadge({ product, template, floating = false }: { product: ProductThumbnailData; template: Template; floating?: boolean }) {
  const sizes = (product.variants || []).filter(variant => variant.quantity > 0 && ['S', 'M', 'L', 'XL', 'Free size'].includes(variant.name));
  if (!sizes.length) return null;
  return <span style={{ backgroundColor: template.panel, color: template.text, borderColor: template.text }} className={`${floating ? 'absolute right-[3%] top-[3%]' : ''} inline-flex items-center justify-center rounded-full border-2 px-[.55em] py-[.3em] text-center text-[clamp(.65rem,2.4cqw,1.5rem)] font-semibold leading-tight shadow-md`}>
    {sizes.map(size => size.name === 'Free size' ? 'F' : size.name).join(' · ')}
  </span>;
}

function Copy({ product, template, label = false }: { product: ProductThumbnailData; template: Template; label?: boolean }) {
  return <div style={{ backgroundColor: template.panel, color: template.text }} className={`flex min-h-0 flex-col justify-center ${template.frameRadius} px-[4%] py-[2.5%] text-center`}>
    {label && <span style={{ color: template.accent }} className="mb-1 text-[clamp(.42rem,1.2cqw,.7rem)] font-bold uppercase tracking-[.18em]">Included</span>}
    <p className="line-clamp-2 text-[clamp(.58rem,1.8cqw,1.15rem)] font-bold leading-tight">{product.note?.trim() || 'Full costume, wig & phụ kiện'}</p>
    {product.location?.trim() && <span className="mt-1 truncate text-[clamp(.48rem,1.35cqw,.82rem)] opacity-90">Đồ ở {product.location}</span>}
  </div>;
}

function Description({ product, template }: { product: ProductThumbnailData; template: Template }) {
  return <div style={{ backgroundColor: template.panel, color: template.text }} className={`${template.frameRadius} flex min-h-0 items-center justify-center px-[3%] py-[1.5%] text-center text-[clamp(.52rem,1.5cqw,.92rem)] font-semibold leading-tight`}>
    <span className="line-clamp-2">{product.description?.trim() || 'Giá thuê chưa bao gồm giặt dưỡng · Mặc đầy đủ bảo hộ'}</span>
  </div>;
}

function PosterLayout({ product, template, mainImage, gallery }: { product: ProductThumbnailData; template: Template; mainImage: string; gallery: { url: string; alt?: string }[] }) {
  return <div className="flex h-full flex-col gap-[1.2%]"><Header product={product} template={template} />
    <div className="grid min-h-0 flex-1 grid-cols-[1fr_1.03fr] gap-[2.2%]">
      <div className="flex min-h-0 flex-col gap-[1.8%]"><div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.6rem] border-2 border-white bg-white/90"><Photo src={mainImage} alt={product.title || 'Ảnh chính sản phẩm'} template={template} className="h-full w-full border-0" /><SizeBadge product={product} template={template} floating /></div>
        <div style={{ backgroundColor: template.panel, color: template.text }} className="grid h-[8%] shrink-0 place-items-center rounded-xl px-2 text-center text-[clamp(.55rem,1.7cqw,1.1rem)] font-bold">Đồ ở {product.location?.trim() || 'liên hệ shop'}</div>
      </div>
      <div className="flex min-h-0 flex-col gap-[1.7%]"><div className="flex h-[20%] shrink-0"><Copy product={product} template={template} /></div><Prices product={product} template={template} />
        <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-[2%]">{Array.from({ length: 4 }, (_, index) => <Photo key={gallery[index]?.url || `empty-${index}`} src={gallery[index]?.url} alt={gallery[index]?.alt || `${product.title || 'Sản phẩm'} ảnh phụ ${index + 1}`} template={template} />)}</div>
      </div>
    </div><div className="h-[8%] shrink-0"><Description product={product} template={template} /></div>
  </div>;
}

function LookbookLayout({ product, template, mainImage, gallery }: { product: ProductThumbnailData; template: Template; mainImage: string; gallery: { url: string; alt?: string }[] }) {
  return <div className="flex h-full flex-col gap-[1.5%] px-[1%]"><Header product={product} template={template} compact />
    <div className="relative min-h-0 flex-[1.25] overflow-hidden rounded-[1.4rem] border-4 border-white bg-white/90"><Photo src={mainImage} alt={product.title || 'Ảnh chính sản phẩm'} template={template} className="h-full w-full border-0" /><div className="absolute bottom-[3%] left-[3%]"><SizeBadge product={product} template={template} /></div></div>
    <div className="grid min-h-0 grid-cols-[1.2fr_.8fr] gap-[2%]"><Copy product={product} template={template} label /><div style={{ backgroundColor: template.panel, color: template.text }} className="flex items-center justify-center rounded-2xl px-2 text-center text-[clamp(.55rem,1.7cqw,1rem)] font-bold">{product.location?.trim() || 'Liên hệ shop'}</div></div>
    <Prices product={product} template={template} direction="row" />
    <div className="grid min-h-0 flex-[.65] grid-cols-4 gap-[1.4%]">{Array.from({ length: 4 }, (_, index) => <Photo key={gallery[index]?.url || `empty-${index}`} src={gallery[index]?.url} alt={gallery[index]?.alt || `${product.title || 'Sản phẩm'} ảnh phụ ${index + 1}`} template={template} />)}</div>
    <div className="min-h-[8%]"><Description product={product} template={template} /></div>
  </div>;
}

function PhotoFirstLayout({ product, template, mainImage, gallery }: { product: ProductThumbnailData; template: Template; mainImage: string; gallery: { url: string; alt?: string }[] }) {
  return <div className="flex h-full flex-col gap-[1.3%]"><Header product={product} template={template} compact />
    <div className="relative min-h-0 flex-[1.4] overflow-hidden border-2 border-white bg-white/90"><Photo src={mainImage} alt={product.title || 'Ảnh chính sản phẩm'} template={template} className="h-full w-full border-0" /><div className="absolute left-[2%] top-[2%]"><SizeBadge product={product} template={template} /></div></div>
    <div className="grid min-h-0 flex-[.38] grid-cols-4 gap-[1.2%]">{Array.from({ length: 4 }, (_, index) => <Photo key={gallery[index]?.url || `empty-${index}`} src={gallery[index]?.url} alt={gallery[index]?.alt || `${product.title || 'Sản phẩm'} ảnh phụ ${index + 1}`} template={template} />)}</div>
    <div className="grid min-h-0 flex-[.35] grid-cols-[1.1fr_.9fr] gap-[1.5%]"><Copy product={product} template={template} label /><div style={{ backgroundColor: template.panel, color: template.text }} className="grid place-items-center rounded-md px-2 text-center text-[clamp(.48rem,1.4cqw,.85rem)] font-bold">{product.location?.trim() || 'Liên hệ shop'}</div></div>
    <Prices product={product} template={template} direction="row" />
    <div className="min-h-[8%]"><Description product={product} template={template} /></div>
  </div>;
}

function EditorialLayout({ product, template, mainImage, gallery }: { product: ProductThumbnailData; template: Template; mainImage: string; gallery: { url: string; alt?: string }[] }) {
  return <div className="flex h-full flex-col gap-[1.3%]"><Header product={product} template={template} compact />
    <div className="grid min-h-0 flex-[1.25] grid-cols-[1.08fr_.92fr] gap-[1.5%]">
      <div className="relative min-h-0 overflow-hidden rounded-[1.5rem] border-2 border-white bg-white/90"><Photo src={mainImage} alt={product.title || 'Ảnh chính sản phẩm'} template={template} className="h-full w-full border-0" /><span className="absolute bottom-[3%] right-[3%]"><SizeBadge product={product} template={template} /></span></div>
      <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-[2%]">{Array.from({ length: 4 }, (_, index) => <Photo key={gallery[index]?.url || `empty-${index}`} src={gallery[index]?.url} alt={gallery[index]?.alt || `${product.title || 'Sản phẩm'} ảnh phụ ${index + 1}`} template={template} />)}</div>
    </div>
    <div className="grid min-h-0 flex-[.5] grid-cols-[.72fr_1.28fr] gap-[1.5%]"><div style={{ backgroundColor: template.panel, color: template.text }} className="grid place-items-center rounded-lg px-2 text-center text-[clamp(.5rem,1.5cqw,.92rem)] font-bold">Đồ ở {product.location?.trim() || 'liên hệ shop'}</div><Copy product={product} template={template} label /></div>
    <Prices product={product} template={template} direction="row" />
    <div className="min-h-[8%]"><Description product={product} template={template} /></div>
  </div>;
}

export function ProductThumbnail({ product, className = '' }: { product: ProductThumbnailData; className?: string }) {
  const mainImage = product.thumbnailUrl || '';
  if (product.useThumbnailTemplate === false) {
    return <article className="[container-type:inline-size]"><div className={`relative aspect-[5/7] overflow-hidden rounded-xl bg-neutral-100 ${className}`}>
      {mainImage ? <Image src={mainImage} alt={product.title || 'Ảnh sản phẩm'} fill sizes="(max-width:768px) 50vw, 33vw" className="object-contain" /> : <div className="grid h-full place-items-center p-4 text-center text-sm font-semibold text-neutral-500">Chưa có ảnh chính</div>}
    </div></article>;
  }
  const gallery = (product.images || []).filter(image => image.url && image.url !== mainImage).slice(0, 4);
  const template = thumbnailTemplates.find(item => item.value === product.thumbnailTemplate) || thumbnailTemplates[0];
  const props = { product, template, mainImage, gallery };

  return <article className="[container-type:inline-size]"><div style={{ backgroundColor: template.background, color: template.text }} className={`aspect-[5/7] overflow-hidden ${template.frameRadius} p-[1.7%] shadow-lg ${className}`}>
    {template.layout === 'lookbook' ? <LookbookLayout {...props} /> : template.layout === 'photo-first' ? <PhotoFirstLayout {...props} /> : template.layout === 'editorial' ? <EditorialLayout {...props} /> : <PosterLayout {...props} />}
  </div></article>;
}
