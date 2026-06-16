import { Box, Card, Heading } from "@radix-ui/themes";

import { Articles } from "./articles.tsx";

export const RssContainer = () => {
  return (
    <Box className="md:col-span-3">
      <Card className="min-h-75 border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md">
        <Heading mb="3" size="4" className="text-slate-300">
          Articles
        </Heading>

        <Articles />
      </Card>
    </Box>
  );
};
