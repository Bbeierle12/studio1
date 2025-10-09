'use client';

import React, { useMemo } from 'react';
import type { FlavorDimensions } from '@/types/culinary-taxonomy';

interface FlavorRadarProps {
  dimensions: FlavorDimensions;
  onChange?: (dimensions: FlavorDimensions) => void;
  size?: number;
  interactive?: boolean;
  showLabels?: boolean;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

const DIMENSIONS = [
  { key: 'spice', label: 'Spice 🌶️', color: '#EF4444' },
  { key: 'acid', label: 'Acid 🍋', color: '#EAB308' },
  { key: 'fat', label: 'Fat 🧈', color: '#F59E0B' },
  { key: 'umami', label: 'Umami 🍄', color: '#10B981' },
  { key: 'sweet', label: 'Sweet 🍯', color: '#EC4899' },
  { key: 'bitter', label: 'Bitter 🌿', color: '#8B5CF6' },
] as const;

export const FlavorRadar: React.FC<FlavorRadarProps> = ({
  dimensions,
  onChange,
  size = 300,
  interactive = false,
  showLabels = true,
  className = '',
}) => {
  const center = size / 2;
  const maxRadius = size * 0.4;
  const levels = 5;

  // Calculate points for each dimension
  const points = useMemo(() => {
    return DIMENSIONS.map((dim, i) => {
      const angle = (i * Math.PI * 2) / DIMENSIONS.length - Math.PI / 2;
      const value = dimensions[dim.key as keyof FlavorDimensions] || 0;
      const radius = (value / 5) * maxRadius;
      return {
        x: center + Math.cos(angle) * radius,
        y: center + Math.sin(angle) * radius,
      };
    });
  }, [dimensions, center, maxRadius]);

  // Create SVG path for the flavor profile polygon
  const profilePath = useMemo(() => {
    if (points.length === 0) return '';
    const pathPoints = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return `${pathPoints} Z`;
  }, [points]);

  // Create grid lines
  const gridLines = useMemo(() => {
    const lines = [];

    // Concentric circles for levels
    for (let level = 1; level <= levels; level++) {
      const radius = (level / levels) * maxRadius;
      lines.push(
        <circle
          key={`level-${level}`}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
          opacity="0.5"
        />
      );
    }

    // Spokes from center to each dimension
    DIMENSIONS.forEach((_, i) => {
      const angle = (i * Math.PI * 2) / DIMENSIONS.length - Math.PI / 2;
      const x = center + Math.cos(angle) * maxRadius;
      const y = center + Math.sin(angle) * maxRadius;
      lines.push(
        <line
          key={`spoke-${i}`}
          x1={center}
          y1={center}
          x2={x}
          y2={y}
          stroke="#E5E7EB"
          strokeWidth="1"
          opacity="0.5"
        />
      );
    });

    return lines;
  }, [center, maxRadius, levels]);

  // Handle click on dimension to adjust value
  const handleDimensionClick = (dimKey: string, event: React.MouseEvent<SVGCircleElement>) => {
    if (!interactive || !onChange) return;

    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;

    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const distance = Math.sqrt(
      Math.pow(clickX - center, 2) + Math.pow(clickY - center, 2)
    );

    const newValue = Math.min(5, Math.max(0, Math.round((distance / maxRadius) * 5)));

    onChange({
      ...dimensions,
      [dimKey]: newValue,
    });
  };

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="w-full h-full">
        {/* Background grid */}
        {gridLines}

        {/* Flavor profile polygon */}
        <path
          d={profilePath}
          fill="url(#flavorGradient)"
          fillOpacity="0.3"
          stroke="#3B82F6"
          strokeWidth="2"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="flavorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>

        {/* Dimension points */}
        {points.map((point, i) => {
          const dim = DIMENSIONS[i];
          return (
            <g key={dim.key}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill={dim.color}
                stroke="white"
                strokeWidth="2"
                className={interactive ? 'cursor-pointer' : ''}
                onClick={(e) => handleDimensionClick(dim.key, e)}
              />
              {interactive && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="12"
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={(e) => handleDimensionClick(dim.key, e)}
                />
              )}
            </g>
          );
        })}

