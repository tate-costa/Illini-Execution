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
import type { UserRoutines, SubmissionSkill } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { getOptimizedDeductions } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface SubmitRoutineDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userRoutines: UserRoutines;
  onSave: (submission: any) => void;
}

const skillSchema = z.object({
  name: z.string(),
  value: z.coerce.number().or(z.literal('')),
  deduction: z.coerce.number().min(0, "Deduction must be positive").optional().or(z.literal('')),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { skills: [] },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "skills",
  });
  
  useEffect(() => {
    if (selectedEvent) {
      const routineSkills = userRoutines[selectedEvent] || [];
      const newSkills = routineSkills.map(skill => ({
        name: skill.name,
        value: skill.value,
        deduction: '',
      }));
      replace(newSkills);
      setOptimizations({});
    } else {
        replace([]);
    }
  }, [selectedEvent, userRoutines, replace]);

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
    
    // A routine is complete if every skill in the form has a deduction value.
    const isComplete = values.skills.every(s => s.deduction !== '' && s.deduction !== undefined);

    // Only save the skills that have a deduction entered.
    const skillsToSave = values.skills
      .filter(s => s.deduction !== '' && s.deduction !== undefined) as SubmissionSkill[];

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
      <DialogContent className="sm:max-w-[425px] md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Submit Routine</DialogTitle>
          <DialogDescription>
            Enter deductions for the submitted routine.
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
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <Label>{field.name}</Label>
                    <Input value={field.value} readOnly disabled placeholder="Value"/>
                    <Controller
                      control={form.control}
                      name={`skills.${index}.deduction`}
                      render={({ field: controllerField, fieldState }) => (
                        <div>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Deduction"
                          {...controllerField}
                        />
                         {fieldState.error && <p className="text-destructive text-sm mt-1">{fieldState.error.message}</p>}
                        </div>
                      )}
                    />
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
