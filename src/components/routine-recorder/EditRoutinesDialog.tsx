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
import { EVENTS } from '@/lib/constants';
import type { UserRoutines, Skill } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { PlusCircle, Trash2 } from 'lucide-react';

interface EditRoutinesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userRoutines: UserRoutines;
  onSave: (event: string, routines: UserRoutines) => void;
}

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required.'),
  value: z.coerce.number().min(0, 'Value must be positive').optional().or(z.literal('')),
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

  const { fields, replace, append, remove } = useFieldArray({
    control: form.control,
    name: "skills",
  });
  
  useEffect(() => {
    const existingSkills = userRoutines[selectedEvent] || [];
    if (existingSkills.length > 0) {
      replace(existingSkills);
    } else {
      const initialSkillCount = selectedEvent === 'VT' ? 2 : 8;
      const defaultSkills = Array.from({ length: initialSkillCount }, (_, i) => ({
        name: `Skill ${i + 1}`,
        value: '',
      }));
      replace(defaultSkills);
    }
  }, [selectedEvent, userRoutines, replace]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const updatedRoutines = { ...userRoutines };
    updatedRoutines[selectedEvent] = values.skills.filter(skill => skill.name && skill.value !== '');
    onSave(selectedEvent, updatedRoutines);
  };
  
  const addSkill = () => {
    append({ name: '', value: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Routines</DialogTitle>
          <DialogDescription>
            Select an event, name your skills, and enter their values.
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
                <div key={field.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-start">
                  <Controller
                    control={form.control}
                    name={`skills.${index}.name`}
                    render={({ field: nameField, fieldState }) => (
                      <div>
                        <Input
                          placeholder={`Skill ${index + 1} Name`}
                          {...nameField}
                        />
                        {fieldState.error && <p className="text-destructive text-sm mt-1">{fieldState.error.message}</p>}
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name={`skills.${index}.value`}
                    render={({ field: valueField, fieldState }) => (
                       <div className="w-24">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Value"
                          {...valueField}
                        />
                        {fieldState.error && <p className="text-destructive text-sm mt-1">{fieldState.error.message}</p>}
                      </div>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
               <Button type="button" variant="outline" onClick={addSkill} className="w-full mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
              </Button>
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
