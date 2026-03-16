import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "bg-white/5 border border-white/10 rounded-md px-3 py-[7px] text-white font-mono text-xs placeholder:text-dimmed",
        className,
      )}
      {...props}
    />
  );
}
