import typography from "@tailwindcss/typography";
// @ts-expect-error no types
import daisyui from "daisyui";
import postcss from "postcss";
import tailwindcss from "tailwindcss";

export const getStyles = async () => {
  const processor = postcss([
    tailwindcss({
      content: ["./src/**/*.html"],
      daisyui: {
        themes: ["night"],
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      plugins: [daisyui, typography],
      theme: {
        extend: {},
      },
    }),
  ]);

  const styles = await processor.process(`@tailwind base;
    @tailwind components;
    @tailwind utilities;
`);

  return styles.css;
};
