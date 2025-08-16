import React, { useEffect, useState } from 'react';

interface AnimatedChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  type?: 'pie' | 'donut' | 'bar';
  size?: number;
  animate?: boolean;
}

export const AnimatedChart: React.FC<AnimatedChartProps> = ({
  data,
  type = 'donut',
  size = 200,
  animate = true
}) => {
  const [animatedData, setAnimatedData] = useState(
    data.map(item => ({ ...item, animatedValue: 0 }))
  );

  useEffect(() => {
    if (!animate) {
      setAnimatedData(data.map(item => ({ ...item, animatedValue: item.value })));
      return;
    }

    const timer = setTimeout(() => {
      setAnimatedData(data.map(item => ({ ...item, animatedValue: item.value })));
    }, 100);

    return () => clearTimeout(timer);
  }, [data, animate]);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - 10;
  const innerRadius = type === 'donut' ? radius * 0.6 : 0;
  const center = size / 2;

  let currentAngle = -90; // Start from top

  const createPath = (startAngle: number, endAngle: number, outerRadius: number, innerRadius: number) => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = center + outerRadius * Math.cos(startAngleRad);
    const y1 = center + outerRadius * Math.sin(startAngleRad);
    const x2 = center + outerRadius * Math.cos(endAngleRad);
    const y2 = center + outerRadius * Math.sin(endAngleRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    if (innerRadius === 0) {
      // Pie chart
      return `M ${center} ${center} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    } else {
      // Donut chart
      const x3 = center + innerRadius * Math.cos(endAngleRad);
      const y3 = center + innerRadius * Math.sin(endAngleRad);
      const x4 = center + innerRadius * Math.cos(startAngleRad);
      const y4 = center + innerRadius * Math.sin(startAngleRad);

      return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
    }
  };

  if (type === 'bar') {
    const maxValue = Math.max(...data.map(item => item.value));
    const barWidth = (size - 40) / data.length - 10;
    const chartHeight = size - 60;

    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="overflow-visible">
          {animatedData.map((item, index) => {
            const barHeight = (item.animatedValue / maxValue) * chartHeight;
            const x = 20 + index * (barWidth + 10);
            const y = size - 40 - barHeight;

            return (
              <g key={item.label}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.color}
                  className="transition-all duration-1000 ease-out"
                  rx={4}
                />
                <text
                  x={x + barWidth / 2}
                  y={size - 20}
                  textAnchor="middle"
                  className="text-xs fill-slate-400"
                >
                  {item.label}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-xs fill-slate-300 font-medium"
                >
                  {item.value}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {animatedData.map((item, index) => {
          const percentage = item.animatedValue / total;
          const angle = percentage * 360;
          const endAngle = currentAngle + angle;

          const path = createPath(currentAngle, endAngle, radius, innerRadius);
          currentAngle = endAngle;

          return (
            <path
              key={item.label}
              d={path}
              fill={item.color}
              className="transition-all duration-1000 ease-out hover:opacity-80 cursor-pointer"
              style={{
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
              }}
            />
          );
        })}
        
        {/* Center text for donut chart */}
        {type === 'donut' && (
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-lg font-bold fill-slate-200 transform rotate-90"
            style={{ transformOrigin: `${center}px ${center}px` }}
          >
            {total}%
          </text>
        )}
      </svg>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-slate-300">
              {item.label}: {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnimatedChart;

