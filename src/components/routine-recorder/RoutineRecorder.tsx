
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { PasswordProtectDialog } from './PasswordProtectDialog';


export function RoutineRecorder() {
  const [data, setData] = useState<AppData>({});
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const appData: AppData = {};
      querySnapshot.forEach((doc) => {
        appData[doc.id] = doc.data() as UserData;
      });
      setData(appData);
    } catch (error) {
      console.error("Error fetching data from Firestore:", error);
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: "Could not fetch data from the database. Please check your connection or Firebase setup.",
      });
    }
  }, [toast]);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);
  
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

  const handleUserChange = async (userId: string) => {
    setSelectedUserId(userId);
    const newName = USERS.find(u => u.id === userId)?.name;
    
    if (!data[userId] && newName) {
      const newUser: UserData = { ...initialUserData, userName: newName };
      try {
        await setDoc(doc(db, "users", userId), newUser);
        setData(prevData => ({ ...prevData, [userId]: newUser }));
      } catch (error) {
        console.error("Error creating user in Firestore:", error);
      }
    }
  };

  const handleSaveRoutine = async (event: string, routine: UserRoutines) => {
    if (!selectedUserId || !selectedUserName) return;

    try {
        const userDocRef = doc(db, "users", selectedUserId);
        await updateDoc(userDocRef, { routines: routine });

        setData(prevData => ({
            ...prevData,
            [selectedUserId]: {
                ...prevData[selectedUserId],
                routines: routine,
                userName: selectedUserName,
            }
        }));
        setIsEditOpen(false);
    } catch (error) {
        console.error("Error saving routines to Firestore:", error);
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: 'Could not save routines. Please try again.',
        });
    }
  };

  const handleSaveSubmission = async (submission: Omit<Submission, 'id'>) => {
    if (!selectedUserId) return;
    const newSubmission: Submission = {
        ...submission,
        id: new Date().toISOString() + Math.random(),
    };

    const newSubmissions = [newSubmission, ...(currentUserData?.submissions || [])];

    try {
        const userDocRef = doc(db, "users", selectedUserId);
        await updateDoc(userDocRef, { submissions: newSubmissions });

        setData(prevData => ({
            ...prevData,
            [selectedUserId]: {
                ...prevData[selectedUserId],
                submissions: newSubmissions,
                userName: selectedUserName || prevData[selectedUserId]?.userName,
            }
        }));
        setIsSubmitOpen(false);
    } catch (error) {
        console.error("Error saving submission to Firestore:", error);
        toast({
            variant: 'destructive',
            title: 'Submission Failed',
            description: 'Could not save submission. Please try again.',
        });
    }
  };
  
  const handleDeleteSubmission = async (submissionId: string) => {
    if (!selectedUserId) return;
    const updatedSubmissions = currentUserData?.submissions.filter(sub => sub.id !== submissionId) || [];
    
    try {
        const userDocRef = doc(db, "users", selectedUserId);
        await updateDoc(userDocRef, { submissions: updatedSubmissions });

        setData(prevData => ({
            ...prevData,
            [selectedUserId]: {
                ...prevData[selectedUserId],
                submissions: updatedSubmissions,
                userName: selectedUserName || prevData[selectedUserId]?.userName,
            }
        }));
    } catch (error) {
        console.error("Error deleting submission from Firestore:", error);
        toast({
            variant: 'destructive',
            title: 'Delete Failed',
            description: 'Could not delete submission. Please try again.',
        });
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
  
  if (!isAuthenticated) {
    return <PasswordProtectDialog isOpen={true} onAuthenticated={() => setIsAuthenticated(true)} />;
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
          disabled={!isClient || Object.keys(data).length === 0}
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
