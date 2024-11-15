export type ImageAsset = {
  _id: string;
  crop: {
    bottom: number;
    left: number;
    right: number;
    top: number;
  };
  hotspot: {
    x: number;
    y: number;
  };
  metadata: {
    dimensions: {
      height: number;
      width: number;
    };
    lqip: string;
  };
  url: string;
};
