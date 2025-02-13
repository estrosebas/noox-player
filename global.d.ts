// global.d.ts
import { MotionValue, Transition, MotionProps as OriginalMotionProps } from "framer-motion";

declare module "framer-motion" {
  // Extender en lugar de redeclarar
  interface MotionProps extends OriginalMotionProps {
    className?: string;
    children?: React.ReactNode;
    style?: React.CSSProperties;
  }

  // Solo declarar lo que necesites sobrescribir
  interface Transition extends Transition {
    repeatType?: "loop" | "reverse" | "mirror";
  }
}