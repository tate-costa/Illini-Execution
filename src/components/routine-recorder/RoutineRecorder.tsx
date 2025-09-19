'use client';

import { useState, useMemo } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import { USERS } from '@/lib/constants';
import type { AppData, Submission, UserData, UserRoutines } from '@/lib/types';
import { UserSelector } from './UserSelector';
import { Button } from '@/components/ui/button';
import { EditRoutinesDialog } from './EditRoutinesDialog';
import { SubmitRoutineDialog } from './SubmitRoutineDialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SubmissionsTable } from './SubmissionsTable';

const initialUserData: UserData = { routines: {}, submissions: [] };

export function RoutineRecorder() {
  const [data, setData] = useLocalStorage<AppData>('routine-recorder-data', {});
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  const currentUserData = useMemo(() => {
    if (!selectedUserId) return null;
    return data[selectedUserId] || initialUserData;
  }, [selectedUserId, data]);

  const hasRoutines = useMemo(() => {
    if (!currentUserData) return false;
    return Object.values(currentUserData.routines).some(routine => routine.length > 0);
  }, [currentUserData]);

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleSaveRoutine = (event: string, routine: UserRoutines) => {
    if (!selectedUserId) return;
    const newData = { ...data };
    if (!newData[selectedUserId]) {
      newData[selectedUserId] = { ...initialUserData };
    }
    newData[selectedUserId].routines = routine;
    setData(newData);
    setIsEditOpen(false);
  };

  const handleSaveSubmission = (submission: Omit<Submission, 'id'>) => {
    if (!selectedUserId) return;
    const newSubmission: Submission = {
        ...submission,
        id: new Date().toISOString() + Math.random(),
    };
    const newData = { ...data };
    if (!newData[selectedUserId]) {
      newData[selectedUserId] = { ...initialUserData };
    }
    newData[selectedUserId].submissions.unshift(newSubmission); // Add to beginning of array
    setData(newData);
    setIsSubmitOpen(false);
  };
  
  const handleDeleteSubmission = (submissionId: string) => {
    if (!selectedUserId) return;
    const newData = { ...data };
    if (newData[selectedUserId]) {
      newData[selectedUserId].submissions = newData[selectedUserId].submissions.filter(
        (sub) => sub.id !== submissionId
      );
      setData(newData);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">
          RoutineRecorder
        </h1>
        <p className="text-muted-foreground mt-2">
          Your personal gymnastics routine tracker and optimizer.
        </p>
      </header>
      
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <UserSelector
            users={USERS}
            selectedUser={selectedUserId}
            onUserChange={handleUserChange}
          />

          {selectedUserId && (
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => setIsEditOpen(true)}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Edit My Routines
              </Button>
              <Button
                onClick={() => setIsSubmitOpen(true)}
                disabled={!hasRoutines}
                className="w-full"
              >
                Submit Routine
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedUserId && currentUserData && currentUserData.submissions.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8">
            <SubmissionsTable 
              submissions={currentUserData.submissions}
              onDelete={handleDeleteSubmission}
            />
          </div>
      )}

      {currentUserData && (
        <>
          <EditRoutinesDialog
            isOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
            userRoutines={currentUserData.routines}
            onSave={handleSaveRoutine}
          />
          <SubmitRoutineDialog
            isOpen={isSubmitOpen}
            onOpenChange={setIsSubmitOpen}
            userRoutines={currentUserData.routines}
            onSave={handleSaveSubmission}
          />
        </>
      )}
    </div>
  );
}
