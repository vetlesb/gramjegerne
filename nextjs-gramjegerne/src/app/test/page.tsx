'use client';

export default function Test() {
  return (
    <div
      className="bg-red-500"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: 'calc(100vh + env(keyboard-inset-height, 0px))',
      }}
    >
      Test
    </div>
  );
}
