'use client';

import {useWeight} from '@/contexts/WeightContext';
import Link from 'next/link';

interface LogoProps {
  className?: string;
}

export function Logo({className}: LogoProps = {}) {
  const {weight} = useWeight();
  console.log('Logo weight:', weight); // Debug log

  // Calculate font weight based on total weight
  let fontWeight = 400; // default weight

  if (weight) {
    if (weight > 4000) fontWeight = 800;
    else if (weight > 3000) fontWeight = 700;
    else if (weight > 2000) fontWeight = 600;
    else if (weight > 1000) fontWeight = 500;
  }

  console.log('Calculated fontWeight:', fontWeight); // Debug log

  return (
    <Link href="/" className={`logo ${className || ''}`}>
      <h1
        style={{
          fontWeight: fontWeight,
          transition: 'font-weight 0.3s ease',
        }}
        className="text-2xl text-accent"
      >
        gramjegerne
      </h1>
    </Link>
  );
}
