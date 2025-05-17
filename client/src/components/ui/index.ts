/**
 * UI Components Barrel Export
 * 
 * This file serves as a central export point for all UI components,
 * allowing more concise imports in other files.
 * 
 * Instead of:
 *   import { Button } from "@/components/ui/button"
 *   import { Input } from "@/components/ui/input"
 * 
 * You can do:
 *   import { Button, Input } from "@/components/ui"
 */

// Form components
export * from "./form";
export * from "./input";
export * from "./label";
export * from "./select";
export * from "./textarea";
export * from "./checkbox";
export * from "./radio-group";
export * from "./switch";
export * from "./slider";

// Layout components
export * from "./card";
export * from "./avatar";
export * from "./separator";
export * from "./aspect-ratio";
export * from "./scroll-area";

// Navigation components
export * from "./tabs";
export * from "./navigation-menu";

// Feedback components
export * from "./alert";
export * from "./toast";
export * from "./toaster";
export * from "./progress";

// Overlay components
export * from "./dialog";
export * from "./dropdown-menu";
export * from "./popover";
export * from "./hover-card";
export * from "./tooltip";
export * from "./context-menu";
export * from "./sheet";

// Disclosure components
export * from "./collapsible";
export * from "./accordion";

// Date components
export * from "./calendar";

// Action components
export * from "./button";

// Data display components
export * from "./table";
export * from "./badge";

// Miscellaneous components
export * from "./skeleton";