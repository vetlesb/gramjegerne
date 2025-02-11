interface TotalCalculationsProps {
  items: Item[];
}
interface Item {
  _id: string;
  name: string;
  size?: string;
  weight?: {weight: number; unit: string};
  quantity?: number;
  calories?: number;
}

export function TotalCalculations({items}: TotalCalculationsProps) {
  const totals = items.reduce(
    (acc, item) => {
      const weight = item.weight?.weight || 0;
      const calories = item.calories || 0;
      const quantity = item.quantity || 1;

      return {
        totalWeight: acc.totalWeight + weight * quantity,
        totalCalories: acc.totalCalories + calories * quantity,
        totalItems: acc.totalItems + quantity,
      };
    },
    {totalWeight: 0, totalCalories: 0, totalItems: 0},
  );

  return (
    <div className="grid grid-cols-3 gap-4 bg-dimmed p-4 rounded-lg">
      <div>
        <h3 className="text-sm text-gray-600">Total vekt</h3>
        <p className="text-lg font-bold">{totals.totalWeight}g</p>
      </div>
      <div>
        <h3 className="text-sm text-gray-600">Total kalorier</h3>
        <p className="text-lg font-bold">{totals.totalCalories} kcal</p>
      </div>
      <div>
        <h3 className="text-sm text-gray-600">Antall gjenstander</h3>
        <p className="text-lg font-bold">{totals.totalItems}</p>
      </div>
    </div>
  );
}
