import React from "react";
import { AddIcon } from "./icons/AddIcon";
import { DeleteIcon } from "./icons/DeleteIcon";
import { EditIcon } from "./icons/EditIcon";
import { ChevronDownIcon } from "./icons/ChevronDownIcon";
import { ChevronUpIcon } from "./icons/ChevronUpIcon";
import { CloseIcon } from "./icons/CloseIcon";
import { SizeIcon } from "./icons/SizeIcon";
import { WeightIcon } from "./icons/WeightIcon";
import { CaloriesIcon } from "./icons/CaloriesIcon";
import { LogOutIcon } from "./icons/LogOutIcon";
import { CategoryIcon } from "./icons/CategoryIcon";
import { DocumentIcon } from "./icons/DocumentIcon";
import { LinkIcon } from "./icons/LinkIcon";
import { MenuIcon } from "./icons/MenuIcon";
import { EllipsisIcon } from "./icons/EllipsisIcon";
import { WaterIcon } from "./icons/WaterIcon";
import { LeafIcon } from "./icons/LeafIcon";
import { TreeIcon } from "./icons/TreeIcon";
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
};

type IconName = keyof typeof iconMap;

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
}

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const IconComponent = iconMap[name];
  if (!IconComponent) {
    return null; // Or render a default icon or placeholder
  }
  return <IconComponent {...props} />;
};

export default Icon;
