
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"
import type { UserRoutines, SubmissionSkill } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Replace, Sparkles } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { getOptimizedDeductionsAction } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface SubmitRoutineDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userRoutines: UserRoutines;
  onSave: (submission: any) => void;
}

const skillSchema = z.object({
  id: z.string(), // Unique ID for the field array
  name: z.string(),
  value: z.coerce.number().or(z.literal('')),
  deduction: z.union([z.coerce.number().min(0, "Deduction must be positive"), z.literal('N/A'), z.literal('')]),
});

const formSchema = z.object({
  skills: z.array(skillSchema),
  stuckDismount: z.boolean().default(false).optional(),
});

export function SubmitRoutineDialog({
  isOpen,
  onOpenChange,
  userRoutines,
  onSave,
}: SubmitRoutineDialogProps) {
  const [selectedEvent, setSelectedEvent] = useState<string | undefined>();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any | null>(null);
  
  const availableEvents = Object.keys(userRoutines).filter(key => userRoutines[key].length > 0);

  const { alternateSkills } = useMemo(() => {
    if (!selectedEvent || !userRoutines[selectedEvent]) {
      return { alternateSkills: [] };
    }
    const allSkills = userRoutines[selectedEvent];
    const skillCount = selectedEvent === 'VT' ? 2 : 8;
    return {
      alternateSkills: allSkills.slice(skillCount),
    };
  }, [selectedEvent, userRoutines]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { skills: [], stuckDismount: false },
  });

  const { fields, replace, update, getValues } = useFieldArray({
    control: form.control,
    name: "skills",
  });
  
  const resetRoutineToOriginal = (event: string | undefined) => {
    form.reset({ skills: [], stuckDismount: false });
    setAiSuggestions(null);
    if (event) {
      const routineSkills = userRoutines[event] || [];
      const skillCount = event === 'VT' ? 2 : 8;
      const initialSkills = routineSkills.slice(0, skillCount);

      const newSkills = initialSkills.map((skill, index) => ({
        id: `${skill.name}-${index}`, // Simple unique ID
        name: skill.name,
        value: skill.value,
        deduction: 'N/A',
      }));
      replace(newSkills);
    } else {
        replace([]);
    }
  }
  
  useEffect(() => {
    resetRoutineToOriginal(selectedEvent);
  }, [selectedEvent, userRoutines, replace]);
  
  useEffect(() => {
    if (isOpen) {
      // If an event is already selected, reset the routine. Otherwise, wait for user to select an event.
      if (selectedEvent) {
        resetRoutineToOriginal(selectedEvent);
      }
    } else {
      // Reset event selection when dialog closes to ensure a fresh state next time
      setSelectedEvent(undefined);
    }
  }, [isOpen]);

  const handleSwapSkill = (index: number, newSkill: { name: string, value: number | '' }) => {
    const currentSkill = fields[index];
    update(index, {
        ...currentSkill,
        name: newSkill.name,
        value: newSkill.value,
        deduction: 'N/A', // Reset deduction on swap
    });
  };
  
  const handleOptimize = async () => {
    if (!selectedEvent) return;

    const currentSkills = getValues('skills').map((skill, index) => ({
        ...skill,
        isDismount: (index === 7 && selectedEvent !== 'VT') || skill.name.toLowerCase().includes('dismount'),
    })).filter(s => s.deduction !== '' && s.deduction !== 'N/A')
    .map(({ id, ...rest }) => ({
        ...rest,
        value: Number(rest.value),
        deduction: Number(rest.deduction)
    })) as SubmissionSkill[];
    
    if (currentSkills.length === 0) {
      setAiSuggestions({ error: "Please enter at least one deduction to get suggestions."});
      return;
    }

    setIsOptimizing(true);
    setAiSuggestions(null);
    try {
        const result = await getOptimizedDeductionsAction(currentSkills, selectedEvent);
        setAiSuggestions(result);
    } catch (error) {
        setAiSuggestions({ error: "An unexpected error occurred." });
    } finally {
        setIsOptimizing(false);
    }
  };


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!selectedEvent) return;
    
    // Filter to only include skills where a deduction was entered.
    const skillsToSave = values.skills
      .map((skill, index) => ({
        ...skill,
        isDismount:
          (index === 7 && selectedEvent !== 'VT') ||
          skill.name.toLowerCase().includes('dismount'),
      }))
      .filter(s => s.deduction !== '' && s.deduction !== 'N/A')
      .map(({id, ...rest}) => ({
          ...rest,
          value: Number(rest.value),
          deduction: Number(rest.deduction)
      })) as SubmissionSkill[];

    // A routine is complete if it has the required number of skills and every displayed skill has a deduction.
    const requiredSkillCount = selectedEvent === 'VT' ? 2 : 8;
    const allDeductionsFilled = values.skills.every(s => s.deduction !== '' && s.deduction !== 'N/A');
    const isComplete = fields.length >= requiredSkillCount && allDeductionsFilled;
      
    const submission = {
        event: selectedEvent,
        timestamp: new Date().toISOString(),
        isComplete,
        skills: skillsToSave,
        stuckDismount: values.stuckDismount,
    };
    onSave(submission);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Routine</DialogTitle>
          <DialogDescription>
            Enter deductions for the submitted routine. Use the swap button to substitute skills.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-select-submit">Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger id="event-select-submit">
                <SelectValue placeholder="Select an event to submit" />
              </SelectTrigger>
              <SelectContent>
                {availableEvents.length > 0 ? (
                    availableEvents.map(event => (
                        <SelectItem key={event} value={event}>
                            {event}
                        </SelectItem>
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">No routines created yet.</div>
                )}
              </SelectContent>
            </Select>
          </div>
            
          {selectedEvent && (
            <ScrollArea className="h-72 pr-4">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id}>
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
                    <Label>{field.name}</Label>
                    <Input className="w-24" value={field.value} readOnly disabled placeholder="Value"/>
                    <Controller
                      control={form.control}
                      name={`skills.${index}.deduction`}
                      render={({ field: controllerField, fieldState }) => {
                        const { value, ...restField } = controllerField;
                        return (
                        <div className="w-28">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Deduction"
                          value={value === 'N/A' ? '' : value}
                          onFocus={(e) => {
                            if (e.target.value === 'N/A' || value === 'N/A') {
                                form.setValue(`skills.${index}.deduction`, '');
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                                form.setValue(`skills.${index}.deduction`, 'N/A');
                            }
                          }}
                          {...restField}
                        />
                         {fieldState.error && <p className="text-destructive text-sm mt-1">{fieldState.error.message}</p>}
                        </div>
                      )}}
                    />
                    {alternateSkills.length > 0 ? (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="ghost" size="icon">
                                    <Replace className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2">
                                <p className="text-xs text-muted-foreground p-2">Swap with alternate skill:</p>
                                {alternateSkills.map((altSkill) => (
                                    <Button
                                        key={altSkill.name}
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={() => handleSwapSkill(index, altSkill)}
                                    >
                                        {altSkill.name}
                                    </Button>
                                ))}
                            </PopoverContent>
                        </Popover>
                    ) : ( <div className="w-10" />) /* Placeholder for alignment */ }
                    {index === 7 && selectedEvent !== 'VT' && (
                        <Controller
                            control={form.control}
                            name="stuckDismount"
                            render={({ field }) => (
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`stick-checkbox-${index}`}
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    <Label htmlFor={`stick-checkbox-${index}`} className="text-sm font-normal">
                                        Stick?
                                    </Label>
                                </div>
                            )}
                        />
                    )}
                  </div>
                </div>
              ))}
            </div>
            </ScrollArea>
          )}

           {selectedEvent && (
                <div className="space-y-4">
                    <Button type="button" variant="outline" onClick={handleOptimize} disabled={isOptimizing} className="w-full">
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isOptimizing ? 'Analyzing...' : 'Optimize with AI'}
                    </Button>
                    {aiSuggestions && (
                        <Alert variant={aiSuggestions.error ? 'destructive' : 'default'}>
                            <AlertTitle>{aiSuggestions.error ? 'Error' : 'AI Suggestions'}</AlertTitle>
                            <AlertDescription>
                                {aiSuggestions.error ? (
                                    <p>{aiSuggestions.error}</p>
                                ) : (
                                    <ul className="list-disc pl-5 space-y-1">
                                        {aiSuggestions.suggestions?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                    </ul>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
           )}

          <DialogFooter>
            <Button type="submit" disabled={!selectedEvent}>Submit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
