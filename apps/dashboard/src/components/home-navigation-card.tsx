import { Card, CardBody, CardHeader, Link } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";

type HomeNavigationCardProperties = {
  description: string;
  href: string;
  queryKey: unknown[];
  title: string;
};

export const HomeNavigationCard = ({
  description,
  href,
  queryKey,
  title,
}: Readonly<HomeNavigationCardProperties>) => {
  const queryClient = useQueryClient();

  return (
    <Link
      onMouseEnter={() => {
        queryClient
          .prefetchQuery({
            queryKey,
          })
          .catch(globalThis.console.error);
      }}
      href={href}
    >
      <Card className="size-full">
        <CardHeader className="prose">
          <h2 className="text-foreground">{title}</h2>
        </CardHeader>
        <CardBody>{description}</CardBody>
      </Card>
    </Link>
  );
};
