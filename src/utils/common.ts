// import { decodeContentType } from "@spore-sdk/core";

import {unpackToRawSporeData} from "@spore-sdk/core";
import {Buffer} from "buffer";

export const IMAGE_MIME_TYPE = ["image/png", "image/gif", "image/jpeg", "image/svg+xml", "image/webp", "image/avif"];

export function formatString(str: string, unit: number): string {
  if (str?.length <= (unit * 2)) {
    return str;
  }
  const start: string = str?.substring(0, unit);
  const end: string = str?.substring(str.length - unit);
  return `${start}*****${end}`;
}


export const getImg = (data:string|undefined) =>{
  if(!data)return{};
  const spore = unpackToRawSporeData(data);
  const buffer = Buffer.from(spore.content.toString().slice(2), 'hex');
  const base64 = Buffer.from(buffer as any, "binary").toString("base64");

  let type = spore.contentType;
  let textContent,image;
  if( type.indexOf("text") > -1){
    textContent =  Buffer.from(buffer as any, "binary" ).toString()
  }else{
    image = `data:${spore.contentType};base64,${base64}`;
  }

  return {
    image,
    textContent,
    type
  }
}

// export function isImageMIMEType(contentType: string | undefined | null) {
//   if (!contentType) {
//     return false;
//   }
//   const { type, subtype } = decodeContentType(contentType);
//   return IMAGE_MIME_TYPE.includes(`${type}/${subtype}` as any);
// }
