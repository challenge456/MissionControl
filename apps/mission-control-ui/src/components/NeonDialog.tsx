/**
 * Neon-styled dialog: re-exports Radix Dialog with glass/neon content styling.
 * DialogContent is already themed in ui/dialog.tsx; this module provides a single import surface.
 */
export {
  Dialog as NeonDialog,
  DialogTrigger as NeonDialogTrigger,
  DialogContent as NeonDialogContent,
  DialogHeader as NeonDialogHeader,
  DialogFooter as NeonDialogFooter,
  DialogTitle as NeonDialogTitle,
  DialogDescription as NeonDialogDescription,
  DialogClose as NeonDialogClose,
} from "@/components/ui/dialog";
