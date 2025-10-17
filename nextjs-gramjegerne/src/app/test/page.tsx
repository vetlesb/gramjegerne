'use client';

import {AnimatedIconToggle} from '@/components/AnimatedIconToggle';

export default function Test() {
  const handleToggle = (isToggled: boolean) => {
    console.log('Icon toggled:', isToggled);
  };

  return (
    <div
      className="bg-primary"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: 'calc(100vh + env(keyboard-inset-height, 0px))',
        padding: '50px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <h2 className="text-primary">Animated Icon Toggle Examples</h2>

      {/* Basic clothing toggle */}
      <AnimatedIconToggle startIcon="clothing" endIcon="clothingfilled" onClick={handleToggle} />

      {/* Different icons and sizes */}
      <AnimatedIconToggle
        startIcon="clothing"
        endIcon="clothingfilled"
        baseSize={24}
        growSize={28}
        containerSize={32}
        onClick={(isToggled) => console.log('Equipment toggled:', isToggled)}
      />
    </div>
  );
}
