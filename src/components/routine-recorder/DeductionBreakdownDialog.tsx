'use client';

import { useState, useMemo } from 'react';
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
import { EVENTS } from '@/lib/constants';
import type { AppData } from '@/lib/types';
import { subDays, isAfter } from 'date-fns';

interface DeductionBreakdownDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  allUsersData: AppData;
  selectedUserId: string | undefined;
}

type UserScope = 'currentUser' | 'allUsers';
type TimeFilter = 'all' | '7' | '30' | '90';

export function DeductionBreakdownDialog({
  isOpen,
  onOpenChange,
  allUsersData,
  selectedUserId,
}: DeductionBreakdownDialogProps) {
  const [selectedEvent, setSelectedEvent] = useState(EVENTS[0]);
  const [userScope, setUserScope] = useState<UserScope>('currentUser');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');


  const averageDeductions = useMemo(() => {
    const skillDeductions: Record<string, number[]> = {};

    const userIdsToProcess =
      userScope === 'currentUser' && selectedUserId
        ? [selectedUserId]
        : Object.keys(allUsersData);
        
    const cutoffDate = timeFilter === 'all' ? null : subDays(new Date(), parseInt(timeFilter));

    for (const userId of userIdsToProcess) {
      const userData = allUsersData[userId];
      if (!userData) continue;

      let eventSubmissions = userData.submissions.filter(
        sub => sub.event === selectedEvent
      );

      if (cutoffDate) {
        eventSubmissions = eventSubmissions.filter(sub => isAfter(new Date(sub.timestamp), cutoffDate));
      }

      for (const submission of eventSubmissions) {
        for (const skill of submission.skills) {
          if (typeof skill.deduction === 'number') {
            if (!skillDeductions[skill.name]) {
              skillDeductions[skill.name] = [];
            }
            skillDeductions[skill.name].push(skill.deduction);
          }
        }
      }
    }

    const averages = Object.entries(skillDeductions).map(([name, deductions]) => {
      const sum = deductions.reduce((a, b) => a + b, 0);
      const average = sum / deductions.length;
      return {
        name,
        averageDeduction: parseFloat(average.toFixed(2)),
      };
    });

    return averages.sort((a, b) => b.averageDeduction - a.averageDeduction);
  }, [selectedEvent, userScope, allUsersData, selectedUserId, timeFilter]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Deduction Breakdown</DialogTitle>
          <DialogDescription>
            Analyze average deductions per skill.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4">
          <div className="md:col-span-1 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="event-filter">Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger id="event-filter">
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
             <div className="space-y-2">
              <Label htmlFor="time-filter">Time Period</Label>
              <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
                <SelectTrigger id="time-filter">
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Scope</Label>
              <RadioGroup
                value={userScope}
                onValueChange={(value: string) => setUserScope(value as UserScope)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="currentUser" id="r1" />
                  <Label htmlFor="r1">Current User</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="allUsers" id="r2" />
                  <Label htmlFor="r2">All Users</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <div className="md:col-span-3 h-96">
            {averageDeductions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={averageDeductions}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                  />
                  <Bar dataKey="averageDeduction" fill="hsl(var(--primary))">
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
      </DialogContent>
    </Dialog>
  );
}
