import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles, Cpu, Zap, Shield, Globe } from 'lucide-react';
import { AVAILABLE_MODELS } from '../data/models';
import { AIModel } from '../types';

interface ModelSelectorDropdownProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelectorDropdown: React.FC<ModelSelectorDropdownProps> = ({
  selectedModel,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const providers: { key: string; label: string; color: string }[] = [
    { key: 'google', label: 'Google Gemini', color: 'text-[#00f3ff]' },
    { key: 'openai', label: 'OpenAI (ChatGPT)', color: 'text-emerald-400' },
    { key: 'anthropic', label: 'Anthropic (Claude)', color: 'text-amber-400' },
    { key: 'deepseek', label: 'DeepSeek AI', color: 'text-blue-400' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="model-selector-dropdown-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-black/90 hover:bg-black text-xs font-semibold text-neutral-100 border border-[#00f3ff]/40 hover:border-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.15)] hover:shadow-[0_0_16px_rgba(0,243,255,0.3)] transition-all duration-200 cursor-pointer outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="w-2 h-2 rounded-full bg-[#00f3ff] shadow-[0_0_6px_#00f3ff] animate-pulse" />
        <span className="tracking-wide text-white">{currentModel.name}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#00f3ff] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 sm:w-80 rounded-2xl bg-[#000000]/95 backdrop-blur-2xl border border-[#00f3ff]/40 shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_20px_rgba(0,243,255,0.2)] p-2 z-50 animate-fade-in divide-y divide-neutral-900 overflow-hidden">
          {providers.map((prov) => {
            const modelsInProv = AVAILABLE_MODELS.filter((m) => m.provider === prov.key);
            if (modelsInProv.length === 0) return null;

            return (
              <div key={prov.key} className="py-1.5 first:pt-0 last:pb-0">
                <div className="px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider font-bold flex items-center justify-between">
                  <span className={prov.color}>{prov.label}</span>
                </div>

                <div className="space-y-1 mt-0.5">
                  {modelsInProv.map((model) => {
                    const isSelected = model.id === selectedModel;
                    return (
                      <button
                        key={model.id}
                        id={`model-opt-${model.id.replace('/', '-')}`}
                        type="button"
                        onClick={() => {
                          onSelectModel(model.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-950 border border-[#00f3ff]/60 shadow-[0_0_10px_rgba(0,243,255,0.2)] text-white'
                            : 'hover:bg-neutral-950/80 border border-transparent hover:border-[#00f3ff]/20 text-neutral-300 hover:text-white'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold">{model.name}</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md border ${model.badgeColor} bg-black/60`}
                            >
                              {model.badge}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 truncate mt-0.5">
                            {model.description}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-[#00f3ff]/20 border border-[#00f3ff] flex items-center justify-center text-[#00f3ff]">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
