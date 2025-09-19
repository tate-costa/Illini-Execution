'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EVENTS, getSkillNamesForEvent } from '@/lib/constants';
import type { UserRoutines, Routine } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

interface EditRoutinesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userRoutines: UserRoutines;
  onSave: (event: string, routines: UserRoutines) => void;
}

const skillSchema = z.object({
  name: z.string(),
  value: z.coerce.number().min(0, "Value must be positive").optional().or(z.literal('')),
});

const formSchema = z.object({
  skills: z.array(skillSchema),
});

export function EditRoutinesDialog({
  isOpen,
  onOpenChange,
  userRoutines,
  onSave,
}: EditRoutinesDialogProps) {
  const [selectedEvent, setSelectedEvent] = useState(EVENTS[0]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      skills: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "skills",
  });
  
  useEffect(() => {
    const skillNames = getSkillNamesForEvent(selectedEvent);
    const existingSkills = userRoutines[selectedEvent] || [];

    const newSkills = skillNames.map(name => {
      const existing = existingSkills.find(s => s.name === name);
      return { name, value: existing ? existing.value : '' };
    });
    replace(newSkills);
  }, [selectedEvent, userRoutines, replace]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const updatedRoutines = { ...userRoutines };
    updatedRoutines[selectedEvent] = values.skills.filter(skill => skill.value !== '');
    onSave(selectedEvent, updatedRoutines);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Routines</DialogTitle>
          <DialogDescription>
            Select an event and enter the values for each skill.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-select">Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger id="event-select">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {EVENTS.map(event => (
                  <SelectItem key={event} value={event}>
                    {event}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-72 pr-4">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-2 gap-4 items-center">
                  <Label htmlFor={`skills.${index}.value`}>{field.name}</Label>
                  <Controller
                    control={form.control}
                    name={`skills.${index}.value`}
                    render={({ field, fieldState }) => (
                      <div>
                        <Input
                          id={`skills.${index}.value`}
                          type="number"
                          step="0.1"
                          placeholder="Value"
                          {...field}
                        />
                        {fieldState.error && <p className="text-destructive text-sm mt-1">{fieldState.error.message}</p>}
                      </div>
                    )}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
