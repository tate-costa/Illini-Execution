
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EVENTS } from '@/lib/constants';
import type { AppData } from '@/lib/types';
import { subDays, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';

interface DeductionBreakdownDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  allUsersData: AppData;
  selectedUserId: string | undefined;
  selectedUserName: string | undefined;
}

type UserScope = 'currentUser' | 'allUsers';
type ViewMode = 'breakdown' | 'comparison';

export function DeductionBreakdownDialog({
  isOpen,
  onOpenChange,
  allUsersData,
  selectedUserId,
  selectedUserName,
}: DeductionBreakdownDialogProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('breakdown');
  const [selectedEvent, setSelectedEvent] = useState(EVENTS[0]);
  const [userScope, setUserScope] = useState<UserScope>('currentUser');
  const [useTimeFilter, setUseTimeFilter] = useState(true);
  const [timeFilterDays, setTimeFilterDays] = useState(30);
  const [selectedSkill, setSelectedSkill] = useState<string | undefined>();
  const [compareDismounts, setCompareDismounts] = useState(false);

  const cutoffDate = useMemo(() => {
    return useTimeFilter ? subDays(new Date(), timeFilterDays) : null;
  }, [useTimeFilter, timeFilterDays]);
  
  const allSkillsInEvent = useMemo(() => {
     if (viewMode !== 'comparison') return [];
     const skillSet = new Set<string>();
      for (const userId in allUsersData) {
        const userData = allUsersData[userId];
        let eventSubmissions = userData.submissions.filter(sub => sub.event === selectedEvent);
        if (cutoffDate) {
          eventSubmissions = eventSubmissions.filter(sub => isAfter(new Date(sub.timestamp), cutoffDate));
        }
        for (const submission of eventSubmissions) {
          for (const skill of submission.skills) {
            skillSet.add(skill.name);
          }
        }
      }
      const skills = Array.from(skillSet).sort();
      // Reset selected skill if it's not in the new list
      if (skills.length > 0 && !skills.includes(selectedSkill || '')) {
        setSelectedSkill(skills[0]);
      } else if (skills.length === 0) {
        setSelectedSkill(undefined);
      }
      return skills;
  }, [viewMode, allUsersData, selectedEvent, cutoffDate, selectedSkill]);


  const chartData = useMemo(() => {
    if (viewMode === 'breakdown') {
      const skillDeductions: Record<string, number[]> = {};
      const userIdsToProcess =
        userScope === 'currentUser' && selectedUserId
          ? [selectedUserId]
          : Object.keys(allUsersData);
          
      for (const userId of userIdsToProcess) {
        const userData = allUsersData[userId];
        if (!userData) continue;

        let eventSubmissions = userData.submissions.filter(sub => sub.event === selectedEvent);
        if (cutoffDate) {
          eventSubmissions = eventSubmissions.filter(sub => isAfter(new Date(sub.timestamp), cutoffDate));
        }
        for (const submission of eventSubmissions) {
          for (const skill of submission.skills) {
            if (typeof skill.deduction === 'number') {
              if (!skillDeductions[skill.name]) skillDeductions[skill.name] = [];
              skillDeductions[skill.name].push(skill.deduction);
            }
          }
        }
      }

      const averages = Object.entries(skillDeductions).map(([name, deductions]) => {
        const sum = deductions.reduce((a, b) => a + b, 0);
        const average = sum / deductions.length;
        return { name, averageDeduction: parseFloat(average.toFixed(2)) };
      });

      return averages.sort((a, b) => b.averageDeduction - a.averageDeduction);
    } else { // Comparison mode
        const userDeductions: Record<string, {name: string, deductions: number[], skillName?: string}> = {};

        for (const userId in allUsersData) {
            const userData = allUsersData[userId];
            const userName = userData.userName;
            if (!userName) continue;

            let eventSubmissions = userData.submissions.filter(sub => sub.event === selectedEvent);
            if (cutoffDate) {
                eventSubmissions = eventSubmissions.filter(sub => isAfter(new Date(sub.timestamp), cutoffDate));
            }

            for (const submission of eventSubmissions) {
                if (compareDismounts) {
                    submission.skills.forEach((skill, index) => {
                        const isDismount = skill.name.toLowerCase().includes('dismount') || index === 7;
                        if (isDismount && typeof skill.deduction === 'number') {
                            if (!userDeductions[userId]) {
                                userDeductions[userId] = { name: userName, deductions: [], skillName: skill.name };
                            }
                            userDeductions[userId].deductions.push(skill.deduction);
                            userDeductions[userId].skillName = skill.name; 
                        }
                    });
                } else {
                    if (!selectedSkill) continue;
                    for (const skill of submission.skills) {
                        if (skill.name === selectedSkill && typeof skill.deduction === 'number') {
                            if (!userDeductions[userId]) userDeductions[userId] = { name: userName, deductions: [] };
                            userDeductions[userId].deductions.push(skill.deduction);
                        }
                    }
                }
            }
        }
        
        const comparisonAverages = Object.values(userDeductions).map(({name, deductions, skillName}) => {
            if (deductions.length === 0) return null;
            const sum = deductions.reduce((a, b) => a + b, 0);
            const average = sum / deductions.length;
            const displayName = skillName ? `${name} (${skillName})` : name;
            return { name: displayName, averageDeduction: parseFloat(average.toFixed(2)) };
        }).filter(item => item !== null) as { name: string, averageDeduction: number }[];

        return comparisonAverages.sort((a, b) => b.averageDeduction - a.averageDeduction);
    }
  }, [viewMode, selectedEvent, userScope, allUsersData, selectedUserId, cutoffDate, selectedSkill, compareDismounts]);
  
  // Effect to reset skill selection when event changes
  useEffect(() => {
    if(viewMode === 'comparison' && allSkillsInEvent.length > 0) {
        setSelectedSkill(allSkillsInEvent[0]);
    } else {
        setSelectedSkill(undefined);
    }
  }, [selectedEvent, allSkillsInEvent, viewMode]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Analyze Deductions</DialogTitle>
          <DialogDescription>
            Explore average deductions by skill, or compare performance across users.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="breakdown">Overall Breakdown</TabsTrigger>
                <TabsTrigger value="comparison">Skill Comparison</TabsTrigger>
            </TabsList>
            <TabsContent value="breakdown">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4">
                    <div className="md:col-span-1 space-y-6">
                        {/* Filters */}
                        <div className="space-y-2">
                          <Label htmlFor="event-filter-breakdown">Event</Label>
                          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                            <SelectTrigger id="event-filter-breakdown">
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
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                             <Label htmlFor="time-filter-switch-breakdown">All Time</Label>
                             <Switch
                               id="time-filter-switch-breakdown"
                               checked={!useTimeFilter}
                               onCheckedChange={(checked) => setUseTimeFilter(!checked)}
                             />
                           </div>
                           {useTimeFilter && (
                             <div className="space-y-2">
                               <Label>Past {timeFilterDays} Days</Label>
                               <Slider
                                value={[timeFilterDays]}
                                onValueChange={(value) => setTimeFilterDays(value[0])}
                                min={1}
                                max={90}
                                step={1}
                              />
                             </div>
                           )}
                        </div>
                        <div className="space-y-2">
                            <Label>Data Scope</Label>
                            <RadioGroup
                            value={userScope}
                            onValueChange={(value: string) => setUserScope(value as UserScope)}
                            >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="currentUser" id="r1" disabled={!selectedUserId} />
                                <Label htmlFor="r1">{selectedUserName || 'Current User'}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="allUsers" id="r2" />
                                <Label htmlFor="r2">All Users</Label>
                            </div>
                            </RadioGroup>
                        </div>
                    </div>
                    <div className="md:col-span-3 h-96">
                        {/* Chart */}
                        {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={150}
                                tick={{ fontSize: 12 }}
                                style={{
                                    overflow: 'visible',
                                    whiteSpace: 'nowrap',
                                  }}
                            />
                            <Tooltip
                                contentStyle={{
                                background: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                                }}
                                cursor={{ fill: 'hsl(var(--muted))' }}
                            />
                            <Bar dataKey="averageDeduction" name="Avg. Deduction" fill="hsl(var(--primary))">
                                <LabelList dataKey="averageDeduction" position="right" style={{ fill: 'hsl(var(--foreground))' }} />
                            </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            No data available for this selection.
                        </div>
                        )}
                    </div>
                 </div>
            </TabsContent>
            <TabsContent value="comparison">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4">
                    <div className="md:col-span-1 space-y-6">
                        {/* Filters */}
                         <div className="space-y-2">
                          <Label htmlFor="event-filter-comparison">Event</Label>
                          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                            <SelectTrigger id="event-filter-comparison">
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
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                             <Label htmlFor="dismount-switch">Compare Dismounts</Label>
                             <Switch
                               id="dismount-switch"
                               checked={compareDismounts}
                               onCheckedChange={setCompareDismounts}
                             />
                           </div>
                           <div className="space-y-2">
                              <Label htmlFor="skill-filter-comparison" className={cn(compareDismounts && "text-muted-foreground")}>Skill</Label>
                               <Select value={selectedSkill} onValueChange={setSelectedSkill} disabled={allSkillsInEvent.length === 0 || compareDismounts}>
                                <SelectTrigger id="skill-filter-comparison">
                                  <SelectValue placeholder="Select a skill" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allSkillsInEvent.map(skill => (
                                    <SelectItem key={skill} value={skill}>
                                      {skill}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                             <Label htmlFor="time-filter-switch-comparison">All Time</Label>
                             <Switch
                               id="time-filter-switch-comparison"
                               checked={!useTimeFilter}
                               onCheckedChange={(checked) => setUseTimeFilter(!checked)}
                             />
                           </div>
                           {useTimeFilter && (
                             <div className="space-y-2">
                               <Label>Past {timeFilterDays} Days</Label>
                               <Slider
                                value={[timeFilterDays]}
                                onValueChange={(value) => setTimeFilterDays(value[0])}
                                min={1}
                                max={90}
                                step={1}
                              />
                             </div>
                           )}
                        </div>
                    </div>
                    <div className="md:col-span-3 h-96">
                        {/* Chart */}
                         {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 'dataMax + 0.1']} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={150}
                                tick={{ fontSize: 12 }}
                                style={{
                                    overflow: 'visible',
                                    whiteSpace: 'nowrap',
                                  }}
                            />
                            <Tooltip
                                contentStyle={{
                                background: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                                }}
                                cursor={{ fill: 'hsl(var(--muted))' }}
                            />
                            <Bar dataKey="averageDeduction" name="Avg. Deduction" fill="hsl(var(--primary))">
                                <LabelList dataKey="averageDeduction" position="right" style={{ fill: 'hsl(var(--foreground))' }} />
                            </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            {selectedSkill || compareDismounts ? 'No data available for this selection.' : 'Please select a skill to compare.'}
                        </div>
                        )}
                    </div>
                </div>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

    