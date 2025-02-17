import React from 'react';
import {AddIcon} from './icons/AddIcon';
import {CaloriesIcon} from './icons/CaloriesIcon';
import {CategoryIcon} from './icons/CategoryIcon';
import {ChevronDownIcon} from './icons/ChevronDownIcon';
import {ChevronUpIcon} from './icons/ChevronUpIcon';
import {CloseIcon} from './icons/CloseIcon';
import {DeleteIcon} from './icons/DeleteIcon';
import {DocumentIcon} from './icons/DocumentIcon';
import {EditIcon} from './icons/EditIcon';
import {EllipsisIcon} from './icons/EllipsisIcon';
import {LeafIcon} from './icons/LeafIcon';
import {LinkIcon} from './icons/LinkIcon';
import {LogOutIcon} from './icons/LogOutIcon';
import {MenuIcon} from './icons/MenuIcon';
import {SizeIcon} from './icons/SizeIcon';
import {TreeIcon} from './icons/TreeIcon';
import {WaterIcon} from './icons/WaterIcon';
import {WeightIcon} from './icons/WeightIcon';
import {UserIcon} from './icons/UserIcon';
import {CalendarIcon} from './icons/CalendarIcon';
// Import other icons as needed

// Define a mapping from icon names to components
const iconMap = {
  add: AddIcon,
  delete: DeleteIcon,
  edit: EditIcon,
  chevrondown: ChevronDownIcon,
  chevronup: ChevronUpIcon,
  close: CloseIcon,
  size: SizeIcon,
  weight: WeightIcon,
  calories: CaloriesIcon,
  logout: LogOutIcon,
  category: CategoryIcon,
  document: DocumentIcon,
  link: LinkIcon,
  menu: MenuIcon,
  ellipsis: EllipsisIcon,
  water: WaterIcon,
  leaf: LeafIcon,
  tree: TreeIcon,
  user: UserIcon,
  calendar: CalendarIcon,
};

type IconName = keyof typeof iconMap;

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
}

export function Icon({name, ...props}: IconProps) {
  const IconComponent = iconMap[name];
  if (!IconComponent) {
    return null; // Or render a default icon or placeholder
  }
  return <IconComponent {...props} />;
}
