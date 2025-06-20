
"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Equipment } from "@/types"

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentToDelete: Equipment | null;
  onConfirmDelete: (id: string) => void;
}

export function DeleteConfirmationDialog({
  isOpen,
  onOpenChange,
  equipmentToDelete,
  onConfirmDelete,
}: DeleteConfirmationDialogProps) {
  if (!equipmentToDelete) return null;

  const handleConfirm = () => {
    onConfirmDelete(equipmentToDelete.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
          <AlertDialogDescription>
            Цю дію неможливо буде скасувати. Це назавжди видалить запис про техніку 
            <span className="font-semibold"> &quot;{equipmentToDelete.name}&quot; </span> 
            (інв. номер: {equipmentToDelete.inventoryNumber}) з бази даних.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Скасувати</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive hover:bg-destructive/90">
            Видалити
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
