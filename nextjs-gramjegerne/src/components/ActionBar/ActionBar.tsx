'use client';

import {useState, useRef, useEffect} from 'react';
import {Button, IconButton} from '@/components/Button';
import {Icon} from '@/components/Icon';
import {useLanguage} from '@/i18n/LanguageProvider';
import styles from './ActionBar.module.scss';

interface ActionBarProps {
  mode: 'gear' | 'list' | 'lists-overview' | 'trips-overview' | 'shared-list';

  // Shared props (gear & list modes)
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  sortBy?: 'name' | 'weight-low' | 'weight-high' | 'calories';
  onSortChange?: (sortBy: 'name' | 'weight-low' | 'weight-high' | 'calories') => void;

  // Gear mode props
  onAddGear?: () => void;
  onManageCategories?: () => void;
  onExcel?: () => void;

  // List mode props (packing list detail)
  onAddToList?: () => void;
  onShare?: () => void;
  onViewMap?: () => void;
  connectedMapName?: string;

  // Lists overview mode props
  onAddList?: () => void;

  // Trips overview mode props
  onAddTrip?: () => void;

  // Shared list mode props
  onSaveToMyLists?: () => void;
  isSaved?: boolean;
  isSaving?: boolean;

  // Back-to-trip button (used in list and shared-list modes)
  onBackToTrip?: () => void;
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
  onViewMap,
  connectedMapName,
  sortBy = 'name',
  onSortChange,
  onAddList,
  onAddTrip,
  onSaveToMyLists,
  isSaved,
  isSaving,
  onBackToTrip,
}: ActionBarProps) {
  const {t} = useLanguage();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };

    if (isMoreMenuOpen || isSortMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen, isSortMenuOpen]);

  const sortMenuItems = (
    <>
      <button className={styles.menuItem} onClick={() => { onSortChange?.('name'); setIsSortMenuOpen(false); }}>
        <span>{t.sort.az}{sortBy === 'name' && ' ✓'}</span>
      </button>
      <button className={styles.menuItem} onClick={() => { onSortChange?.('weight-low'); setIsSortMenuOpen(false); }}>
        <span>{t.sort.weightLow}{sortBy === 'weight-low' && ' ✓'}</span>
      </button>
      <button className={styles.menuItem} onClick={() => { onSortChange?.('weight-high'); setIsSortMenuOpen(false); }}>
        <span>{t.sort.weightHigh}{sortBy === 'weight-high' && ' ✓'}</span>
      </button>
      <button className={styles.menuItem} onClick={() => { onSortChange?.('calories'); setIsSortMenuOpen(false); }}>
        <span>{t.sort.calories}{sortBy === 'calories' && ' ✓'}</span>
      </button>
    </>
  );

  const sortDropdown = onSortChange && (
    <div className={styles.sortMenu} ref={sortMenuRef}>
      <Button iconName="chevrondown" onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}>
        {t.sort.label}
      </Button>
      {isSortMenuOpen && (
        <div className={styles.sortMenuDropdown}>
          {sortMenuItems}
        </div>
      )}
    </div>
  );

  const viewModeButton = viewMode && onViewModeChange && (
    <Button
      onClick={() => onViewModeChange(viewMode === 'list' ? 'grid' : 'list')}
      iconName={viewMode === 'list' ? 'grid' : 'list'}
    >
      {viewMode === 'list' ? t.viewMode.grid : t.viewMode.list}
    </Button>
  );

  const mobileSortItems = onSortChange && (
    <>
      <button className={styles.menuItem} onClick={() => { onSortChange('name'); setIsMoreMenuOpen(false); }}>
        <Icon name="menu" width={20} height={20} />
        <span>{t.sort.az}{sortBy === 'name' && ' ✓'}</span>
      </button>
      <button className={styles.menuItem} onClick={() => { onSortChange('weight-low'); setIsMoreMenuOpen(false); }}>
        <Icon name="weight" width={20} height={20} />
        <span>{t.sort.weightLow}{sortBy === 'weight-low' && ' ✓'}</span>
      </button>
      <button className={styles.menuItem} onClick={() => { onSortChange('weight-high'); setIsMoreMenuOpen(false); }}>
        <Icon name="weight" width={20} height={20} />
        <span>{t.sort.weightHigh}{sortBy === 'weight-high' && ' ✓'}</span>
      </button>
      <button className={styles.menuItem} onClick={() => { onSortChange('calories'); setIsMoreMenuOpen(false); }}>
        <Icon name="calories" width={20} height={20} />
        <span>{t.sort.calories}{sortBy === 'calories' && ' ✓'}</span>
      </button>
    </>
  );

  const backToTripButton = onBackToTrip && <Button onClick={onBackToTrip}>{t.actions.back}</Button>;

  const sharedListButtons = (
    <>
      {backToTripButton}
      <Button
        onClick={isSaved ? undefined : onSaveToMyLists}
        disabled={isSaving || isSaved}
        iconName={isSaved ? 'checkmark' : undefined}
      >
        {isSaving ? (
          <>
            <span className={styles.spinner} />
            {t.actions.saving}
          </>
        ) : isSaved ? (
          t.lists.savedToMyLists
        ) : (
          t.lists.saveToMyLists
        )}
      </Button>
    </>
  );

  return (
    <div className={styles.actionBar}>
      {/* Desktop: All buttons visible */}
      <div className={styles.desktopGroup}>
        {mode === 'gear' && (
          <>
            <Button onClick={onAddGear}>{t.gear.addGear}</Button>
            <Button onClick={onManageCategories}>{t.gear.categories}</Button>
            <Button onClick={onExcel}>{t.gear.excel}</Button>
            {viewModeButton}
            {sortDropdown}
          </>
        )}

        {mode === 'list' && (
          <>
            {backToTripButton}
            <Button onClick={onAddToList}>{t.gear.addGear}</Button>
            {onViewMap && (
              <Button
                onClick={onViewMap}
                title={connectedMapName ? `${connectedMapName}` : t.nav.maps}
              >
                {t.nav.maps}
              </Button>
            )}
            <Button onClick={onShare}>{t.actions.share}</Button>
            {sortDropdown}
          </>
        )}

        {mode === 'lists-overview' && (
          <>
            <Button onClick={onAddList}>{t.lists.addList}</Button>
            {viewModeButton}
          </>
        )}

        {mode === 'trips-overview' && (
          <>
            <Button onClick={onAddTrip}>{t.trips.addTrip}</Button>
            {onManageCategories && (
              <Button onClick={onManageCategories}>{t.gear.categories}</Button>
            )}
            {viewModeButton}
          </>
        )}

        {mode === 'shared-list' && sharedListButtons}
      </div>

      {/* Mobile: Primary action + More menu */}
      <div className={styles.mobileGroup}>
        {mode === 'gear' && (
          <>
            <Button onClick={onAddGear}>{t.actions.add}</Button>
            <div className={styles.moreMenu} ref={moreMenuRef}>
              <IconButton
                iconName="ellipsis"
                variant="secondary"
                size="lg"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                aria-label={t.actions.edit}
              />
              {isMoreMenuOpen && (
                <div className={styles.moreMenuDropdown}>
                  <button
                    className={styles.menuItem}
                    onClick={() => { onManageCategories?.(); setIsMoreMenuOpen(false); }}
                  >
                    <Icon name="menu" width={20} height={20} />
                    <span>{t.gear.categories}</span>
                  </button>
                  <button
                    className={styles.menuItem}
                    onClick={() => { onExcel?.(); setIsMoreMenuOpen(false); }}
                  >
                    <Icon name="document" width={20} height={20} />
                    <span>{t.gear.excel}</span>
                  </button>
                  {viewMode && onViewModeChange && (
                    <button
                      className={styles.menuItem}
                      onClick={() => { onViewModeChange(viewMode === 'list' ? 'grid' : 'list'); setIsMoreMenuOpen(false); }}
                    >
                      <Icon name={viewMode === 'list' ? 'grid' : 'list'} width={20} height={20} />
                      <span>{viewMode === 'list' ? t.viewMode.grid : t.viewMode.list}</span>
                    </button>
                  )}
                  {mobileSortItems}
                </div>
              )}
            </div>
          </>
        )}

        {mode === 'list' && (
          <>
            <Button onClick={onAddToList}>{t.gear.addGear}</Button>
            <div className={styles.moreMenu} ref={moreMenuRef}>
              <IconButton
                iconName="ellipsis"
                variant="secondary"
                size="lg"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                aria-label={t.actions.edit}
              />
              {isMoreMenuOpen && (
                <div className={styles.moreMenuDropdown}>
                  {onViewMap && (
                    <button
                      className={styles.menuItem}
                      onClick={() => { onViewMap(); setIsMoreMenuOpen(false); }}
                    >
                      <Icon name="location" width={20} height={20} />
                      <span>{t.nav.maps}</span>
                    </button>
                  )}
                  <button
                    className={styles.menuItem}
                    onClick={() => { onShare?.(); setIsMoreMenuOpen(false); }}
                  >
                    <Icon name="link" width={20} height={20} />
                    <span>{t.actions.share}</span>
                  </button>
                  {mobileSortItems}
                </div>
              )}
            </div>
          </>
        )}

        {mode === 'lists-overview' && (
          <>
            <Button onClick={onAddList}>{t.lists.addList}</Button>
            {viewModeButton}
          </>
        )}

        {mode === 'trips-overview' && (
          <>
            <Button onClick={onAddTrip}>{t.trips.addTrip}</Button>
            {onManageCategories && (
              <Button onClick={onManageCategories}>{t.gear.categories}</Button>
            )}
            {viewModeButton}
          </>
        )}

        {mode === 'shared-list' && sharedListButtons}
      </div>
    </div>
  );
}