        {/* Labels */}
        {showLabels && DIMENSIONS.map((dim, i) => {
          const angle = (i * Math.PI * 2) / DIMENSIONS.length - Math.PI / 2;
          const labelRadius = maxRadius + 30;
          const x = center + Math.cos(angle) * labelRadius;
          const y = center + Math.sin(angle) * labelRadius;

          return (
            <text
              key={`label-${dim.key}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm font-medium fill-gray-700"
            >
              {dim.label}
            </text>
          );
        })}

        {/* Value labels */}
        {showLabels && DIMENSIONS.map((dim, i) => {
          const angle = (i * Math.PI * 2) / DIMENSIONS.length - Math.PI / 2;
          const valueRadius = maxRadius + 15;
          const x = center + Math.cos(angle) * valueRadius;
          const y = center + Math.sin(angle) * valueRadius;
          const value = dimensions[dim.key as keyof FlavorDimensions] || 0;

          return (
            <text
              key={`value-${dim.key}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-gray-500"
            >
              {value}/5
            </text>
          );
        })}
      </svg>

      {/* Interactive sliders (alternative to clicking on chart) */}
      {interactive && (
        <div className="mt-4 space-y-2">
          {DIMENSIONS.map(dim => {
            const value = dimensions[dim.key as keyof FlavorDimensions] || 0;
            return (
              <div key={dim.key} className="flex items-center gap-3">
                <span className="text-sm font-medium w-20">{dim.label}</span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={value}
                  onChange={(e) => onChange?.({
                    ...dimensions,
                    [dim.key]: parseInt(e.target.value),
                  })}
                  className="flex-1"
                  style={{
                    accentColor: dim.color,
                  }}
                />
                <span className="text-sm text-gray-600 w-8 text-right">{value}/5</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Preset flavor profiles for quick selection
export const FLAVOR_PRESETS: Record<string, FlavorDimensions> = {
  balanced: { spice: 2, acid: 3, fat: 3, umami: 3, sweet: 2, bitter: 1 },
  spicyBold: { spice: 5, acid: 2, fat: 3, umami: 4, sweet: 1, bitter: 2 },
  freshLight: { spice: 1, acid: 4, fat: 1, umami: 2, sweet: 2, bitter: 3 },
  richComfort: { spice: 1, acid: 1, fat: 5, umami: 4, sweet: 3, bitter: 0 },
  sweetTangy: { spice: 0, acid: 4, fat: 2, umami: 1, sweet: 5, bitter: 1 },
  earthyHerbal: { spice: 2, acid: 2, fat: 2, umami: 3, sweet: 1, bitter: 4 },
  umamiRich: { spice: 2, acid: 2, fat: 3, umami: 5, sweet: 2, bitter: 1 },
};

interface FlavorPresetSelectorProps {
  onSelect: (dimensions: FlavorDimensions) => void;
  currentDimensions?: FlavorDimensions;
}

export const FlavorPresetSelector: React.FC<FlavorPresetSelectorProps> = ({
  onSelect,
  currentDimensions,
}) => {
  const presetNames: Record<string, string> = {
    balanced: 'Balanced',
    spicyBold: 'Spicy & Bold',
    freshLight: 'Fresh & Light',
    richComfort: 'Rich & Comforting',
    sweetTangy: 'Sweet & Tangy',
    earthyHerbal: 'Earthy & Herbal',
    umamiRich: 'Umami Rich',
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {Object.entries(FLAVOR_PRESETS).map(([key, dimensions]) => {
        const isSelected = currentDimensions &&
          JSON.stringify(dimensions) === JSON.stringify(currentDimensions);

        return (
          <button
            key={key}
            onClick={() => onSelect(dimensions)}
            className={`p-3 rounded-lg border text-sm transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <div className="font-medium">{presetNames[key]}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {DIMENSIONS.map(dim => {
                const value = dimensions[dim.key as keyof FlavorDimensions];
                if (value >= 3) {
                  return (
                    <span
                      key={dim.key}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${dim.color}20`, color: dim.color }}
                    >
                      {dim.label.split(' ')[0]}
                    </span>
                  );
                }
                return null;
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
};