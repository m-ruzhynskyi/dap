
"use client"

import * as React from "react";
import { useRouter, usePathname } from "next/navigation"; 
import { columns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Equipment, Option, EquipmentFormData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES as PREDEFINED_CATEGORIES, LOCATIONS as PREDEFINED_LOCATIONS } from "./equipment-data";
import { EditEquipmentDialog } from "@/components/edit-equipment-dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import type { UserSession } from "@/lib/auth"; 

async function handleApiResponse<T>(response: Response, entityName: string, successMessage?: string): Promise<T> {
  if (!response.ok) {
    let errorMsg = `Не вдалося ${entityName}. Статус: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || `${errorMsg}${response.statusText ? `: ${response.statusText}` : '.'}`;
    } catch (jsonParseError) {
      errorMsg = `${errorMsg}${response.statusText ? `: ${response.statusText}` : '. Сервер повернув відповідь, що не є JSON.'}`;
      if (response.headers.get('content-type')?.includes('text/html')) {
        try {
          const clonedResponse = response.clone();
          const textError = await clonedResponse.text();
          console.error(`HTML error response from server (first 500 chars): ${textError.substring(0, 500)}`);
        } catch (e) {  }
      }
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) { 
    return undefined as T; 
  }

  try {
    const data = await response.json();
    return data as T;
  } catch (parseError) {
    const baseErrorText = `Операція ${entityName} була успішною (статус ${response.status}), але не вдалося розібрати відповідь як JSON.`;
    const errorMsg = successMessage ? `${baseErrorText} Очікувався ${successMessage}.` : baseErrorText;
    console.error(errorMsg, `Content-Type: ${response.headers.get('content-type')}`, parseError);
    throw new Error(errorMsg);
  }
}

async function fetchEquipment(): Promise<Equipment[]> {
  const response = await fetch('/api/equipment');
  const data = await handleApiResponse<Equipment[]>(response, 'завантажити техніку');
  return data.map((item: any) => ({ 
    ...item, 
    createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
  }));
}

async function fetchCategories(): Promise<string[]> {
  const response = await fetch('/api/categories');
  return handleApiResponse<string[]>(response, 'завантажити категорії');
}

async function fetchLocations(): Promise<string[]> {
  const response = await fetch('/api/locations');
  return handleApiResponse<string[]>(response, 'завантажити кабінети');
}

async function fetchCurrentUser(): Promise<UserSession> {
  const response = await fetch('/api/auth/user', { cache: 'no-store' });
  if (!response.ok) {
    console.error("Не вдалося отримати статус поточного користувача:", response.status, response.statusText);
    return { isLoggedIn: false };
  }
  return response.json();
}


export default function TechTrackerPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [equipmentData, setEquipmentData] = React.useState<Equipment[]>([]);
  const [dynamicCategories, setDynamicCategories] = React.useState<Option[]>(PREDEFINED_CATEGORIES);
  const [dynamicLocations, setDynamicLocations] = React.useState<Option[]>(PREDEFINED_LOCATIONS);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = React.useState<Equipment | null>(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = React.useState<Equipment | null>(null);

  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);


  const deriveFilterOptions = (equipment: Equipment[], categoriesFromApi: string[], locationsFromApi: string[]) => {
    const uniqueCategoriesFromEquipment = new Set(equipment.map(e => e.category?.trim()).filter(Boolean));
    const uniqueLocationsFromEquipment = new Set(equipment.map(e => e.location?.trim()).filter(Boolean));

    const allCategoryValues = new Set([
      ...categoriesFromApi.map(c => c.trim()).filter(Boolean),
      ...Array.from(uniqueCategoriesFromEquipment)
    ]);
    const finalCategories = Array.from(allCategoryValues).map(catValue => {
      const predefined = PREDEFINED_CATEGORIES.find(p => p.value.toLowerCase() === catValue.toLowerCase());
      return predefined || { value: catValue, label: catValue, icon: PREDEFINED_CATEGORIES.find(c => c.value === 'Other')?.icon };
    }).sort((a,b) => a.label.localeCompare(b.label));
    
    if (!finalCategories.some(c => c.value.toLowerCase() === 'other')) {
        const otherCat = PREDEFINED_CATEGORIES.find(c => c.value === 'Other');
        if (otherCat) finalCategories.push(otherCat);
    }
    setDynamicCategories(finalCategories.length > 0 ? finalCategories : PREDEFINED_CATEGORIES);

    const allLocationValues = new Set([
        ...locationsFromApi.map(l => l.trim()).filter(Boolean),
        ...Array.from(uniqueLocationsFromEquipment)
    ]);
    const finalLocations = Array.from(allLocationValues).map(locValue => {
      const predefined = PREDEFINED_LOCATIONS.find(p => p.value.toLowerCase() === locValue.toLowerCase());
      return predefined || { value: locValue, label: locValue };
    }).sort((a,b) => a.label.localeCompare(b.label));
    setDynamicLocations(finalLocations.length > 0 ? finalLocations : PREDEFINED_LOCATIONS);
  };

  const loadInitialData = React.useCallback(async () => {
    setIsLoading(true);
    setIsAuthLoading(true);
    try {
      const [equipment, categories, locations, user] = await Promise.all([
        fetchEquipment(),
        fetchCategories(),
        fetchLocations(),
        fetchCurrentUser()
      ]);
      setEquipmentData(equipment);
      deriveFilterOptions(equipment, categories, locations);
      setCurrentUser(user);

    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast({
        variant: "destructive",
        title: "Помилка завантаження даних",
        description: error.message || "Не вдалося завантажити дані. Перевірте консоль сервера для деталей.",
      });
      setEquipmentData([]); 
      setDynamicCategories(PREDEFINED_CATEGORIES);
      setDynamicLocations(PREDEFINED_LOCATIONS);
      setCurrentUser({ isLoggedIn: false }); 
    } finally {
      setIsLoading(false);
      setIsAuthLoading(false);
    }
  }, [toast]); 

  React.useEffect(() => {
    loadInitialData();
  }, [loadInitialData, pathname]); 

  const handleAddEquipment = async (newEquipmentData: EquipmentFormData) => {
    if (!currentUser?.isLoggedIn) {
      toast({ variant: "destructive", title: "Не авторизовано", description: "Будь ласка, увійдіть, щоб додати техніку." });
      return;
    }
    try {
      let dateAddedString: string;
      if (newEquipmentData.dateAdded instanceof Date) {
        const year = newEquipmentData.dateAdded.getFullYear();
        const month = (newEquipmentData.dateAdded.getMonth() + 1).toString().padStart(2, '0');
        const day = newEquipmentData.dateAdded.getDate().toString().padStart(2, '0');
        dateAddedString = `${year}-${month}-${day}`;
      } else if (typeof newEquipmentData.dateAdded === 'string') {
         if (newEquipmentData.dateAdded.includes('T')) { 
            const d = new Date(newEquipmentData.dateAdded);
            const year = d.getFullYear(); 
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            dateAddedString = `${year}-${month}-${day}`;
        } else { 
            dateAddedString = newEquipmentData.dateAdded;
        }
      } else {
        throw new Error("Невірний тип dateAdded у даних форми.");
      }

      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newEquipmentData,
          dateAdded: dateAddedString, 
        }),
      });

      await handleApiResponse(response, 'додати техніку', 'новий запис техніки');
      
      toast({
        title: "Техніку додано",
        description: `${newEquipmentData.name} успішно додано до бази даних.`,
      });
      await loadInitialData(); 
    } catch (error: any) {
      console.error("Error adding equipment:", error);
      toast({
        variant: "destructive",
        title: "Помилка додавання техніки",
        description: error.message || "Не вдалося додати техніку.",
      });
    }
  };

  const handleOpenEditDialog = (item: Equipment) => {
    if (!currentUser?.isLoggedIn) {
      toast({ variant: "destructive", title: "Не авторизовано", description: "Будь ласка, увійдіть, щоб редагувати техніку." });
      return;
    }
    setEquipmentToEdit(item);
    setIsEditDialogOpen(true);
  };

  const handleUpdateEquipment = async (id: string, updatedData: EquipmentFormData) => {
    if (!currentUser?.isLoggedIn) {
      toast({ variant: "destructive", title: "Не авторизовано", description: "Будь ласка, увійдіть, щоб оновити техніку." });
      return;
    }
     try {
      let dateAddedString: string;
      if (updatedData.dateAdded instanceof Date) {
        const year = updatedData.dateAdded.getFullYear();
        const month = (updatedData.dateAdded.getMonth() + 1).toString().padStart(2, '0');
        const day = updatedData.dateAdded.getDate().toString().padStart(2, '0');
        dateAddedString = `${year}-${month}-${day}`;
      } else if (typeof updatedData.dateAdded === 'string') {
         if (updatedData.dateAdded.includes('T')) {
            const d = new Date(updatedData.dateAdded);
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            dateAddedString = `${year}-${month}-${day}`;
        } else {
            dateAddedString = updatedData.dateAdded;
        }
      } else {
        throw new Error("Невірний тип dateAdded у даних форми.");
      }
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedData,
          dateAdded: dateAddedString,
        }),
      });

      await handleApiResponse(response, 'оновити техніку', 'оновлений запис техніки');
      
      toast({
        title: "Техніку оновлено",
        description: `${updatedData.name} успішно оновлено.`,
      });
      await loadInitialData();
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error(`Error updating equipment ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Помилка оновлення техніки",
        description: error.message || "Не вдалося оновити техніку.",
      });
    }
  };

  const handleOpenDeleteDialog = (item: Equipment) => {
     if (!currentUser?.isLoggedIn) {
      toast({ variant: "destructive", title: "Не авторизовано", description: "Будь ласка, увійдіть, щоб видалити техніку." });
      return;
    }
    setEquipmentToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (id: string) => {
    if (!currentUser?.isLoggedIn) {
      toast({ variant: "destructive", title: "Не авторизовано", description: "Будь ласка, увійдіть, щоб видалити техніку." });
      return;
    }
    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'DELETE',
      });

      await handleApiResponse(response, 'видалити техніку'); 
      
      toast({
        title: "Техніку видалено",
        description: `Запис успішно видалено з бази даних.`,
      });
      await loadInitialData();
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error(`Error deleting equipment ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Помилка видалення техніки",
        description: error.message || "Не вдалося видалити техніку.",
      });
    }
  };


  if (isLoading || isAuthLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-1/4" />
                <div className="flex space-x-2">
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>
            <Skeleton className="h-[500px] w-full rounded-md border" />
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-1/5" />
                <Skeleton className="h-8 w-1/3" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <DataTable 
        columns={columns} 
        data={equipmentData}
        onAddEquipment={currentUser?.isLoggedIn ? handleAddEquipment : undefined} 
        filterCategories={dynamicCategories}
        filterLocations={dynamicLocations}
        onEditItem={currentUser?.isLoggedIn ? handleOpenEditDialog : undefined} 
        onDeleteItem={currentUser?.isLoggedIn ? handleOpenDeleteDialog : undefined} 
        isUserLoggedIn={currentUser?.isLoggedIn || false}
      />
      {currentUser?.isLoggedIn && (
        <>
          <EditEquipmentDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            equipmentToEdit={equipmentToEdit}
            onEquipmentUpdate={handleUpdateEquipment}
          />
          <DeleteConfirmationDialog
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            equipmentToDelete={equipmentToDelete}
            onConfirmDelete={handleConfirmDelete}
          />
        </>
      )}
    </div>
  );
}
