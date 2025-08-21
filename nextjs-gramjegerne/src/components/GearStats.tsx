interface GearStatsProps {
  items: Item[];
}

interface Item {
  _id: string;
  name: string;
  size?: string;
  weight?: {weight: number; unit: string};
  price?: number;
}

export function GearStats({items}: GearStatsProps) {
  const totals = items.reduce(
    (acc, item) => {
      const weight = item.weight?.weight || 0;
      const price = item.price || 0;

      return {
        totalWeight: acc.totalWeight + weight,
        totalPrice: acc.totalPrice + price,
        totalItems: acc.totalItems + 1,
      };
    },
    {totalWeight: 0, totalPrice: 0, totalItems: 0},
  );

  const formatWeight = (weightInGrams: number): string => {
    const weightInKg = weightInGrams / 1000;
    return `${weightInKg.toFixed(3)} kg`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
    }).format(price);
  };

  return (
    <div className="product-category items-center grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-x-3">
      <div className="flex items-center gap-x-2 text-sm sm:text-lg fg-accent">
        <p>{totals.totalItems} items</p>
      </div>
      <div className="flex items-center gap-x-2 text-sm sm:text-lg fg-accent">
        <p>{formatWeight(totals.totalWeight)}</p>
      </div>
      <div className="flex items-center gap-x-2 text-sm sm:text-lg fg-accent">
        <p>{formatPrice(totals.totalPrice)}</p>
      </div>
    </div>
  );
}
