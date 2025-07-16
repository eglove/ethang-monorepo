import { Card, CardBody, CardHeader, Link } from "@heroui/react";

type HomeNavigationCardProperties = {
  description: string;
  href: string;
  title: string;
};

export const NavigationCard = ({
  description,
  href,
  title,
}: Readonly<HomeNavigationCardProperties>) => {
  return (
    <Link href={href}>
      <Card className="size-full">
        <CardHeader className="prose">
          <h2 className="text-foreground font-bold text-2xl">{title}</h2>
        </CardHeader>
        <CardBody>{description}</CardBody>
      </Card>
    </Link>
  );
};
