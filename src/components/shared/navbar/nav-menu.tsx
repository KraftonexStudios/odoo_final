"use client";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import Link from "next/link";
import { ComponentProps } from "react";
import { foods, ListItem } from "./config";

export const NavMenu = (props: ComponentProps<typeof NavigationMenu>) => (
  <NavigationMenu {...props}>
    <NavigationMenuList className="data-[orientation=vertical]:-ms-2 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start">
      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="#">Home</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Food</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[400px] gap-3 p-1 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {foods.map((food) => (
                <ListItem
                  key={food.title}
                  title={food.title}
                  icon={food.icon}
                  href="#"
                >
                  {food.description}
                </ListItem>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="#">About</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="#">Contact Us</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
);
