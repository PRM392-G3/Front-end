import PostDetailScreen from '@/screens/PostDetailScreen';

export default function PostDetailPage() {
  const handleShareToggle = (postId: number, isShared: boolean) => {
    // This could be used to update global state if needed
  };

  const handleRefresh = () => {
    // This could trigger a refresh of the post detail screen
  };

  return <PostDetailScreen onShareToggle={handleShareToggle} onRefresh={handleRefresh} />;
}
