/* eslint-disable @typescript-eslint/no-unsafe-type-assertion,tailwind/no-arbitrary-value */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import isFunction from "lodash/isFunction.js";
import isNil from "lodash/isNil";
import isString from "lodash/isString.js";
import { PanelLeft } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type CSSProperties, type ElementRef,
  forwardRef,
  useCallback,
  useContext,
  useEffect, useMemo,
  useState,
} from "react";

const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextT = {
  isMobile: boolean;
  open: boolean;
  openMobile: boolean;
  setOpen: (open: boolean) => void;
  setOpenMobile: (open: boolean) => void;
  state: "collapsed" | "expanded";
  toggleSidebar: () => void;
};

const SidebarContext = createContext<null | SidebarContextT>(null);

const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
};

const SidebarProvider = forwardRef<
  Readonly<HTMLDivElement>,
  Readonly<{
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
  }> & Readonly<ComponentProps<"div">>
>(
      (
        {
          children,
          className,
          defaultOpen = true,
          onOpenChange: setOpenProperty,
          open: openProperty,
          style,
          ...properties
        },
        reference,
      ) => {
        const isMobile = useIsMobile();
        const [openMobile, setOpenMobile] = useState(false);

        // This is the internal state of the sidebar.
        // We use openProp and setOpenProp for control from outside the component.
        // eslint-disable-next-line react/naming-convention/use-state,sonar/hook-use-state
        const [_open, _setOpen] = useState(defaultOpen);
        const open = openProperty ?? _open;
        const setOpen = useCallback(
          (value: ((value: boolean) => boolean) | boolean) => {
            const openState = isFunction(value)
              ? value(open)
              : value;
            if (setOpenProperty) {
              setOpenProperty(openState);
            } else {
              _setOpen(openState);
            }

            // This sets the cookie to keep the sidebar state.
            // eslint-disable-next-line react-compiler/react-compiler
            document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
          },
          [setOpenProperty, open],
        );

        // Helper to toggle the sidebar.
        const toggleSidebar = useCallback(() => {
          if (isMobile) {
            setOpenMobile((previous) => {
              return !previous;
            });
          } else {
            setOpen((previous) => {
              return !previous;
            });
          }
        }, [isMobile, setOpen, setOpenMobile]);

        // Adds a keyboard shortcut to toggle the sidebar.
        useEffect(() => {
          const handleKeyDown = (event: KeyboardEvent) => {
            if (
              event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
              (event.metaKey || event.ctrlKey)
            ) {
              event.preventDefault();
              toggleSidebar();
            }
          };

          globalThis.addEventListener("keydown", handleKeyDown);
          return () => {
            globalThis.removeEventListener("keydown", handleKeyDown);
          };
        }, [toggleSidebar]);

        // We add a state so that we can do data-state="expanded" or "collapsed".
        // This makes it easier to style the sidebar with Tailwind classes.
        const state = open
          ? "expanded"
          : "collapsed";

        const contextValue = useMemo<SidebarContextT>(
          () => {
            return {
              isMobile,
              open,
              openMobile,
              setOpen,
              setOpenMobile,
              state,
              toggleSidebar,
            };
          },
          [
            state,
            open,
            setOpen,
            isMobile,
            openMobile,
            setOpenMobile,
            toggleSidebar,
          ],
        );

        return (
          <SidebarContext.Provider value={contextValue}>
            <TooltipProvider delayDuration={0}>
              <div
                className={cn(
                  "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
                  className,
                )}
                style={
                  {
                    "--sidebar-width": SIDEBAR_WIDTH,
                    "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                    ...style,
                  } as CSSProperties
                }
                ref={reference}
                {...properties}
              >
                {children}
              </div>
            </TooltipProvider>
          </SidebarContext.Provider>
        );
      },
      );
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = forwardRef<
  Readonly<HTMLDivElement>,
  Readonly<{
    collapsible?: "icon" | "none" | "offcanvas";
    side?: "left" | "right";
    variant?: "floating" | "inset" | "sidebar";
  }> & Readonly<ComponentProps<"div">>
>(
  (
    {
      children,
      className,
      collapsible = "offcanvas",
      side = "left",
      variant = "sidebar",
      ...properties
    },
    reference,
  ) => {
    const { isMobile, openMobile, setOpenMobile, state } = useSidebar();

    if ("none" === collapsible) {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
            className,
          )}
          ref={reference}
          {...properties}
        >
          {children}
        </div>
      );
    }

    if (isMobile) {
      return (
        <Sheet
          onOpenChange={setOpenMobile}
          open={openMobile}
          {...properties}
        >
          <SheetContent
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as CSSProperties
            }
            className="bg-sidebar text-sidebar-foreground w-[--sidebar-width] p-0 [&>button]:hidden"
            data-mobile="true"
            data-sidebar="sidebar"
            side={side}
          >
            <div className="flex size-full flex-col">
              {children}
            </div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        data-collapsible={"collapsed" === state
          ? collapsible
          : ""}
        className="text-sidebar-foreground group peer hidden md:block"
        data-side={side}
        data-state={state}
        data-variant={variant}
        ref={reference}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            "floating" === variant || "inset" === variant
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]",
          )}
        />
        <div
          className={cn(
            "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
            "left" === side
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            "floating" === variant || "inset" === variant
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className,
          )}
          {...properties}
        >
          <div
            className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex size-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow"
            data-sidebar="sidebar"
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);
Sidebar.displayName = "Sidebar";

