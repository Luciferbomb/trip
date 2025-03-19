import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export interface ExperienceCardProps {
  id: string;
  images: string[];
  caption: string;
  location: string;
  date: string;
  userName: string;
  userImage?: string;
  experienceType?: string;
  likes: number;
  comments: number;
  liked?: boolean;
}

const ExperienceCard = ({
  id,
  images,
  caption,
  location,
  date,
  userName,
  userImage,
  experienceType = "Travel",
  likes,
  comments,
  liked = false,
}: ExperienceCardProps) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(liked);
  const [likeCount, setLikeCount] = useState(likes);
  const [imageError, setImageError] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  const handleLike = () => {
    if (isLiked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? 'Unliked' : 'Liked!',
      description: isLiked ? 'You unliked this experience' : 'You liked this experience',
      duration: 1500,
    });
  };

  const handleCommentClick = () => {
    setShowComments(true);
  };

  const handleShareClick = () => {
    setShowShareDialog(true);
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) {
      toast({
        title: "Comment can't be empty",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    
    toast({
      title: "Comment added",
      description: "Your comment has been posted",
      duration: 2000
    });
    
    setCommentText('');
    setShowComments(false);
  };

  const handleShare = (platform: string) => {
    const experienceUrl = `${window.location.origin}/experience/${id}`;
    
    let shareUrl = '';
    switch(platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=Check out this travel experience: ${caption}&url=${encodeURIComponent(experienceUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(experienceUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=Check out this travel experience: ${encodeURIComponent(experienceUrl)}`;
        break;
      default:
        // Copy to clipboard
        navigator.clipboard.writeText(experienceUrl);
        toast({
          title: "Link copied!",
          description: "Experience link copied to clipboard",
          duration: 2000
        });
        setShowShareDialog(false);
        return;
    }
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    setShowShareDialog(false);
  };

  const fallbackImageUrl = "https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1287&auto=format&fit=crop";
  
  // Format the date to a readable format (e.g., "3 days ago")
  const formattedDate = formatDistanceToNow(new Date(date), { addSuffix: true });
  
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {(images && images.length > 0 && !imageError) ? (
          <img
            src={images[0]}
            alt={caption}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
            <img
              src={fallbackImageUrl}
              alt="Fallback scenic view"
              className="w-full h-full object-cover absolute inset-0"
            />
          </div>
        )}
        
        {experienceType && (
          <Badge variant="secondary" className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm">
            {experienceType}
          </Badge>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-center mb-3">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={userImage} alt={userName} />
            <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="text-sm font-medium">{userName}</h4>
            <div className="flex items-center text-xs text-gray-500">
              <span>{location}</span>
              <span className="mx-1">•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{caption}</p>
        
        {/* Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-xs flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            {likeCount}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs flex items-center gap-1 text-gray-600"
            onClick={handleCommentClick}
          >
            <MessageCircle className="h-4 w-4" />
            {comments}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs flex items-center gap-1 text-gray-600"
            onClick={handleShareClick}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>
              Join the conversation about this experience.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 max-h-[300px] overflow-y-auto">
            {comments > 0 ? (
              <div className="space-y-4">
                {/* Sample comments - will be replaced with actual comments from API */}
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 p-3 rounded-lg flex-1">
                    <div className="font-medium text-sm">User123</div>
                    <p className="text-sm text-gray-600">This place looks amazing! I'd love to visit.</p>
                    <div className="text-xs text-gray-400 mt-1">1 day ago</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>T</AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 p-3 rounded-lg flex-1">
                    <div className="font-medium text-sm">Traveler42</div>
                    <p className="text-sm text-gray-600">Is it expensive to visit here? Looking for budget options.</p>
                    <div className="text-xs text-gray-400 mt-1">3 days ago</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
          
          <div className="mt-2">
            <Textarea 
              placeholder="Write a comment..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="resize-none"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <Button onClick={handleSubmitComment}>Post Comment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Share this experience</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 justify-center"
              onClick={() => handleShare('twitter')}
            >
              <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497-3.753C20.18 7.773 21.692 5.25 22 4.009z" />
              </svg>
              Twitter
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 justify-center"
              onClick={() => handleShare('facebook')}
            >
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 justify-center"
              onClick={() => handleShare('whatsapp')}
            >
              <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 justify-center"
              onClick={() => handleShare('copy')}
            >
              <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExperienceCard;
