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
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';

interface SubmissionsTableProps {
  submissions: Submission[];
}

type SortOrder = 'newest' | 'oldest';

export function SubmissionsTable({ submissions }: SubmissionsTableProps) {
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
                <TableHead className="w-12"></TableHead>
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
                        <TableCell>
                          <CollapsibleTrigger asChild>
                             <Button variant="ghost" size="sm">
                                <ChevronDown className="h-4 w-4" />
                                <span className="sr-only">Toggle details</span>
                             </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                         <tr className="bg-muted/50">
                            <TableCell colSpan={4} className="p-4">
                              <p className="font-semibold mb-2">Skills Submitted:</p>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {sub.skills.map(skill => (
                                  <li key={skill.name}>
                                    {skill.name}: <span className="font-medium">Value {skill.value}</span>, <span className="text-destructive">Deduction {skill.deduction}</span>
                                  </li>
                                ))}
                              </ul>
                            </TableCell>
                         </tr>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
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
