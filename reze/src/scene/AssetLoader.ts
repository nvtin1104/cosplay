import { TextureLoader, SRGBColorSpace, LinearFilter, Texture } from "three";
export async function loadTexture(url: string): Promise<Texture> {
  const texture = await new TextureLoader().loadAsync(url);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = LinearFilter;
  return texture;
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
