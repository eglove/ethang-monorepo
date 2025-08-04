import { BreadcrumbItem, Breadcrumbs } from "@heroui/react";
import map from "lodash/map";

export type FooterProperties = {
  breadcrumbPaths:
    | {
        href: string;
        label: string;
      }[]
    | undefined;
};

export const Footer = ({ breadcrumbPaths }: Readonly<FooterProperties>) => {
  return (
    <footer className="mt-4">
      <Breadcrumbs
        classNames={{ base: "w-full", list: "max-w-full" }}
        itemsAfterCollapse={2}
        itemsBeforeCollapse={1}
        maxItems={4}
        radius="none"
        variant="bordered"
      >
        <BreadcrumbItem href="/" underline="hover">
          Home
        </BreadcrumbItem>
        {map(breadcrumbPaths, (path) => {
          return (
            <BreadcrumbItem href={path.href} underline="hover">
              {path.label}
            </BreadcrumbItem>
          );
        })}
      </Breadcrumbs>
    </footer>
  );
};
