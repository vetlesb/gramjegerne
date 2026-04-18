'use client';

import {Icon} from '@/components/Icon';
import {LoadingSpinner} from '@/components/ui/LoadingSpinner';
import {useLanguage} from '@/i18n/LanguageProvider';
import {Command} from 'cmdk';
import {useState} from 'react';

interface CategoryOption {
  _id: string;
  title: string;
}

interface CategoryComboboxProps {
  categories: CategoryOption[];
  selectedCategory: string;
  onSelect: (categoryId: string) => void;
  onCreateNew?: (title: string) => Promise<void>;
  label?: string;
  required?: boolean;
}

export function CategoryCombobox({
  categories,
  selectedCategory,
  onSelect,
  onCreateNew,
  label = 'Category',
  required = false,
}: CategoryComboboxProps) {
  const {t} = useLanguage();
  const [categoryInput, setCategoryInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const filteredCategories = categories.filter(
    (category) =>
      !categoryInput || category.title.toLowerCase().includes(categoryInput.toLowerCase()),
  );

  const handleCreate = async (title: string) => {
    if (!onCreateNew) return;
    setIsAdding(true);
    try {
      await onCreateNew(title);
      setCategoryInput('');
      setIsOpen(false);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <label className="flex flex-col gap-y-2">
      {label}
      {required && ' *'}
      <div className="relative w-full">
        <Command
          className="relative"
          shouldFilter={false}
          loop={true}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        >
          <div className="relative">
            <Command.Input
              value={
                selectedCategory
                  ? categories.find((c) => c._id === selectedCategory)?.title || ''
                  : categoryInput
              }
              onValueChange={(value) => {
                setCategoryInput(value);
                if (selectedCategory) {
                  onSelect('');
                }
                setIsOpen(true);
              }}
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(!isOpen);
              }}
              readOnly={selectedCategory !== ''}
              className="w-full p-4 border border-gray-300 rounded cursor-pointer"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {selectedCategory && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelect('');
                    setCategoryInput('');
                  }}
                  className="p-1 rounded-md"
                  title="Remove selected category"
                >
                  <Icon name="close" width={16} height={16} />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(!isOpen);
                }}
                className="p-1"
              >
                <Icon name="chevrondown" width={16} height={16} />
              </button>
            </div>
          </div>

          {isOpen && (
            <div className="absolute w-full mt-2 bg-dimmed border border-accent rounded-md shadow-lg z-[60]">
              <Command.List className="max-h-[300px] overflow-auto p-2">
                <Command.Empty className="p-4 text-sm text-gray-500">
                  {t.misc.noResults}
                  {categoryInput && onCreateNew && (
                    <button
                      type="button"
                      onClick={() => handleCreate(categoryInput)}
                      className="button-primary-accent text-lg flex items-center gap-1 mt-2 text-secondary"
                    >
                      <Icon name="add" width={24} height={24} /> {t.misc.createCategory} &ldquo;
                      {categoryInput}&rdquo;
                      {isAdding && <LoadingSpinner size="sm" />}
                    </button>
                  )}
                </Command.Empty>

                {filteredCategories.map((category) => (
                  <Command.Item
                    key={category._id}
                    value={category._id}
                    onSelect={() => {
                      setTimeout(() => {
                        onSelect(category._id);
                        setCategoryInput('');
                        setIsOpen(false);
                      }, 0);
                    }}
                    className="px-4 py-2 cursor-pointer hover:bg-dimmed focus:bg-dimmed outline-none rounded"
                  >
                    {category.title}
                  </Command.Item>
                ))}
              </Command.List>
            </div>
          )}
        </Command>
      </div>
    </label>
  );
}
