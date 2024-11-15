import { Link } from "@nextui-org/link";
import { NavbarItem } from "@nextui-org/navbar";
import { useLocation } from "@tanstack/react-router";
import map from "lodash/map";
import { twMerge } from "tailwind-merge";

const links = [
  {
    href: "/",
    label: "Skills",
  },
  {
    href: "/resume",
    label: "Resume",
  },
  {
    href: "/certifications",
    label: "Certifications",
  },
  {
    href: "/projects",
    label: "Projects",
  },
  {
    href: "/courses",
    label: "Courses",
  },
];

export const NavigationItems = () => {
  const location = useLocation();

  return (
    <>
      {map(links, (link) => {
        return (
          <NavbarItem key={link.href}>
            <Link
              className={twMerge(
                "text-foreground underline-offset-2",
                location.pathname === link.href && "underline",
              )}
              href={link.href}
            >
              {link.label}
            </Link>
          </NavbarItem>
        );
      })}
    </>
  );
};
