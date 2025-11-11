const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api`;

export const CommentReactionMapper = {
    getReactionsForComment : (postId : number, commentId : number) => `${BASE_URL}/posts/${postId}/comments/${commentId}/reactions`, // Get reactions for a specific comment 
    postReactionForComment : (postId : number, commentId : number) => `${BASE_URL}/posts/${postId}/comments/${commentId}/reactions`, // React or unreact to a specific comment
};