import { useState } from 'react';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Users, UserPlus, Crown, Shield, Edit, Eye, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AppRole, ProjectMemberUI } from '@/types/database';

interface CollaborationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

const roleIcons: Record<AppRole, React.ReactNode> = {
  owner: <Crown className="h-4 w-4 text-yellow-500" />,
  admin: <Shield className="h-4 w-4 text-blue-500" />,
  editor: <Edit className="h-4 w-4 text-green-500" />,
  viewer: <Eye className="h-4 w-4 text-gray-500" />,
};

const roleLabels: Record<AppRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

export function CollaborationDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: CollaborationDialogProps) {
  const { user } = useAuth();
  const { members, loading, inviteMember, removeMember, updateMemberRole } = useProjectMembers(
    open ? projectId : null
  );

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('editor');
  const [inviting, setInviting] = useState(false);

  const currentUserRole = members.find((m) => m.userId === user?.id)?.role;
  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address.',
        variant: 'destructive',
      });
      return;
    }

    setInviting(true);
    const success = await inviteMember(inviteEmail, inviteRole);
    setInviting(false);

    if (success) {
      setInviteEmail('');
      setInviteRole('editor');
    }
  };

  const handleRemove = async (member: ProjectMemberUI) => {
    if (member.role === 'owner') {
      toast({
        title: 'Cannot remove owner',
        description: 'The project owner cannot be removed.',
        variant: 'destructive',
      });
      return;
    }

    await removeMember(member.id);
  };

  const handleRoleChange = async (member: ProjectMemberUI, newRole: AppRole) => {
    if (member.role === 'owner') {
      toast({
        title: 'Cannot change owner role',
        description: 'The project owner role cannot be changed.',
        variant: 'destructive',
      });
      return;
    }

    await updateMemberRole(member.id, newRole);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaborate on "{projectName}"
          </DialogTitle>
          <DialogDescription>
            Invite team members to collaborate on this project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invite Section */}
          {canManageMembers && (
            <>
              <div className="space-y-3">
                <Label>Invite by email</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInvite} disabled={inviting}>
                    {inviting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Members List */}
          <div className="space-y-2">
            <Label>Team Members ({members.length})</Label>
            <ScrollArea className="h-[200px]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => {
                    const initials = (member.profile?.display_name || member.profile?.email || 'U')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {member.profile?.display_name || member.profile?.email || 'Unknown'}
                              {member.userId === user?.id && (
                                <span className="text-muted-foreground ml-1">(you)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.profile?.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {canManageMembers && member.role !== 'owner' ? (
                            <>
                              <Select
                                value={member.role}
                                onValueChange={(v) => handleRoleChange(member, v as AppRole)}
                              >
                                <SelectTrigger className="w-28 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                  <SelectItem value="editor">Editor</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRemove(member)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {roleIcons[member.role]}
                              {roleLabels[member.role]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Role Descriptions */}
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p><strong>Viewer:</strong> Can view tasks and projects</p>
            <p><strong>Editor:</strong> Can create, edit, and delete tasks</p>
            <p><strong>Admin:</strong> Can manage members and project settings</p>
            <p><strong>Owner:</strong> Full control over the project</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
