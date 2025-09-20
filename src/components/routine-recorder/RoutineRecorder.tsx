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
import { DeductionBreakdownDialog } from './DeductionBreakdownDialog';
import { Download } from 'lucide-react';
import { downloadDataAsExcel } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';


export function RoutineRecorder() {
  const [data, setData] = useLocalStorage<AppData>('routine-recorder-data', {});
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const { toast } = useToast();

  const selectedUserName = useMemo(() => {
    return USERS.find(user => user.id === selectedUserId)?.name;
  }, [selectedUserId]);
  
  const currentUserData = useMemo(() => {
    if (!selectedUserId) return null;
    return data[selectedUserId] || { ...initialUserData, userName: selectedUserName || '' };
  }, [selectedUserId, data, selectedUserName]);

  const hasRoutines = useMemo(() => {
    if (!currentUserData) return false;
    return Object.values(currentUserData.routines).some(routine => routine.length > 0);
  }, [currentUserData]);

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const newName = USERS.find(u => u.id === userId)?.name;
    // Ensure user data has a name
    if (!data[userId] && newName) {
      const newData = { ...data };
      newData[userId] = { ...initialUserData, userName: newName };
      setData(newData);
    } else if (data[userId] && !data[userId].userName && newName) {
      const newData = { ...data };
      newData[userId].userName = newName;
      setData(newData);
    }
  };

  const handleSaveRoutine = (event: string, routine: UserRoutines) => {
    if (!selectedUserId || !selectedUserName) return;
    const newData = { ...data };
    if (!newData[selectedUserId]) {
      newData[selectedUserId] = { ...initialUserData, userName: selectedUserName };
    }
    newData[selectedUserId].routines = routine;
    setData(newData);
    setIsEditOpen(false);
  };

  const handleSaveSubmission = (submission: Omit<Submission, 'id'>) => {
    if (!selectedUserId || !selectedUserName) return;
    const newSubmission: Submission = {
        ...submission,
        id: new Date().toISOString() + Math.random(),
    };
    const newData = { ...data };
    if (!newData[selectedUserId]) {
      newData[selectedUserId] = { ...initialUserData, userName: selectedUserName };
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
  
  const handleDownload = async () => {
    try {
      const base64 = await downloadDataAsExcel(data);
      if (base64) {
        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
        link.download = 'RoutineRecorder_Data.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
         toast({
            title: 'No Data to Download',
            description: 'There is no data to export.',
        });
      }
    } catch (error) {
      console.error('Download failed', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Could not generate the Excel file. Please try again.',
      });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="relative text-center mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">
          RoutineRecorder
        </h1>
        <p className="text-muted-foreground mt-2">
          Your personal gymnastics routine tracker and optimizer.
        </p>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleDownload} 
          className="absolute top-0 right-0"
          disabled={Object.keys(data).length === 0}
        >
          <Download className="h-4 w-4" />
          <span className="sr-only">Download Data</span>
        </Button>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
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
               <Button
                onClick={() => setIsBreakdownOpen(true)}
                variant="outline"
                className="w-full"
              >
                See Breakdown
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
           <DeductionBreakdownDialog
            isOpen={isBreakdownOpen}
            onOpenChange={setIsBreakdownOpen}
            allUsersData={data}
            selectedUserId={selectedUserId}
            selectedUserName={selectedUserName}
          />
        </>
      )}
    </div>
  );
}

const initialUserData: Omit<UserData, 'userName'> = { routines: {}, submissions: [] };
