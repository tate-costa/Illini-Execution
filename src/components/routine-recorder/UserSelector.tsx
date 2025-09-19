'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { User } from '@/lib/types';

interface UserSelectorProps {
  users: User[];
  selectedUser: string | undefined;
  onUserChange: (userId: string) => void;
}

export function UserSelector({
  users,
  selectedUser,
  onUserChange,
}: UserSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="user-select">Select a User</Label>
      <Select value={selectedUser} onValueChange={onUserChange}>
        <SelectTrigger id="user-select" className="w-full">
          <SelectValue placeholder="Choose a gymnast..." />
        </SelectTrigger>
        <SelectContent>
          {users.map(user => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
