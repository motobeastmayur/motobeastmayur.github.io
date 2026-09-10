import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Cpu } from 'lucide-react';
import { AVAILABLE_MODELS } from '../data/models';

interface ModelSelectorDropdownProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  variant?: 'header' | 'input';
  theme?: 'dark' | 'light';
}

export const ModelSelectorDropdown: React.FC<ModelSelectorDropdownProps> = ({
  selectedModel,
  onSelectModel,
  variant = 'header',
  theme = 'dark',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

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
    { key: 'google', label: 'Google Intelligence', color: 'text-violet-500' },
    { key: 'openai', label: 'OpenAI (ChatGPT)', color: 'text-emerald-500' },
    { key: 'anthropic', label: 'Anthropic (Claude)', color: 'text-amber-500' },
    { key: 'deepseek', label: 'DeepSeek AI', color: 'text-sky-500' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id={variant === 'header' ? 'model-selector-dropdown-btn' : 'input-model-selector-dropdown-btn'}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer outline-none border ${
          isLight
            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 shadow-sm'
            : 'bg-[#141022] hover:bg-[#1a142c] text-neutral-200 border-white/[0.08] hover:border-violet-500/40'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Cpu className="w-3.5 h-3.5 text-violet-500" />
        <span className={`tracking-wide font-medium ${isLight ? 'text-slate-800' : 'text-neutral-100'}`}>
          {currentModel.name}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isLight ? 'text-slate-500' : 'text-neutral-400'
          } ${isOpen ? 'rotate-180 text-violet-500' : ''}`}
        />
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div
          className={`absolute ${
            variant === 'input' ? 'bottom-full mb-2 left-0' : 'top-full mt-2 left-0'
          } w-72 sm:w-80 rounded-2xl border shadow-2xl p-2 z-50 animate-fade-in divide-y overflow-hidden ${
            isLight
              ? 'bg-white/98 backdrop-blur-2xl border-slate-200 divide-slate-100 text-slate-800'
              : 'bg-[#0c0918]/98 backdrop-blur-2xl border-white/[0.1] divide-white/[0.06] text-white'
          }`}
        >
          {providers.map((prov) => {
            const modelsInProv = AVAILABLE_MODELS.filter((m) => m.provider === prov.key);
            if (modelsInProv.length === 0) return null;

            return (
              <div key={prov.key} className="py-1.5 first:pt-0.5 last:pb-0.5">
                <div
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 flex items-center gap-1.5 ${
                    isLight ? 'text-slate-500' : 'text-neutral-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-violet-600' : 'bg-violet-400'}`} />
                  <span>{prov.label}</span>
                </div>

                <div className="space-y-0.5 mt-0.5">
                  {modelsInProv.map((model) => {
                    const isSelected = model.id === selectedModel;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          onSelectModel(model.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? isLight
                              ? 'bg-violet-50 text-violet-800 border border-violet-200'
                              : 'bg-[#1e1538] text-white border border-violet-500/40'
                            : isLight
                            ? 'hover:bg-slate-100 text-slate-700'
                            : 'hover:bg-white/[0.06] text-neutral-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium">{model.name}</span>
                            {model.badge && (
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                  isLight
                                    ? 'bg-slate-100 text-slate-500'
                                    : 'bg-white/[0.06] text-neutral-400'
                                }`}
                              >
                                {model.badge}
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-[10px] truncate leading-tight mt-0.5 ${
                              isLight ? 'text-slate-500' : 'text-neutral-400'
                            }`}
                          >
                            {model.description}
                          </p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />}
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
