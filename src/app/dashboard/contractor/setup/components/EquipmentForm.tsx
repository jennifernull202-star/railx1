/**
 * THE RAIL EXCHANGE™ — Contractor Setup: Equipment Form
 * 
 * Step 5: Equipment and capabilities information.
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { InputField, TextareaField } from '@/components/forms';

interface EquipmentFormProps {
  formData: {
    equipment: {
      type: string;
      quantity: number;
      owned: boolean;
    }[];
    equipmentNotes: string;
  };
  onUpdate: (updates: Partial<EquipmentFormProps['formData']>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const EQUIPMENT_CATEGORIES = [
  {
    category: 'Track Equipment',
    items: [
      { id: 'tamper', label: 'Tamper' },
      { id: 'ballast-regulator', label: 'Ballast Regulator' },
      { id: 'tie-crane', label: 'Tie Crane' },
      { id: 'rail-saw', label: 'Rail Saw' },
      { id: 'tie-inserter', label: 'Tie Inserter/Extractor' },
      { id: 'spike-driver', label: 'Spike Driver' },
      { id: 'rail-drill', label: 'Rail Drill' },
      { id: 'track-liner', label: 'Track Liner' },
    ],
  },
  {
    category: 'Heavy Equipment',
    items: [
      { id: 'excavator', label: 'Excavator' },
      { id: 'bulldozer', label: 'Bulldozer' },
      { id: 'loader', label: 'Loader' },
      { id: 'crane', label: 'Crane' },
      { id: 'grader', label: 'Grader' },
      { id: 'dump-truck', label: 'Dump Truck' },
    ],
  },
  {
    category: 'On-Track Vehicles',
    items: [
      { id: 'hi-rail', label: 'Hi-Rail Vehicle' },
      { id: 'burro-crane', label: 'Burro Crane' },
      { id: 'speedswing', label: 'Speedswing' },
      { id: 'rail-truck', label: 'Rail Truck' },
      { id: 'rail-loader', label: 'Rail Loader' },
    ],
  },
  {
    category: 'Inspection Equipment',
    items: [
      { id: 'track-geometry-car', label: 'Track Geometry Car' },
      { id: 'ultrasonic-testing', label: 'Ultrasonic Testing Equipment' },
      { id: 'rail-profile-meter', label: 'Rail Profile Meter' },
      { id: 'drone', label: 'Drone/UAV' },
    ],
  },
  {
    category: 'Welding Equipment',
    items: [
      { id: 'thermite-welding', label: 'Thermite Welding Kit' },
      { id: 'flash-butt-welder', label: 'Flash Butt Welder' },
      { id: 'rail-grinder', label: 'Rail Grinder' },
    ],
  },
];

const EquipmentForm: React.FC<EquipmentFormProps> = ({
  formData,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  const toggleEquipment = (equipmentId: string) => {
    const existing = formData.equipment.find((e) => e.type === equipmentId);
    
    if (existing) {
      // Remove if exists
      onUpdate({
        equipment: formData.equipment.filter((e) => e.type !== equipmentId),
      });
    } else {
      // Add new equipment
      onUpdate({
        equipment: [
          ...formData.equipment,
          { type: equipmentId, quantity: 1, owned: true },
        ],
      });
    }
  };

  const updateEquipment = (equipmentId: string, updates: Partial<{ quantity: number; owned: boolean }>) => {
    onUpdate({
      equipment: formData.equipment.map((e) =>
        e.type === equipmentId ? { ...e, ...updates } : e
      ),
    });
  };

  const isSelected = (equipmentId: string) => {
    return formData.equipment.some((e) => e.type === equipmentId);
  };

  const getEquipmentData = (equipmentId: string) => {
    return formData.equipment.find((e) => e.type === equipmentId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-navy-900">Equipment & Capabilities</h3>
        <p className="text-sm text-text-secondary">
          List the equipment you have access to. This helps clients understand your capabilities.
        </p>
      </div>

      {/* Equipment Categories */}
      <div className="space-y-6">
        {EQUIPMENT_CATEGORIES.map((category) => (
          <div key={category.category} className="space-y-3">
            <h4 className="font-medium text-navy-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {category.category}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {category.items.map((item) => {
                const selected = isSelected(item.id);
                const data = getEquipmentData(item.id);

                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border transition-all ${
                      selected
                        ? 'border-rail-orange bg-rail-orange/5'
                        : 'border-border-default'
                    }`}
                  >
                    <label className="flex items-center gap-3 p-3 cursor-pointer">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleEquipment(item.id)}
                      />
                      <span className="text-sm text-navy-900">{item.label}</span>
                    </label>
                    
                    {selected && (
                      <div className="px-3 pb-3 flex items-center gap-4 border-t border-border-light pt-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-text-secondary">Qty:</label>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={data?.quantity || 1}
                            onChange={(e) =>
                              updateEquipment(item.id, {
                                quantity: parseInt(e.target.value) || 1,
                              })
                            }
                            className="w-14 h-7 px-2 text-xs rounded border border-border-default focus:outline-none focus:ring-1 focus:ring-rail-orange"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={data?.owned ?? true}
                            onChange={(e) =>
                              updateEquipment(item.id, { owned: e.target.checked })
                            }
                            className="w-3.5 h-3.5 rounded text-rail-orange focus:ring-rail-orange"
                          />
                          Owned
                        </label>
                        <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!(data?.owned ?? true)}
                            onChange={(e) =>
                              updateEquipment(item.id, { owned: !e.target.checked })
                            }
                            className="w-3.5 h-3.5 rounded text-rail-orange focus:ring-rail-orange"
                          />
                          Rented/Leased
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Additional Notes */}
      <div className="space-y-3">
        <TextareaField
          label="Additional Equipment & Notes"
          value={formData.equipmentNotes}
          onChange={(e) => onUpdate({ equipmentNotes: e.target.value })}
          placeholder="List any additional equipment, specialized capabilities, or notes about your equipment fleet..."
          rows={4}
          hint="Optional — describe any equipment not listed above or special capabilities"
        />
      </div>

      {/* Equipment Summary */}
      {formData.equipment.length > 0 && (
        <div className="p-4 bg-surface-secondary rounded-lg">
          <h4 className="text-sm font-medium text-navy-900 mb-2">Equipment Summary</h4>
          <div className="flex flex-wrap gap-2">
            {formData.equipment.map((eq) => {
              const label = EQUIPMENT_CATEGORIES
                .flatMap((c) => c.items)
                .find((i) => i.id === eq.type)?.label || eq.type;
              
              return (
                <span
                  key={eq.type}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded text-xs text-navy-900"
                >
                  {label}
                  {eq.quantity > 1 && (
                    <span className="text-text-tertiary">×{eq.quantity}</span>
                  )}
                  {!eq.owned && (
                    <span className="text-rail-orange">(R)</span>
                  )}
                </span>
              );
            })}
          </div>
          <p className="text-xs text-text-tertiary mt-2">
            {formData.equipment.length} equipment type{formData.equipment.length !== 1 ? 's' : ''} selected
            {' • '}(R) = Rented/Leased
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <Button 
          type="submit" 
          className="bg-rail-orange hover:bg-rail-orange-dark"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            <>
              Complete Setup
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export { EquipmentForm };
