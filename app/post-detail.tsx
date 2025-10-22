import PostDetailScreen from '@/screens/PostDetailScreen';
import { usePostContext } from '@/contexts/PostContext';

export default function PostDetailPage() {
  const { updatePost } = usePostContext();

  const handleShareToggle = (postId: number, isShared: boolean) => {
    // This could be used to update global state if needed
  };

  const handleRefresh = () => {
    // This could trigger a refresh of the post detail screen
  };

  const handleCommentCountUpdate = (postId: number, commentCount: number) => {
    // Update the post in global context
    updatePost(postId, {
      commentCount: commentCount
    });
  };

  return (
    <PostDetailScreen 
      onShareToggle={handleShareToggle} 
      onRefresh={handleRefresh}
      onCommentCountUpdate={handleCommentCountUpdate}
    />
  );
}
