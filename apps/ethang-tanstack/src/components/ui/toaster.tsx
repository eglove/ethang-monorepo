import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import isNil from "lodash/isNil";
import map from "lodash/map";

export const Toaster = () => {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {map(toasts, ({ action, description, id, title, ...properties }) => {
        return (
          <Toast
            key={id}
            {...properties}
          >
            <div className="grid gap-1">
              {!isNil(title) && (
                <ToastTitle>
                  {title}
                </ToastTitle>
              )}
              {!isNil(description) && (
                <ToastDescription>
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
};
