
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
import type { User } from "@/types"

interface DeleteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userToDelete: User | null;
  onConfirmDelete: (id: string) => void;
}

export function DeleteUserDialog({
  isOpen,
  onOpenChange,
  userToDelete,
  onConfirmDelete,
}: DeleteUserDialogProps) {
  if (!userToDelete) return null;

  const handleConfirm = () => {
    onConfirmDelete(userToDelete.id);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
          <AlertDialogDescription>
            Цю дію неможливо буде скасувати. Це назавжди видалить обліковий запис 
            <span className="font-semibold"> &quot;{userToDelete.username}&quot; </span> 
            з бази даних.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Скасувати</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive hover:bg-destructive/90">
            Видалити
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
