export type Category = { id: string; name: string; slug: string; parentId: string | null };
export type ProductTag = { id: string; name: string; slug: string };
export type Product = { id: string; slug: string; title: string; description?: string; testPrice: number; fesPrice: number; shootPrice: number; thumbnailUrl?: string; status: string; totalQuantity: number; location?: string; note?: string; isCombo?: boolean; images?: { url: string; alt?: string }[]; variants?: { id: string; name: string; quantity: number }[]; categories?: Category[]; tags?: ProductTag[]; comboItems?: { productId: string; quantity: number; title?: string; slug?: string; thumbnailUrl?: string }[] };
export type Post = { id: string; slug: string; title: string; excerpt?: string; content: string; type: 'ARTICLE' | 'GUIDE'; status: string; coverUrl?: string };
export type AuthUser = { id: string; email: string; name: string; role: 'ADMIN' | 'STAFF'; active: boolean };
