import React from "react";
import { AddIcon } from "./icons/AddIcon";
import { DeleteIcon } from "./icons/DeleteIcon";
import { EditIcon } from "./icons/EditIcon";
// Import other icons as needed

// Define a mapping from icon names to components
const iconMap = {
  add: AddIcon,
  delete: DeleteIcon,
  edit: EditIcon,
  // ... add other icons here
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
