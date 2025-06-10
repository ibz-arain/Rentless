declare module "@radix-ui/react-avatar" {
  import * as React from "react";
  
  export interface AvatarProps extends React.ComponentPropsWithoutRef<"span"> {}
  export interface AvatarImageProps extends React.ComponentPropsWithoutRef<"img"> {}
  export interface AvatarFallbackProps extends React.ComponentPropsWithoutRef<"span"> {}
  
  export const Root: React.ForwardRefExoticComponent<AvatarProps & React.RefAttributes<HTMLSpanElement>>;
  export const Image: React.ForwardRefExoticComponent<AvatarImageProps & React.RefAttributes<HTMLImageElement>>;
  export const Fallback: React.ForwardRefExoticComponent<AvatarFallbackProps & React.RefAttributes<HTMLSpanElement>>;
} 