'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Globe, Utensils, Flame, Clock, Sparkles } from 'lucide-react';
import {
  CourseTypes,
  DishForms,
  CookingMethods,
  CulinaryRegions,
  FlavorProfiles,
  DietaryTags,
  ContextualTags,
  AromaticBases,
  SpiceSignatures,
  type CulinaryClassification,
  getCourseDisplayName,
  getDishFormDisplayName,
  getRegionDisplayName,
} from '@/types/culinary-taxonomy';

interface ClassificationSelectorProps {
  value: CulinaryClassification;
  onChange: (classification: CulinaryClassification) => void;
  collapsible?: boolean;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
};

const Chip: React.FC<{
  label: string;
  value: string;
  selected: boolean;
  onClick: () => void;
}> = ({ label, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
      selected
        ? 'bg-blue-500 text-white shadow-sm'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {label}
  </button>
);

export const ClassificationSelector: React.FC<ClassificationSelectorProps> = ({
  value,
  onChange,
  collapsible = true,
}) => {
  const handleCourseToggle = (course: string) => {
    onChange({
      ...value,
      course: value.course === course ? undefined : course as any,
    });
  };

  const handleDishFormToggle = (form: string) => {
    onChange({
      ...value,
      dishForm: value.dishForm === form ? undefined : form as any,
    });
  };

  const handleMethodToggle = (method: string) => {
    const methods = value.cookingMethod || [];
    const newMethods = methods.includes(method as any)
      ? methods.filter(m => m !== method)
      : [...methods, method as any];
    onChange({
      ...value,
      cookingMethod: newMethods.length > 0 ? newMethods : undefined,
    });
  };

  const handleRegionToggle = (region: string) => {
    const regions = value.region || [];
    const newRegions = regions.includes(region as any)
      ? regions.filter(r => r !== region)
      : [...regions, region as any];
    onChange({
      ...value,
      region: newRegions.length > 0 ? newRegions : undefined,
    });
  };

  const handleFlavorToggle = (flavor: string) => {
    const flavors = value.flavorProfiles || [];
    const newFlavors = flavors.includes(flavor as any)
      ? flavors.filter(f => f !== flavor)
      : [...flavors, flavor as any];
    onChange({
      ...value,
      flavorProfiles: newFlavors.length > 0 ? newFlavors : undefined,
    });
  };

  const handleDietaryToggle = (tag: string) => {
    const tags = value.dietaryTags || [];
    const newTags = tags.includes(tag as any)
      ? tags.filter(t => t !== tag)
      : [...tags, tag as any];
    onChange({
      ...value,
      dietaryTags: newTags.length > 0 ? newTags : undefined,
    });
  };

  const handleContextToggle = (tag: string) => {
    const tags = value.contextualTags || [];
    const newTags = tags.includes(tag as any)
      ? tags.filter(t => t !== tag)
      : [...tags, tag as any];
    onChange({
      ...value,
      contextualTags: newTags.length > 0 ? newTags : undefined,
    });
  };

  const handleAromaticBaseToggle = (base: string) => {
    onChange({
      ...value,
      aromaticBase: value.aromaticBase === base ? undefined : base as any,
    });
  };

  const handleSpiceSignatureToggle = (signature: string) => {
    onChange({
      ...value,
      spiceSignature: value.spiceSignature === signature ? undefined : signature as any,
    });
  };

  const SectionWrapper = collapsible ? Section : 'div' as any;
  const sectionProps = collapsible ? {} : { className: 'space-y-4 p-4 border rounded-lg' };

  return (
    <div className="space-y-4">
      {/* Course / Meal Stage */}
      <SectionWrapper
        title="Course & Meal Stage"
        icon={<Clock className="w-4 h-4" />}
        defaultOpen={true}
        {...sectionProps}
      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(CourseTypes).map(([key, courseValue]) => (
            <Chip
              key={key}
              label={getCourseDisplayName(courseValue)}
              value={courseValue}
              selected={value.course === courseValue}
              onClick={() => handleCourseToggle(courseValue)}
            />
          ))}
        </div>
      </SectionWrapper>

      {/* Dish Form / Architecture */}
      <SectionWrapper
        title="Dish Architecture"
        icon={<Utensils className="w-4 h-4" />}
        {...sectionProps}
      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(DishForms).map(([key, val]) => (
            <Chip
              key={key}
              label={getDishFormDisplayName(val)}
              value={val}
              selected={value.dishForm === val}
              onClick={() => handleDishFormToggle(val)}
            />
          ))}
        </div>
      </SectionWrapper>

      {/* Cooking Methods */}
      <SectionWrapper
        title="Cooking Methods"
        icon={<Flame className="w-4 h-4" />}
        {...sectionProps}
      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(CookingMethods).map(([key, method]) => (
            <Chip
              key={key}
              label={method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              value={method}
              selected={value.cookingMethod?.includes(method) || false}
              onClick={() => handleMethodToggle(method)}
            />
          ))}
        </div>
      </SectionWrapper>

      {/* Culinary Regions */}
      <SectionWrapper
        title="Culinary Traditions"
        icon={<Globe className="w-4 h-4" />}
        {...sectionProps}
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Europe</h4>
            <div className="flex flex-wrap gap-2">
              {['french', 'italian', 'spanish', 'german', 'british', 'eastern_european', 'balkans', 'russian'].map(region => (
                <Chip
                  key={region}
                  label={getRegionDisplayName(region as any)}
                  value={region}
                  selected={value.region?.includes(region as any) || false}
                  onClick={() => handleRegionToggle(region)}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Middle East & Africa</h4>
            <div className="flex flex-wrap gap-2">
              {['middle_eastern', 'levantine', 'north_african', 'west_african', 'east_african', 'southern_african'].map(region => (
                <Chip
                  key={region}
                  label={getRegionDisplayName(region as any)}
                  value={region}
                  selected={value.region?.includes(region as any) || false}
                  onClick={() => handleRegionToggle(region)}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Asia</h4>
            <div className="flex flex-wrap gap-2">
              {['south_asian', 'indian', 'chinese', 'japanese', 'korean', 'thai', 'vietnamese', 'filipino', 'southeast_asian'].map(region => (
                <Chip
                  key={region}
                  label={getRegionDisplayName(region as any)}
                  value={region}
                  selected={value.region?.includes(region as any) || false}
                  onClick={() => handleRegionToggle(region)}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Americas</h4>
            <div className="flex flex-wrap gap-2">
              {['mexican', 'central_american', 'south_american', 'caribbean', 'cajun', 'southwestern', 'pacific_northwest', 'southern_us'].map(region => (
                <Chip
                  key={region}
                  label={getRegionDisplayName(region as any)}
                  value={region}
                  selected={value.region?.includes(region as any) || false}
                  onClick={() => handleRegionToggle(region)}
                />
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Flavor Profiles */}
      <SectionWrapper
        title="Flavor Profile"
        icon={<Sparkles className="w-4 h-4" />}
        {...sectionProps}
      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(FlavorProfiles).map(([key, flavor]) => (
            <Chip
              key={key}
              label={flavor.replace(/_/g, '-').replace(/\b\w/g, l => l.toUpperCase())}
              value={flavor}
              selected={value.flavorProfiles?.includes(flavor) || false}
              onClick={() => handleFlavorToggle(flavor)}
            />
          ))}
        </div>
      </SectionWrapper>

      {/* Aromatic Bases */}
      <SectionWrapper
        title="Aromatic Foundations"
        icon={<Sparkles className="w-4 h-4" />}
        {...sectionProps}
      >
        <div className="space-y-3">
          {Object.entries(AromaticBases).map(([key, base]) => (
            <div
              key={key}
              onClick={() => handleAromaticBaseToggle(key)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                value.aromaticBase === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{base.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{base.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {base.ingredients.map(ing => (
                      <span key={ing} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {ing.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* Spice Signatures */}
      <SectionWrapper
        title="Spice Signatures"
        icon={<Sparkles className="w-4 h-4" />}
        {...sectionProps}
      >
        <div className="space-y-3">
          {Object.entries(SpiceSignatures).map(([key, sig]) => (
            <div
              key={key}
              onClick={() => handleSpiceSignatureToggle(key)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                value.spiceSignature === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{sig.name}</h4>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < sig.heatLevel ? 'text-red-500' : 'text-gray-300'}>
                        🌶️
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{sig.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {sig.spices.map(spice => (
                    <span key={spice} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {spice.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* Dietary Tags */}
      <SectionWrapper
        title="Dietary Preferences"
        icon={<Utensils className="w-4 h-4" />}
        {...sectionProps}
      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(DietaryTags).map(([key, tag]) => (
            <Chip
              key={key}
              label={tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              value={tag}
              selected={value.dietaryTags?.includes(tag) || false}
              onClick={() => handleDietaryToggle(tag)}
            />
          ))}
        </div>
      </SectionWrapper>

      {/* Context Tags */}
      <SectionWrapper
        title="Context & Occasion"
        icon={<Clock className="w-4 h-4" />}
        {...sectionProps}
      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(ContextualTags).map(([key, tag]) => (
            <Chip
              key={key}
              label={tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              value={tag}
              selected={value.contextualTags?.includes(tag) || false}
              onClick={() => handleContextToggle(tag)}
            />
          ))}
        </div>
      </SectionWrapper>
    </div>
  );
};