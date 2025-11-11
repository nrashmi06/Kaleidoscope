const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api`;

export const PostReactionMapper = {
    getReactionsForPost : (postId : number) => `${BASE_URL}/posts/${postId}/reactions`, // Get reactions for a specific post 
    postReactionForPost : (postId : number) => `${BASE_URL}/posts/${postId}/reactions`, // React or unreact to a specific post
};