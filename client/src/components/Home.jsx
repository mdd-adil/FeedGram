import { useState,useEffect } from "react";
import Post from "./Post";
export const Home=()=>{
const [posts, setPosts] = useState([]);
// State for the new post form
const [newPost, setNewPost] = useState({ title: '', content: '' });
// State to manage the loading status
const [loading, setLoading] = useState(true);
// State to simulate a logged-in user
const [user, setUser] = useState({
    _id: 'user123',
    username: 'JaneDoe',
    profilePic: 'https://placehold.co/100x100/A0BFE3/ffffff?text=JD'
});

// useEffect to simulate fetching posts from a backend API
useEffect(() => {
    // In a real app, you would fetch data from your API here:
    // fetch('/api/posts')
    //   .then(res => res.json())
    //   .then(data => {
        //     setPosts(data.posts);
        //     setLoading(false);
        //   })
        //   .catch(error => console.error("Error fetching posts:", error));
        
        // Using mock data for immediate demonstration
        setTimeout(() => {
            setPosts([
                { 
                    _id: 'p1', 
                    title: 'My First Post', 
                    content: 'This is an example post content. It shows how the homepage will look with some data. The design is simple, clean, and responsive.', 
                    user: { _id: 'u1', username: 'AlexW' }, 
                    createdAt: new Date() 
                },
                { 
                    _id: 'p2', 
                    title: 'The Road to Full-Stack', 
                    content: 'Building a full-stack application is a great way to improve your skills. I am excited about this project!', 
                    user: { _id: 'u2', username: 'FullStackDev' }, 
                    createdAt: new Date() 
                },
            ]);
            setLoading(false);
        }, 1500); // Simulate network delay
    }, []);
    
    // Function to handle post creation
    const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) {
      alert('Please enter a title and content.');
      return;
    }

    setLoading(true);
    
    // In a real app, you would make a POST request to your API:
    // await fetch('/api/posts', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     // You would also send an authentication token here, e.g., 'Authorization': 'Bearer YOUR_JWT_TOKEN'
    //   },
    //   body: JSON.stringify({ ...newPost, userId: user._id }),
    // });

    // Simulate successful API response and update state
    setTimeout(() => {
      const createdPost = {
        _id: `p${posts.length + 1}`,
        title: newPost.title,
        content: newPost.content,
        user: { _id: user._id, username: user.username },
        createdAt: new Date(),
      };
      setPosts([createdPost, ...posts]);
      setNewPost({ title: '', content: '' });
      setLoading(false);
    }, 1000); // Simulate network delay
  };

  // Component for the post creation form


  // Main render logic
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <script src="https://cdn.tailwindcss.com"></script>
      {/* Header Section */}
      <header className="flex justify-between items-center py-4 border-b border-gray-200 mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Social Sphere</h1>
        <div className="flex items-center">
          <span className="font-medium text-gray-700 mr-3">Welcome, {user.username}!</span>
          <img src={user.profilePic} alt="User" className="w-10 h-10 rounded-full" />
        </div>
      </header>
      
      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto">
        {/* Post Creation Form */}
        {/* <PostCreationForm /> */}
        
        {/* Post Feed */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Latest Posts</h2>
          {loading ? (
            <div className="text-center text-gray-500 py-10">
              <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4">Loading posts...</p>
            </div>
          ) : (
            posts.length > 0 ? (
              posts.map((post) => <Post key={post._id} post={post} edit={false}/>)
            ) : (
              <p className="text-center text-gray-500 py-10">No posts to display.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
  }
export default Home