
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { AppData, Submission, UserData, UserRoutines } from '@/lib/types';
import { USERS } from '@/lib/constants';
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
  const [allUsersData, setAllUsersData] = useState<AppData>({});
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchUserData = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/data/${userId}`);
      if (response.status === 404) {
        const newName = USERS.find((u) => u.id === userId)?.name;
        const newUser: UserData = { ...initialUserData, userName: newName || '' };
        setCurrentUserData(newUser);
        // Save the new user profile
        await updateVercelBlob(userId, newUser);
      } else if (response.ok) {
        const data = await response.json();
        setCurrentUserData(data);
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        variant: 'destructive',
        title: 'Loading Error',
        description: 'Could not load user data.',
      });
      setCurrentUserData(null);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserData(selectedUserId);
    } else {
      setCurrentUserData(null);
    }
  }, [selectedUserId, fetchUserData]);


  const updateVercelBlob = async (userId: string, newUserData: UserData) => {
    try {
      const response = await fetch(`/api/data/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUserData),
      });
      if (!response.ok) {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error("Error updating blob: ", error);
      toast({
        variant: 'destructive',
        title: 'Sync Error',
        description: 'Could not save changes to the database.',
      });
    }
  };
  
  const selectedUserName = useMemo(() => {
    return USERS.find(user => user.id === selectedUserId)?.name;
  }, [selectedUserId]);

  const hasRoutines = useMemo(() => {
    if (!currentUserData) return false;
    return Object.values(currentUserData.routines).some(routine => routine.length > 0);
  }, [currentUserData]);

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleSaveRoutine = (event: string, routines: UserRoutines) => {
    if (!selectedUserId || !currentUserData) return;
    const updatedUserData = {
      ...currentUserData,
      routines: routines
    };
    setCurrentUserData(updatedUserData);
    updateVercelBlob(selectedUserId, updatedUserData);
    setIsEditOpen(false);
  };

  const handleSaveSubmission = (submission: Omit<Submission, 'id'>) => {
    if (!selectedUserId || !currentUserData) return;
    const newSubmission: Submission = {
      ...submission,
      id: new Date().toISOString() + Math.random(),
    };

    const newSubmissions = [newSubmission, ...(currentUserData.submissions || [])];
    const updatedUserData = {
      ...currentUserData,
      submissions: newSubmissions,
    };
    setCurrentUserData(updatedUserData);
    updateVercelBlob(selectedUserId, updatedUserData);
    setIsSubmitOpen(false);
  };
  
  const handleDeleteSubmission = (submissionId: string) => {
    if (!selectedUserId || !currentUserData) return;
    const updatedSubmissions = currentUserData.submissions.filter(sub => sub.id !== submissionId);
    const updatedUserData = {
      ...currentUserData,
      submissions: updatedSubmissions
    };
    setCurrentUserData(updatedUserData);
    updateVercelBlob(selectedUserId, updatedUserData);
  };

  const fetchAllData = async () => {
    // This is less efficient with blob storage, as it requires N requests.
    // For the breakdown, we will fetch all users' data one by one.
    // In a real-world scenario with many users, a different approach would be needed.
    const appData: AppData = {};
    setIsLoading(true);
    try {
      for (const user of USERS) {
        const response = await fetch(`/api/data/${user.id}`);
        if (response.ok) {
          appData[user.id] = await response.json();
        }
      }
      setAllUsersData(appData);
    } catch (error) {
       console.error("Error fetching all user data:", error);
       toast({
        variant: 'destructive',
        title: 'Loading Error',
        description: 'Could not load all user data for breakdown.',
      });
    } finally {
        setIsLoading(false);
    }
  }
  
  const handleOpenBreakdown = async () => {
    await fetchAllData();
    setIsBreakdownOpen(true);
  }
  
  const handleDownload = async () => {
    try {
      await fetchAllData();
      const base64 = await downloadDataAsExcel(allUsersData);
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
            description: 'There is no routine or submission data to export.',
            variant: 'default'
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

  if (!isClient) {
    return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-2xl font-semibold">Loading...</div>
        </div>
      );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="relative text-center mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">
          Illini Execution
        </h1>
        <p className="text-muted-foreground mt-2">
          Your personal gymnastics routine tracker and optimizer.
        </p>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleDownload} 
          className="absolute top-0 right-0"
          disabled={!isClient || isLoading}
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
                disabled={isLoading}
              >
                Edit My Routines
              </Button>
              <Button
                onClick={() => setIsSubmitOpen(true)}
                disabled={!hasRoutines || isLoading}
                className="w-full"
              >
                Submit Routine
              </Button>
               <Button
                onClick={handleOpenBreakdown}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                See Breakdown
              </Button>
            </div>
          )}
           {isLoading && selectedUserId && (
                <div className="text-center text-muted-foreground">Loading {selectedUserName}'s data...</div>
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
            allUsersData={allUsersData}
            selectedUserId={selectedUserId}
            selectedUserName={selectedUserName}
          />
        </>
      )}
    </div>
  );
}

const initialUserData: Omit<UserData, 'userName'> = { routines: {}, submissions: [] };
