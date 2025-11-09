"use client";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import {
  CakeSlice,
  Coffee,
  Grape,
  IceCream,
  Pizza,
  Sandwich,
} from "lucide-react";

export const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link> & { icon: LucideIcon }
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          className={cn(
            "block select-none space-y-2 rounded-md p-3 leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <props.icon className="mb-4 size-6" />
          <div className="text-sm font-semibold leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export const foods = [
  {
    title: "Dessert",
    icon: CakeSlice,
    description: "Sweet treats to satisfy your cravings.",
  },
  {
    title: "Pizza",
    icon: Pizza,
    description: "Delicious, cheesy slices of goodness.",
  },
  {
    title: "Sandwich",
    icon: Sandwich,
    description: "Classic and hearty fast food options.",
  },
  {
    title: "Coffee",
    icon: Coffee,
    description: "Your go-to boost of caffeine.",
  },
  {
    title: "Ice Cream",
    icon: IceCream,
    description: "Cold, creamy delights for any mood.",
  },
  {
    title: "Fruit",
    icon: Grape,
    description: "Fresh and healthy natural snacks.",
  },
];
