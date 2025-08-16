import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface SparklyEffectsProps {
  trigger: boolean;
  type?: 'success' | 'celebration' | 'assignment' | 'completion';
  message?: string;
}

export function SparklyEffects({ trigger, type = 'success', message }: SparklyEffectsProps) {
  useEffect(() => {
    if (!trigger) return;

    const triggerEffect = () => {
      switch (type) {
        case 'success':
          // Green confetti burst
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
          });
          break;
          
        case 'celebration':
          // Rainbow celebration
          const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
            colors: colors,
            shapes: ['star', 'circle', 'square']
          });
          break;
          
        case 'assignment':
          // Blue sparkles for assignments
          confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.7 },
            colors: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
            gravity: 0.6,
            drift: 0.1
          });
          break;
          
        case 'completion':
          // Gold completion effect
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'],
            shapes: ['star']
          });
          break;
      }
    };

    triggerEffect();
  }, [trigger, type]);

  return null;
}

// Utility function to trigger confetti programmatically
export const triggerSparkly = (type: 'success' | 'celebration' | 'assignment' | 'completion' = 'success') => {
  const colors = {
    success: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
    celebration: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
    assignment: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
    completion: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A']
  };

  confetti({
    particleCount: type === 'celebration' ? 150 : 100,
    spread: type === 'celebration' ? 100 : 70,
    origin: { y: 0.6 },
    colors: colors[type],
    shapes: type === 'completion' ? ['star'] : ['circle', 'square']
  });
};