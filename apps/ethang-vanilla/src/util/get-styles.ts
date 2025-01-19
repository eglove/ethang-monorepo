import typography from "@tailwindcss/typography";
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
      // @ts-expect-error don't worry about it
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
