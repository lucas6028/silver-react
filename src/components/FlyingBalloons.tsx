import React from 'react';
import { Balloon } from './Balloon';

export interface FlyingBalloon {
  id: string;
  color: string;
  left?: number; // percentage
  size?: number; // px
  duration?: number; // seconds
  delay?: number; // seconds
}

interface Props {
  balloons: FlyingBalloon[];
  onComplete?: (id: string) => void;
}

export const FlyingBalloons: React.FC<Props> = ({ balloons, onComplete }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-[999] overflow-hidden">
      {balloons.map((b) => {
        const left = b.left ?? Math.floor(Math.random() * 80) + 10; // 10% to 90%
        const size = b.size ?? 36;
        const duration = b.duration ?? (4 + Math.random() * 3); // 4-7s
        const delay = b.delay ?? Math.random() * 0.6; // small stagger

        return (
          <div
            key={b.id}
            style={{
              position: 'fixed',
              left: `${left}%`,
              bottom: '-10vh',
              width: size,
              height: size * 1.3,
              transformOrigin: 'center bottom',
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
            className="animate-float-up"
            onAnimationEnd={() => onComplete && onComplete(b.id)}
          >
            <Balloon color={b.color} size={size} />
          </div>
        );
      })}
    </div>
  );
};
