
'use client';

import { useState, useMemo } from 'react';
import type { Submission } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EVENTS } from '@/lib/constants';
import { format, subDays, isAfter } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ChevronDown, Trash2, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface SubmissionsTableProps {
  submissions: Submission[];
  onDelete: (submissionId: string) => void;
}

type SortOrder = 'newest' | 'oldest';


export function SubmissionsTable({ submissions, onDelete }: SubmissionsTableProps) {
  const [eventFilter, setEventFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [useTimeFilter, setUseTimeFilter] = useState(true);
  const [timeFilterDays, setTimeFilterDays] = useState(30);
  const [showRoutinesOnly, setShowRoutinesOnly] = useState(false);

  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = submissions;

    if (eventFilter !== 'all') {
      filtered = filtered.filter(sub => sub.event === eventFilter);
    }
    
    if (useTimeFilter) {
      const cutoffDate = subDays(new Date(), timeFilterDays);
      filtered = filtered.filter(sub => isAfter(new Date(sub.timestamp), cutoffDate));
    }
    
    if (showRoutinesOnly) {
      filtered = filtered.filter(sub => sub.isComplete);
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - b.timestamp;
    });
  }, [submissions, eventFilter, sortOrder, useTimeFilter, timeFilterDays, showRoutinesOnly]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Recent Submissions</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="event-filter-table">Event</Label>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger id="event-filter-table">
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {EVENTS.map(event => (
                  <SelectItem key={event} value={event}>{event}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
             <div className="flex items-center justify-between">
               <Label htmlFor="time-filter-switch-table">All Time</Label>
               <Switch
                 id="time-filter-switch-table"
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
            <Label htmlFor="sort-order-table">Sort Order</Label>
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
              <SelectTrigger id="sort-order-table">
                <SelectValue placeholder="Sort by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-4">
            <Switch
                id="routines-only-switch-table"
                checked={showRoutinesOnly}
                onCheckedChange={setShowRoutinesOnly}
            />
            <Label htmlFor="routines-only-switch-table">Show Routines Only</Label>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Routine</TableHead>
                <TableHead className="text-center">1/2</TableHead>
                <TableHead className="text-center">Individual</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSubmissions.length > 0 ? (
                filteredAndSortedSubmissions.map(sub => (
                  <Collapsible asChild key={sub.id} tag="tbody">
                    <>
                      <TableRow>
                        <TableCell className="font-medium">{sub.event}</TableCell>
                        <TableCell>{format(new Date(sub.timestamp), "PPP p")}</TableCell>
                        <TableCell className="text-center">
                          {sub.isComplete ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-500 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {sub.skills.length >= 4 && sub.skills.length <= 6 ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-500 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {sub.skills.length === 1 ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-500 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronDown className="h-4 w-4" />
                                <span className="sr-only">Toggle details</span>
                            </Button>
                          </CollapsibleTrigger>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete submission</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this submission.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(sub.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <tr className="bg-muted/50">
                            <TableCell colSpan={6} className="p-4">
                              <p className="font-semibold mb-2">Skills Submitted:</p>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Skill</TableHead>
                                      <TableHead className="text-right">Value</TableHead>
                                      <TableHead className="text-right">Deduction</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sub.skills.map(skill => (
                                      <TableRow key={skill.name}>
                                        <TableCell>{skill.name}</TableCell>
                                        <TableCell className="text-right font-medium">{skill.value}</TableCell>
                                        <TableCell className="text-right text-destructive">{skill.deduction}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                        </tr>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No submissions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
