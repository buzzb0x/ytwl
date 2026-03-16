import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "bg-white/5 border border-white/10 rounded-md px-[10px] py-[7px] text-[#ccc] font-mono text-[11px] cursor-pointer shrink-0",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
