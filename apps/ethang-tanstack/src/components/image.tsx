import { cn } from "@/lib/utils.ts";

type ImageProperties = {
  alt: string;
  className?: string;
  src: string;
};

export const Image = ({
  alt, className, src,
}: Readonly<ImageProperties>) => {
  return (
    <img
      alt={alt}
      className={cn("mx-auto mt-6", className)}
      src={src}
    />
  );
};
