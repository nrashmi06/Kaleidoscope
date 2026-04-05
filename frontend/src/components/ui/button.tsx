// src/components/ui/button.tsx
"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-cream-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-steel focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-navy",
  {
    variants: {
      variant: {
        default: "bg-steel text-cream-50 hover:bg-steel-600 dark:bg-sky dark:text-navy dark:hover:bg-sky-300",
        destructive: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
        outline: "border border-cream-300 bg-cream-50 hover:bg-cream-300 hover:text-navy dark:border-navy-700 dark:bg-navy dark:hover:bg-navy-700 dark:hover:text-cream",
        secondary: "bg-cream-300 text-navy hover:bg-cream-400 dark:bg-navy-700 dark:text-cream dark:hover:bg-navy-600",
        ghost: "hover:bg-cream-300 hover:text-navy dark:hover:bg-navy-700 dark:hover:text-cream",
        link: "text-steel underline-offset-4 hover:underline dark:text-sky",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