const SidebarTrigger = forwardRef<
  Readonly<ElementRef<typeof Button>>,
  Readonly<ComponentProps<typeof Button>>
>(({ className, onClick, ...properties }, reference) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      className={cn("h-7 w-7", className)}
      data-sidebar="trigger"
      ref={reference}
      size="icon"
      variant="ghost"
      {...properties}
    >
      <PanelLeft />
      <span className="sr-only">
        Toggle Sidebar
      </span>
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarRail = forwardRef<
  Readonly<HTMLButtonElement>,
  Readonly<ComponentProps<"button">>
>(({ className, ...properties }, reference) => {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      aria-label="Toggle Sidebar"
      data-sidebar="rail"
      onClick={toggleSidebar}
      ref={reference}
      tabIndex={-1}
      title="Toggle Sidebar"
      type="button"
      {...properties}
    />
  );
});
SidebarRail.displayName = "SidebarRail";

const SidebarInset = forwardRef<
  HTMLDivElement,
  ComponentProps<"main">
>(({ className, ...properties }, reference) => {
  return (
    <main
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-white dark:bg-neutral-950",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className,
      )}
      ref={reference}
      {...properties}
    />
  );
});
SidebarInset.displayName = "SidebarInset";

const SidebarInput = forwardRef<
  Readonly<ElementRef<typeof Input>>,
  Readonly<ComponentProps<typeof Input>>
>(({ className, ...properties }, reference) => {
  return (
    <Input
      className={cn(
        "h-8 w-full bg-white shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring dark:bg-neutral-950",
        className,
      )}
      data-sidebar="input"
      ref={reference}
      {...properties}
    />
  );
});
SidebarInput.displayName = "SidebarInput";

const SidebarHeader = forwardRef<
  Readonly<HTMLDivElement>,
  Readonly<ComponentProps<"div">>
