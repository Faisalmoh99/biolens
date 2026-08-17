import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: "hsl(222 40% 8%)",
          border: "1px solid hsl(187 100% 50% / 0.3)",
          color: "hsl(210 40% 98%)",
          boxShadow: "0 0 20px hsl(187 100% 50% / 0.2)",
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:shadow-[0_0_24px_rgba(34,211,238,0.35)]",
          error:
            "group-[.toaster]:shadow-[0_0_24px_rgba(239,68,68,0.45)] group-[.toaster]:!border-triage-red/50",
          info: "group-[.toaster]:shadow-[0_0_20px_rgba(34,211,238,0.3)]",
          warning:
            "group-[.toaster]:shadow-[0_0_22px_rgba(249,115,22,0.4)] group-[.toaster]:!border-triage-orange/50",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
