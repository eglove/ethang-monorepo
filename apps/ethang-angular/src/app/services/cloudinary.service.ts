import { Injectable } from "@angular/core";
// eslint-disable-next-line barrel/avoid-importing-barrel-files
import { Cloudinary } from "@cloudinary/url-gen";

@Injectable({
  providedIn: "root",
})
export class CloudinaryService {
  private readonly cloudinary: Cloudinary;

  public constructor() {
    this.cloudinary = new Cloudinary({
      cloud: {
        // eslint-disable-next-line cspell/spellchecker
        cloudName: "dggd1wkoy",
      },
    });
  }

  public getImage(publicId: string) {
    return this.cloudinary.image(publicId);
  }
}
