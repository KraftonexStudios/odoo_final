"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, Trash2, Edit2, X, Check } from "lucide-react";
import { useCommentsByTask, useCreateComment, useDeleteComment, useUpdateComment } from "@/hooks/comments";
import { base64ToDataUrl, getInitials } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@clerk/nextjs";

type Props = {
  taskId: number;
};

export const CommentSection = ({ taskId }: Props) => {
  const { user } = useUser();
  const { data: comments, isLoading } = useCommentsByTask(taskId);
  const { mutate: createComment, isPending: creating } = useCreateComment();
  const { mutate: deleteComment } = useDeleteComment();
  const { mutate: updateComment } = useUpdateComment();

  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createComment({ taskId, content: newComment });
    setNewComment("");
  };

  const handleEdit = (commentId: number, content: string) => {
    setEditingId(commentId);
    setEditContent(content);
  };

  const handleSaveEdit = (commentId: number) => {
    if (!editContent.trim()) return;
    updateComment({ id: commentId, content: editContent });
    setEditingId(null);
    setEditContent("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment */}
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newComment.trim() || creating}
                className="gap-2"
              >
                <Send className="h-3 w-3" />
                {creating ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4 mt-6">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-4">Loading comments...</p>
          ) : comments?.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments?.map((comment: any) => {
              const isOwn = comment.userId === user?.id;
              const isEditing = editingId === comment.id;

              return (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={base64ToDataUrl(comment.user?.avatar)} />
                    <AvatarFallback>
                      {getInitials(comment.user?.firstName, comment.user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {comment.user?.firstName} {comment.user?.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(comment.id)}
                            className="h-7 gap-1"
                          >
                            <Check className="h-3 w-3" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="h-7 gap-1"
                          >
                            <X className="h-3 w-3" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-foreground">{comment.content}</p>
                        {isOwn && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(comment.id, comment.content)}
                              className="h-7 gap-1 text-xs"
                            >
                              <Edit2 className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteComment(comment.id)}
                              className="h-7 gap-1 text-xs text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommentSection;

