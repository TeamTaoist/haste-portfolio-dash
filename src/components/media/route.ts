import { sporeConfig } from '../../utils/config.ts';
import { getSporeById, unpackToRawSporeData } from '@spore-sdk/core';
import { Buffer } from 'buffer/';

export default async function GETDOB( id: string ) {
  if (!id) {
    return new Response(null, { status: 400 });
  }
  // const cell = await getSporeById(id, sporeConfig);
  try {
    const cell = await getSporeById(id, sporeConfig)
    const spore = unpackToRawSporeData(cell.data);
    const buffer = Buffer.from(spore.content.toString().slice(2), 'hex');
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': spore.contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
