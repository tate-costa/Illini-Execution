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
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const initialUserData: Omit<UserData, 'userName'> = { routines: {}, submissions: [] };

export function RoutineRecorder() {
  const [data, setData] = useLocalStorage<AppData>('routine-recorder-data', {});
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

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
  
  const handleDownload = () => {
    const wb = XLSX.utils.book_new();

    // Submissions Sheet
    const submissionsData: any[] = [];
    Object.values(data).forEach(userData => {
        userData.submissions.forEach(sub => {
            sub.skills.forEach(skill => {
                submissionsData.push({
                    'User Name': userData.userName,
                    'Event': sub.event,
                    'Date': format(new Date(sub.timestamp), "yyyy-MM-dd HH:mm:ss"),
                    'Skill': skill.name,
                    'Value': skill.value,
                    'Deduction': skill.deduction,
                    'Routine Complete': sub.isComplete ? 'Yes' : 'No'
                });
            });
        });
    });
    const submissionsWs = XLSX.utils.json_to_sheet(submissionsData);
    XLSX.utils.book_append_sheet(wb, submissionsWs, "Submissions");
    
     // Routines Sheet
    const routinesData: any[] = [];
    Object.values(data).forEach(userData => {
        Object.entries(userData.routines).forEach(([event, skills]) => {
            skills.forEach(skill => {
                routinesData.push({
                    'User Name': userData.userName,
                    'Event': event,
                    'Skill': skill.name,
                    'Value': skill.value,
                });
            });
        });
    });
    const routinesWs = XLSX.utils.json_to_sheet(routinesData);
    XLSX.utils.book_append_sheet(wb, routinesWs, "Routines");

    XLSX.writeFile(wb, "RoutineRecorder_Data.xlsx");
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
