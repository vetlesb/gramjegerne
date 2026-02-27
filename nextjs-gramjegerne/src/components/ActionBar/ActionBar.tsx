'use client';

import {useState, useRef, useEffect} from 'react';
import {Button, IconButton} from '@/components/Button';
import {Icon} from '@/components/Icon';
import styles from './ActionBar.module.scss';

interface ActionBarProps {
  mode: 'gear' | 'list' | 'lists-overview' | 'shared-list';

  // Gear mode props
  onAddGear?: () => void;
  onManageCategories?: () => void;
  onExcel?: () => void;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;

  // List mode props (packing list detail)
  onAddToList?: () => void;
  onShare?: () => void;
  onDuplicate?: () => void;
  
  // Lists overview mode props
  onAddList?: () => void;

  // Shared list mode props
  onSaveToMyLists?: () => void;
  isSaved?: boolean;
  isSaving?: boolean;
}

export function ActionBar({
  mode,
  onAddGear,
  onManageCategories,
  onExcel,
  viewMode,
  onViewModeChange,
  onAddToList,
  onShare,
  onDuplicate,
  onAddList,
  onSaveToMyLists,
  isSaved,
  isSaving,
}: ActionBarProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  return (
    <div className={styles.actionBar}>
      {/* Desktop: All buttons visible */}
      <div className={styles.desktopGroup}>
        {mode === 'gear' && (
          <>
            <Button onClick={onAddGear}>Add</Button>
            <Button onClick={onManageCategories}>Categories</Button>
            <Button onClick={onExcel}>Excel</Button>
            {viewMode && onViewModeChange && (
              <Button
                onClick={() => onViewModeChange(viewMode === 'list' ? 'grid' : 'list')}
                iconName={viewMode === 'list' ? 'grid' : 'list'}
              >
                {viewMode === 'list' ? 'Grid' : 'List'}
              </Button>
            )}
          </>
        )}

        {mode === 'list' && (
          <>
            <Button onClick={onAddToList}>Add gear</Button>
            <Button onClick={onShare}>Share</Button>
            <Button onClick={onDuplicate}>Duplicate</Button>
          </>
        )}

        {mode === 'lists-overview' && (
          <>
            <Button onClick={onAddList}>Add List</Button>
            {viewMode && onViewModeChange && (
              <Button
                onClick={() => onViewModeChange(viewMode === 'list' ? 'grid' : 'list')}
                iconName={viewMode === 'list' ? 'grid' : 'list'}
              >
                {viewMode === 'list' ? 'Grid' : 'List'}
              </Button>
            )}
          </>
        )}

        {mode === 'shared-list' && (
          <Button
            variant={isSaved ? 'secondary' : 'primary'}
            onClick={isSaved ? undefined : onSaveToMyLists}
            disabled={isSaving || isSaved}
            iconName={isSaved ? 'checkmark' : undefined}
          >
            {isSaving ? (
              <>
                <span className={styles.spinner} />
                Saving...
              </>
            ) : isSaved ? (
              'Saved to my lists'
            ) : (
              'Save to my lists'
            )}
          </Button>
        )}
      </div>

      {/* Mobile: Primary action + More menu */}
      <div className={styles.mobileGroup}>
        {mode === 'gear' && (
          <>
            <Button onClick={onAddGear}>Add</Button>
            <div className={styles.moreMenu} ref={moreMenuRef}>
              <IconButton
                iconName="ellipsis"
                variant="secondary"
                size="lg"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                aria-label="More options"
              />
              {isMoreMenuOpen && (
                <div className={styles.moreMenuDropdown}>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      onManageCategories?.();
                      setIsMoreMenuOpen(false);
                    }}
                  >
                    <Icon name="menu" width={20} height={20} />
                    <span>Categories</span>
                  </button>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      onExcel?.();
                      setIsMoreMenuOpen(false);
                    }}
                  >
                    <Icon name="document" width={20} height={20} />
                    <span>Excel</span>
                  </button>
                  {viewMode && onViewModeChange && (
                    <button
                      className={styles.menuItem}
                      onClick={() => {
                        onViewModeChange(viewMode === 'list' ? 'grid' : 'list');
                        setIsMoreMenuOpen(false);
                      }}
                    >
                      <Icon name={viewMode === 'list' ? 'grid' : 'list'} width={20} height={20} />
                      <span>{viewMode === 'list' ? 'Grid view' : 'List view'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {mode === 'list' && (
          <>
            <Button onClick={onAddToList}>Add gear</Button>
            <div className={styles.moreMenu} ref={moreMenuRef}>
              <IconButton
                iconName="ellipsis"
                variant="secondary"
                size="lg"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                aria-label="More options"
              />
              {isMoreMenuOpen && (
                <div className={styles.moreMenuDropdown}>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      onShare?.();
                      setIsMoreMenuOpen(false);
                    }}
                  >
                    <Icon name="link" width={20} height={20} />
                    <span>Share</span>
                  </button>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      onDuplicate?.();
                      setIsMoreMenuOpen(false);
                    }}
                  >
                    <Icon name="duplicate" width={20} height={20} />
                    <span>Duplicate</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {mode === 'lists-overview' && (
          <>
            <Button onClick={onAddList}>Add List</Button>
            {viewMode && onViewModeChange && (
              <Button
                onClick={() => onViewModeChange(viewMode === 'list' ? 'grid' : 'list')}
                iconName={viewMode === 'list' ? 'grid' : 'list'}
              >
                {viewMode === 'list' ? 'Grid' : 'List'}
              </Button>
            )}
          </>
        )}

        {mode === 'shared-list' && (
          <Button
            variant={isSaved ? 'secondary' : 'primary'}
            onClick={isSaved ? undefined : onSaveToMyLists}
            disabled={isSaving || isSaved}
            iconName={isSaved ? 'checkmark' : undefined}
          >
            {isSaving ? (
              <>
                <span className={styles.spinner} />
                Saving...
              </>
            ) : isSaved ? (
              'Saved to my lists'
            ) : (
              'Save to my lists'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
