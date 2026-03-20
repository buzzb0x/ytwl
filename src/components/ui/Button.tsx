import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "font-mono text-[11px] px-[11px] py-[7px] rounded-md cursor-pointer transition-colors",
  {
    variants: {
      variant: {
        ghost: "bg-white/5 border border-white/10 text-[#aaa] hover:text-white",
        danger:
          "bg-transparent border border-accent/25 text-accent opacity-60 hover:opacity-100",
        accent: "bg-accent text-white border-none",
      },
    },
    defaultVariants: {
      variant: "ghost",
    },
  },
);

interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  variant,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant }), className)} {...props}>
      {children}
    </button>
  );
}
