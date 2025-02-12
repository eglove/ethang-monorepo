import { cn } from "@/lib/utils";
import * as React from "react";
import * as RechartsPrimitive from "recharts";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { dark: ".dark", light: "" } as const;

export type ChartConfig = Record<
  string,
  {
    icon?: React.ComponentType;
    label?: React.ReactNode;
  } & (
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
    | { color?: string; theme?: never }
  )
>;

type ChartContextProperties = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProperties | null>(null);

function useChart() {
  const context = React.use(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

const ChartContainer = ({
  children,
  className,
  config,
  id,
  ref,
  ...properties
}: {
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
  config: ChartConfig;
} & {
  ref?: React.RefObject<HTMLDivElement | null>;
} & React.ComponentProps<"div">) => {
  const uniqueId = React.useId();
  // @ts-expect-error ignore
  const chartId = `chart-${id || uniqueId.replaceAll(":", "")}`;

  return (
    <ChartContext value={{ config }}>
      <div
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        data-chart={chartId}
        ref={ref}
        {...properties}
      >
        <ChartStyle config={config} id={chartId} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext>
  );
};
ChartContainer.displayName = "Chart";

const ChartStyle = ({ config, id }: { config: ChartConfig; id: string }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color,
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = ({
  active,
  className,
  color,
  formatter,
  hideIndicator = false,
  hideLabel = false,
  indicator = "dot",
  label,
  labelClassName,
  labelFormatter,
  labelKey,
  nameKey,
  payload,
  ref,
}: {
  hideIndicator?: boolean;
  hideLabel?: boolean;
  indicator?: "dashed" | "dot" | "line";
  labelKey?: string;
  nameKey?: string;
} & {
  ref?: React.RefObject<HTMLDivElement | null>;
} & React.ComponentProps<"div"> &
  React.ComponentProps<typeof RechartsPrimitive.Tooltip>) => {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    // @ts-expect-error ignore
    const key = `${labelKey || item.dataKey || item.name || "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && "string" === typeof label
        ? config[label]?.label || label
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (!value) {
      return null;
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ]);

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = 1 === payload.length && "dot" !== indicator;

  return (
    <div
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
      ref={ref}
    >
      {nestLabel ? null : tooltipLabel}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const indicatorColor = color || item.payload.fill || item.color;

          return (
            <div
              className={cn(
                "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                "dot" === indicator && "items-center",
              )}
              key={item.dataKey}
            >
              {formatter && item.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn(
                          "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                          {
                            "h-2.5 w-2.5": "dot" === indicator,
                            "my-0.5": nestLabel && "dashed" === indicator,
                            "w-0 border-[1.5px] border-dashed bg-transparent":
                              "dashed" === indicator,
                            "w-1": "line" === indicator,
                          },
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center",
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                    </div>
                    {item.value && (
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {item.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = ({
  className,
  hideIcon = false,
  nameKey,
  payload,
  ref,
  verticalAlign = "bottom",
}: {
  hideIcon?: boolean;
  nameKey?: string;
} & { ref?: React.RefObject<HTMLDivElement | null> } & Pick<
    RechartsPrimitive.LegendProps,
    "payload" | "verticalAlign"
  > &
  React.ComponentProps<"div">) => {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        "top" === verticalAlign ? "pb-3" : "pt-3",
        className,
      )}
      ref={ref}
    >
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);

        return (
          <div
            className={cn(
              "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
            )}
            key={item.value}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                style={{
                  backgroundColor: item.color,
                }}
                className="h-2 w-2 shrink-0 rounded-[2px]"
              />
            )}
            {itemConfig?.label}
          </div>
        );
      })}
    </div>
  );
};
ChartLegendContent.displayName = "ChartLegend";

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if ("object" !== typeof payload || null === payload) {
    return;
  }

  const payloadPayload =
    "payload" in payload &&
    "object" === typeof payload.payload &&
    null !== payload.payload
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    "string" === typeof payload[key as keyof typeof payload]
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    "string" === typeof payloadPayload[key as keyof typeof payloadPayload]
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
};
