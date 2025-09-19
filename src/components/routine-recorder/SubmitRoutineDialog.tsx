
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
import { getOptimizedDeductions } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Replace } from 'lucide-react';
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
});

export function SubmitRoutineDialog({
  isOpen,
  onOpenChange,
  userRoutines,
  onSave,
}: SubmitRoutineDialogProps) {
  const [selectedEvent, setSelectedEvent] = useState<string | undefined>();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizations, setOptimizations] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  const availableEvents = Object.keys(userRoutines).filter(key => userRoutines[key].length > 0);

  const { primarySkills, alternateSkills } = useMemo(() => {
    if (!selectedEvent || !userRoutines[selectedEvent]) {
      return { primarySkills: [], alternateSkills: [] };
    }
    const allSkills = userRoutines[selectedEvent];
    const skillCount = selectedEvent === 'VT' ? 2 : 8;
    return {
      primarySkills: allSkills.slice(0, skillCount),
      alternateSkills: allSkills.slice(skillCount),
    };
  }, [selectedEvent, userRoutines]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { skills: [] },
  });

  const { fields, replace, update } = useFieldArray({
    control: form.control,
    name: "skills",
  });
  
  useEffect(() => {
    if (selectedEvent) {
      const routineSkills = userRoutines[selectedEvent] || [];
      const skillCount = selectedEvent === 'VT' ? 2 : 8;
      const initialSkills = routineSkills.slice(0, skillCount);

      const newSkills = initialSkills.map((skill, index) => ({
        id: `${skill.name}-${index}`, // Simple unique ID
        name: skill.name,
        value: skill.value,
        deduction: 'N/A',
      }));
      replace(newSkills);
      setOptimizations({});
    } else {
        replace([]);
    }
  }, [selectedEvent, userRoutines, replace]);

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
    setIsOptimizing(true);
    setOptimizations({});
    try {
      const currentSkills = form.getValues().skills;
      const result = await getOptimizedDeductions(selectedEvent, currentSkills);
      
      if(result.optimizedSkills.length === 0) {
        toast({ title: "No optimizations available", description: "Your routine is already looking good or has no deductions to optimize." });
        return;
      }

      const newOptimizations: Record<string, string> = {};
      result.optimizedSkills.forEach(optSkill => {
        const index = currentSkills.findIndex(s => s.name === optSkill.skill);
        if (index !== -1) {
          form.setValue(`skills.${index}.deduction`, optSkill.deduction);
          form.setValue(`skills.${index}.value`, optSkill.value);
          newOptimizations[optSkill.skill] = optSkill.explanation;
        }
      });
      setOptimizations(newOptimizations);
      toast({ title: "Routine Optimized!", description: "AI suggestions have been applied to your routine." });
    } catch (error) {
      toast({ variant: 'destructive', title: "Optimization Failed", description: "Could not get AI optimizations. Please try again." });
    } finally {
      setIsOptimizing(false);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!selectedEvent) return;
    
    // Filter to only include skills where a deduction was entered.
    const skillsToSave = values.skills
      .filter(s => s.deduction !== '' && s.deduction !== undefined && s.deduction !== null && s.deduction !== 'N/A')
      .map(({id, ...rest}) => ({
          ...rest,
          deduction: Number(rest.deduction)
      })) as SubmissionSkill[];

    // A routine is complete if it has the required number of skills and every displayed skill has a deduction.
    const requiredSkillCount = selectedEvent === 'VT' ? 2 : 8;
    const hasAllSkills = values.skills.length >= requiredSkillCount;
    const allDeductionsFilled = values.skills.every(s => s.deduction !== '' && s.deduction !== undefined && s.deduction !== null && s.deduction !== 'N/A');
    const isComplete = hasAllSkills && allDeductionsFilled;
      
    const submission = {
        event: selectedEvent,
        timestamp: new Date().toISOString(),
        isComplete,
        skills: skillsToSave,
    };
    onSave(submission);
    form.reset();
    setSelectedEvent(undefined);
    setOptimizations({});
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
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
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
                            if (e.target.value === 'N/A') {
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
                    {alternateSkills.length > 0 && (
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
                    )}
                  </div>
                  {optimizations[field.name] && (
                     <Alert className="mt-2 bg-primary/10 border-primary/20">
                       <Sparkles className="h-4 w-4 text-primary" />
                       <AlertTitle className="text-primary font-semibold">AI Suggestion</AlertTitle>
                       <AlertDescription className="text-primary/80">
                         {optimizations[field.name]}
                       </AlertDescription>
                     </Alert>
                  )}
                </div>
              ))}
            </div>
            </ScrollArea>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={handleOptimize} disabled={isOptimizing || !selectedEvent}>
              {isOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
              Optimize with AI
            </Button>
            <Button type="submit" disabled={!selectedEvent}>Submit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    