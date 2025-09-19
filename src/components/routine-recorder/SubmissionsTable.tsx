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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EVENTS } from '@/lib/constants';
import { format } from 'date-fns';
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

interface SubmissionsTableProps {
  submissions: Submission[];
  onDelete: (submissionId: string) => void;
}

type SortOrder = 'newest' | 'oldest';

export function SubmissionsTable({ submissions, onDelete }: SubmissionsTableProps) {
  const [eventFilter, setEventFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = submissions;

    if (eventFilter !== 'all') {
      filtered = filtered.filter(sub => sub.event === eventFilter);
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [submissions, eventFilter, sortOrder]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Recent Submissions</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {EVENTS.map(event => (
                <SelectItem key={event} value={event}>{event}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Routine</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSubmissions.length > 0 ? (
                filteredAndSortedSubmissions.map(sub => (
                  <Collapsible asChild key={sub.id}>
                    <>
                      <TableRow>
                        <TableCell className="font-medium">{sub.event}</TableCell>
                        <TableCell>{format(new Date(sub.timestamp), "PPP p")}</TableCell>
                        <TableCell>
                          <Badge variant={sub.isComplete ? 'default' : 'destructive'} className={sub.isComplete ? 'bg-green-500' : 'bg-red-500'}>
                            {sub.isComplete ? 'Complete' : 'Incomplete'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {sub.isComplete ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
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
                            <TableCell colSpan={5} className="p-4">
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
                  <TableCell colSpan={5} className="h-24 text-center">
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