>(({ className, ...properties }, reference) => {
  return (
    <div
      className={cn("flex flex-col gap-2 p-2", className)}
      data-sidebar="header"
      ref={reference}
      {...properties}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = forwardRef<
  Readonly<HTMLDivElement>,
  Readonly<ComponentProps<"div">>
>(({ className, ...properties }, reference) => {
  return (
    <div
      className={cn("flex flex-col gap-2 p-2", className)}
      data-sidebar="footer"
      ref={reference}
      {...properties}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";

const SidebarSeparator = forwardRef<
  Readonly<ElementRef<typeof Separator>>,
  Readonly<ComponentProps<typeof Separator>>
>(({ className, ...properties }, reference) => {
  return (
    <Separator
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      data-sidebar="separator"
      ref={reference}
      {...properties}
    />
  );
});
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarContent = forwardRef<
  Readonly<HTMLDivElement>,
  Readonly<ComponentProps<"div">>
>(({ className, ...properties }, reference) => {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      data-sidebar="content"
      ref={reference}
      {...properties}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

const SidebarGroup = forwardRef<
  Readonly<HTMLDivElement>,
  Readonly<ComponentProps<"div">>
>(({ className, ...properties }, reference) => {
  return (
    <div
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      data-sidebar="group"
      ref={reference}
      {...properties}
    />
  );
});
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = forwardRef<
  Readonly<HTMLDivElement>,
  Readonly<{ asChild?: boolean } & ComponentProps<"div">>
>(({ asChild = false, className, ...properties }, reference) => {
  const Comp = asChild
    ? Slot
    : "div";

  return (
    <Comp
      className={cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
      data-sidebar="group-label"
      ref={reference}
      {...properties}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupAction = forwardRef<
  Readonly<HTMLButtonElement>,
  Readonly<{ asChild?: boolean } & ComponentProps<"button">>
>(({ asChild = false, className, ...properties }, reference) => {
  const Comp = asChild
    ? Slot
    : "button";

  return (
    <Comp
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        // eslint-disable-next-line sonar/no-duplicate-string
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-sidebar="group-action"
      ref={reference}
      {...properties}
    />
  );
});
SidebarGroupAction.displayName = "SidebarGroupAction";

const SidebarGroupContent = forwardRef<
  Readonly<HTMLDivElement>,
  Readonly<ComponentProps<"div">>
>(({ className, ...properties }, reference) => {
  return (
    <div
      className={cn("w-full text-sm", className)}
      data-sidebar="group-content"
      ref={reference}
      {...properties}
    />
  );
});
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = forwardRef<
  Readonly<HTMLUListElement>,
  Readonly<ComponentProps<"ul">>
>(({ className, ...properties }, reference) => {
  return (
    <ul
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      data-sidebar="menu"
      ref={reference}
      {...properties}
    />
  );
});
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = forwardRef<
  Readonly<HTMLLIElement>,
  Readonly<ComponentProps<"li">>
>(({ className, ...properties }, reference) => {
  return (
    <li
      className={cn("group/menu-item relative", className)}
      data-sidebar="menu-item"
      ref={reference}
      {...properties}
    />
  );
});
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva(
  "peer/menu-button ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding] focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:font-medium group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-8 text-sm",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
        sm: "h-7 text-xs",
      },
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground bg-white shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))] dark:bg-neutral-950",
      },
    },
  },
);

const SidebarMenuButton = forwardRef<
  Readonly<HTMLButtonElement>,
  Readonly<{
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: ComponentProps<typeof TooltipContent> | string;
  } & ComponentProps<"button"> & VariantProps<typeof sidebarMenuButtonVariants>>
>(
  (
    {
      asChild = false,
      className,
      isActive = false,
      size = "default",
      tooltip,
      variant = "default",
      ...properties
    },
    reference,
  ) => {
    const Comp = asChild
      ? Slot
      : "button";
    const { isMobile, state } = useSidebar();

    const button = (
      <Comp
        className={cn(sidebarMenuButtonVariants({
          size,
          variant,
        }), className)}
        data-active={isActive}
        data-sidebar="menu-button"
        data-size={size}
        ref={reference}
        {...properties}
      />
    );

    if (isNil(tooltip)) {
      return button;
    }

    if (isString(tooltip)) {
      // eslint-disable-next-line no-param-reassign
      tooltip = {
        children: tooltip,
      };
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent
          align="center"
          hidden={"collapsed" !== state || isMobile}
          side="right"
          {...tooltip}
        />
      </Tooltip>
    );
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuAction = forwardRef<
  Readonly<HTMLButtonElement>,
  Readonly<{
    asChild?: boolean;
    showOnHover?: boolean;
  } & ComponentProps<"button">>
>(({
  asChild = false, className, showOnHover = false, ...properties
}, reference) => {
  const Comp = asChild
    ? Slot
    : "button";

  return (
    <Comp
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
        "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className,
      )}
      data-sidebar="menu-action"
      ref={reference}
      {...properties}
    />
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";

const SidebarMenuBadge = forwardRef<
  Readonly<HTMLDivElement>,
  Readonly<ComponentProps<"div">>
>(({ className, ...properties }, reference) => {
  return (
    <div
      className={cn(
        "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-sidebar="menu-badge"
      ref={reference}
      {...properties}
    />
  );
});
SidebarMenuBadge.displayName = "SidebarMenuBadge";

const SidebarMenuSkeleton = forwardRef<
  Readonly<HTMLDivElement>,
  Readonly<{
    showIcon?: boolean;
  } & ComponentProps<"div">>
>(({ className, showIcon = false, ...properties }, reference) => {
  // Random width between 50 to 90%.
  // eslint-disable-next-line sonar/pseudo-random
  const width = `${Math.floor(Math.random() * 40) + 50}%`;

  return (
    <div
      className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
      data-sidebar="menu-skeleton"
      ref={reference}
      {...properties}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        style={
          {
            "--skeleton-width": width,
          } as CSSProperties
        }
        className="h-4 max-w-[--skeleton-width] flex-1"
        data-sidebar="menu-skeleton-text"
      />
    </div>
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

const SidebarMenuSub = forwardRef<
  Readonly<HTMLUListElement>,
  Readonly<ComponentProps<"ul">>
>(({ className, ...properties }, reference) => {
  return (
    <ul
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-sidebar="menu-sub"
      ref={reference}
      {...properties}
    />
  );
});
SidebarMenuSub.displayName = "SidebarMenuSub";

const SidebarMenuSubItem = forwardRef<
  Readonly<HTMLLIElement>,
  Readonly<ComponentProps<"li">>
>(({ ...properties }, reference) => {
  return (
    <li
      ref={reference}
      {...properties}
    />
  );
});
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

const SidebarMenuSubButton = forwardRef<
  Readonly<HTMLAnchorElement>,
  Readonly< {
    asChild?: boolean;
    isActive?: boolean;
    size?: "md" | "sm";
  } & ComponentProps<"a">
  >>(({ asChild = false, className, isActive, size = "md", ...properties }, reference) => {
  const Comp = asChild
    ? Slot
    : "a";

  return (
    <Comp
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        "sm" === size && "text-xs",
        "md" === size && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-active={isActive}
      data-sidebar="menu-sub-button"
      data-size={size}
      ref={reference}
      {...properties}
    />
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
