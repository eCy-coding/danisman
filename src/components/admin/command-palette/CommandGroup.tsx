/**
 * M1 — CommandGroup: renders a single category group within the Command palette
 */
import React from 'react';
import { CommandGroup as CmdkGroup, CommandItem } from 'cmdk';
import type { CommandDef } from '../../../lib/command-registry';

export interface CommandGroupProps {
  heading: string;
  commands: CommandDef[];
  onSelect: (cmd: CommandDef) => void;
}

export const CommandGroup: React.FC<CommandGroupProps> = ({ heading, commands, onSelect }) => {
  if (commands.length === 0) return null;

  return (
    <CmdkGroup heading={heading}>
      {commands.map((cmd) => (
        <CommandItem
          key={cmd.id}
          value={`${cmd.label} ${cmd.labelEn ?? ''} ${(cmd.keywords ?? []).join(' ')}`}
          onSelect={() => onSelect(cmd)}
          className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer text-slate-300 data-[selected=true]:bg-secondary/10 data-[selected=true]:text-white rounded-lg mx-1 transition-colors"
        >
          <span className="flex-1 truncate">{cmd.label}</span>
          {cmd.path && (
            <span className="text-[10px] text-slate-600 font-mono truncate max-w-[120px]">
              {cmd.path}
            </span>
          )}
        </CommandItem>
      ))}
    </CmdkGroup>
  );
};
