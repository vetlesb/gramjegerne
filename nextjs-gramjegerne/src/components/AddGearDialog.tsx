'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {ItemCardCompact} from '@/components/ItemCard/ItemCardCompact';
import {useLanguage} from '@/i18n/LanguageProvider';

export interface AddGearItem {
  _id: string;
  name: string;
  category: {_id: string; title: string};
  image?: {
    _type: string;
    asset: {_ref: string; _type: string};
  };
  size?: string;
  weight?: {weight: number; unit: string};
  calories?: number;
}

interface AddGearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: AddGearItem[];
  existingItemIds: Set<string>;
  onConfirm: (selectedItems: AddGearItem[]) => void;
  imageUrlBuilder: (asset: {_ref: string}) => string;
}

export function AddGearDialog({
  open,
  onOpenChange,
  items,
  existingItemIds,
  onConfirm,
  imageUrlBuilder,
}: AddGearDialogProps) {
  const {t} = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelectedItems, setTempSelectedItems] = useState<AddGearItem[]>([]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setTempSelectedItems([]);
      setSearchQuery('');
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch = searchQuery
          ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.title.toLowerCase().includes(searchQuery.toLowerCase())
          : true;
        const notAlreadyInList = !existingItemIds.has(item._id);
        return matchesSearch && notAlreadyInList;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'nb'));
  }, [items, searchQuery, existingItemIds]);

  const handleToggle = useCallback((item: AddGearItem) => {
    setTempSelectedItems((prev) => {
      const isSelected = prev.some((s) => s._id === item._id);
      return isSelected ? prev.filter((s) => s._id !== item._id) : [...prev, item];
    });
  }, []);

  const handleConfirm = () => {
    onConfirm(tempSelectedItems);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog p-4 max-w-lg md:p-5 rounded-2xl h-[80vh] no-scrollbar flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl text-accent font-normal">{t.gear.addGear}</DialogTitle>
        </DialogHeader>

        <label className="flex flex-col pt-2 gap-y-2 text-lg">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-full p-4 mb-1"
            placeholder={t.misc.searchGearOrCategory}
          />
        </label>

        <div className="flex-grow overflow-y-auto max-h-[60vh] no-scrollbar">
          {items.length === 0 ? (
            <p>Loading gear...</p>
          ) : filteredItems.length === 0 ? (
            <p>No matches</p>
          ) : (
            <ul className="flex flex-col gap-y-1">
              {filteredItems.map((item) => (
                <ItemCardCompact
                  key={item._id}
                  item={item}
                  isSelected={tempSelectedItems.some((s) => s._id === item._id)}
                  onClick={() => handleToggle(item)}
                  imageUrlBuilder={imageUrlBuilder}
                />
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={handleConfirm}
            disabled={tempSelectedItems.length === 0}
            className="button-primary-accent flex-1 mt-4"
          >
            {tempSelectedItems.length === 0
              ? t.actions.add
              : tempSelectedItems.length === 1
                ? `${t.actions.add} 1 item`
                : `${t.actions.add} ${tempSelectedItems.length} items`}
          </button>
          <DialogClose asChild></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
