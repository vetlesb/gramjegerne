import type {ImageAsset} from '@/types';
import imageUrlBuilder from '@sanity/image-url';
import {client} from './client';

const builder = imageUrlBuilder(client);

export function urlFor(source: ImageAsset) {
  return source.url || builder.image(source._ref).url();
}
