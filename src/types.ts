export interface Comment {
  id: string;
  from: string;
  text: string;
  timestamp: string;
  postId: string;
}

export interface KeluhPost {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  loveCount: number;
  sadCount: number;
  angryCount: number;
  laughCount: number;
  isAdminPost: boolean;
  isPinned: boolean;
  reactionCount: number;
  comments?: Comment[];
}
