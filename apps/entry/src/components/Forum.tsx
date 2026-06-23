import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Image, Heart, MessageCircle, Share2, MoreHorizontal, Camera, X, Users, TrendingUp, Clock, Pin, Plus, Eye, Reply, Flag } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  chips: number;
  created_at: string;
  country?: string | null;
  level?: number;
  experience?: number;
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  slug: string;
  thread_count?: number;
  post_count?: number;
  last_post_at?: string;
}

interface ForumThread {
  id: string;
  category_id: string;
  user_id: string;
  username: string;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  post_count: number;
  last_post_at: string;
  last_post_user_id?: string;
  created_at: string;
}

interface ForumPost {
  id: string;
  thread_id: string;
  user_id: string;
  username: string;
  parent_post_id?: string;
  content: string;
  image_url?: string;
  is_original_post: boolean;
  like_count: number;
  created_at: string;
  user_liked?: boolean;
}

interface ForumProps {
  profile: UserProfile;
  onBack: () => void;
}

export default function Forum({ profile, onBack }: ForumProps) {
  const [currentView, setCurrentView] = useState<'categories' | 'threads' | 'posts'>('categories');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | null>(null);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for demonstration
  useEffect(() => {
    loadMockCategories();
  }, []);

  const loadMockCategories = () => {
    const mockCategories: ForumCategory[] = [
      {
        id: '1',
        name: 'General Discussion',
        description: 'General gaming discussions and community chat',
        slug: 'general',
        thread_count: 45,
        post_count: 234,
        last_post_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: '2',
        name: 'Game Strategies',
        description: 'Share tips, tricks, and winning strategies',
        slug: 'strategies',
        thread_count: 28,
        post_count: 156,
        last_post_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        name: 'Screenshots & Highlights',
        description: 'Show off your best moments and achievements',
        slug: 'screenshots',
        thread_count: 67,
        post_count: 189,
        last_post_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: '4',
        name: 'Bug Reports',
        description: 'Report issues and bugs you encounter',
        slug: 'bugs',
        thread_count: 12,
        post_count: 34,
        last_post_at: new Date(Date.now() - 14400000).toISOString()
      },
      {
        id: '5',
        name: 'Feature Requests',
        description: 'Suggest new features and improvements',
        slug: 'features',
        thread_count: 19,
        post_count: 78,
        last_post_at: new Date(Date.now() - 21600000).toISOString()
      },
      {
        id: '6',
        name: 'Tournaments & Events',
        description: 'Discuss upcoming tournaments and events',
        slug: 'tournaments',
        thread_count: 8,
        post_count: 42,
        last_post_at: new Date(Date.now() - 28800000).toISOString()
      }
    ];
    setCategories(mockCategories);
  };

  const loadMockThreads = (categoryId: string) => {
    const mockThreads: ForumThread[] = [
      {
        id: '1',
        category_id: categoryId,
        user_id: 'user1',
        username: 'ProGamer123',
        title: 'Best strategies for Stack\'em - Share your tips!',
        is_pinned: true,
        is_locked: false,
        view_count: 245,
        post_count: 18,
        last_post_at: new Date(Date.now() - 1800000).toISOString(),
        last_post_user_id: 'user2',
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '2',
        category_id: categoryId,
        user_id: 'user2',
        username: 'ChipMaster',
        title: 'Hold\'em position play - When to fold?',
        is_pinned: false,
        is_locked: false,
        view_count: 156,
        post_count: 12,
        last_post_at: new Date(Date.now() - 3600000).toISOString(),
        last_post_user_id: 'user3',
        created_at: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: '3',
        category_id: categoryId,
        user_id: 'user3',
        username: 'DeckBuilder',
        title: 'New Deck Realms combo discovered!',
        is_pinned: false,
        is_locked: false,
        view_count: 89,
        post_count: 7,
        last_post_at: new Date(Date.now() - 7200000).toISOString(),
        last_post_user_id: 'user1',
        created_at: new Date(Date.now() - 259200000).toISOString()
      }
    ];
    setThreads(mockThreads);
  };

  const loadMockPosts = (threadId: string) => {
    const mockPosts: ForumPost[] = [
      {
        id: '1',
        thread_id: threadId,
        user_id: 'user1',
        username: 'ProGamer123',
        content: 'Hey everyone! I\'ve been playing Stack\'em for months and wanted to share some strategies that have really helped me improve my win rate. What are your favorite techniques?',
        image_url: 'https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg?auto=compress&cs=tinysrgb&w=400',
        is_original_post: true,
        like_count: 12,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        user_liked: false
      },
      {
        id: '2',
        thread_id: threadId,
        user_id: 'user2',
        username: 'ChipMaster',
        content: 'Great thread! I always focus on building a solid foundation first. The key is patience - don\'t rush your moves.',
        is_original_post: false,
        like_count: 8,
        created_at: new Date(Date.now() - 82800000).toISOString(),
        user_liked: true
      },
      {
        id: '3',
        thread_id: threadId,
        user_id: 'user3',
        username: 'DeckBuilder',
        content: 'I disagree with the patience approach. Sometimes you need to take calculated risks to maximize your score. Timing is everything!',
        is_original_post: false,
        like_count: 5,
        created_at: new Date(Date.now() - 79200000).toISOString(),
        user_liked: false
      }
    ];
    setPosts(mockPosts);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim() || !selectedCategory) return;

    setLoading(true);
    try {
      const newThread: ForumThread = {
        id: Date.now().toString(),
        category_id: selectedCategory.id,
        user_id: profile.id,
        username: profile.username,
        title: newThreadTitle,
        is_pinned: false,
        is_locked: false,
        view_count: 0,
        post_count: 1,
        last_post_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const originalPost: ForumPost = {
        id: (Date.now() + 1).toString(),
        thread_id: newThread.id,
        user_id: profile.id,
        username: profile.username,
        content: newThreadContent,
        image_url: imagePreview || undefined,
        is_original_post: true,
        like_count: 0,
        created_at: new Date().toISOString(),
        user_liked: false
      };

      setThreads(prev => [newThread, ...prev]);
      setSelectedThread(newThread);
      setPosts([originalPost]);
      setCurrentView('posts');
      setNewThreadTitle('');
      setNewThreadContent('');
      setShowNewThread(false);
      removeImage();
    } catch (error) {
      console.error('Error creating thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !selectedThread) return;

    setLoading(true);
    try {
      const newPost: ForumPost = {
        id: Date.now().toString(),
        thread_id: selectedThread.id,
        user_id: profile.id,
        username: profile.username,
        content: newPostContent,
        image_url: imagePreview || undefined,
        is_original_post: false,
        like_count: 0,
        created_at: new Date().toISOString(),
        user_liked: false
      };

      setPosts(prev => [...prev, newPost]);
      setThreads(prev => prev.map(thread => 
        thread.id === selectedThread.id 
          ? { ...thread, post_count: thread.post_count + 1, last_post_at: new Date().toISOString() }
          : thread
      ));
      setNewPostContent('');
      removeImage();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            like_count: post.user_liked ? post.like_count - 1 : post.like_count + 1,
            user_liked: !post.user_liked 
          }
        : post
    ));
  };

  const openCategory = (category: ForumCategory) => {
    setSelectedCategory(category);
    loadMockThreads(category.id);
    setCurrentView('threads');
  };

  const openThread = (thread: ForumThread) => {
    setSelectedThread(thread);
    loadMockPosts(thread.id);
    setCurrentView('posts');
    
    // Increment view count
    setThreads(prev => prev.map(t => 
      t.id === thread.id 
        ? { ...t, view_count: t.view_count + 1 }
        : t
    ));
  };

  const goBack = () => {
    if (currentView === 'posts') {
      setCurrentView('threads');
      setSelectedThread(null);
      setPosts([]);
    } else if (currentView === 'threads') {
      setCurrentView('categories');
      setSelectedCategory(null);
      setThreads([]);
    } else {
      onBack();
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getBreadcrumb = () => {
    if (currentView === 'categories') return 'Forum Categories';
    if (currentView === 'threads') return `${selectedCategory?.name} - Threads`;
    if (currentView === 'posts') return `${selectedThread?.title}`;
    return 'Forum';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5 group-hover:transform group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>
        
        <div className="text-center flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white">{getBreadcrumb()}</h2>
        </div>
        
        {currentView === 'threads' && (
          <button
            onClick={() => setShowNewThread(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-400/20 touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Thread</span>
          </button>
        )}
      </div>

      {/* Categories View */}
      {currentView === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => openCategory(category)}
              className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6 shadow-xl shadow-orange-500/10 hover:border-orange-500/40 transition-all cursor-pointer hover:scale-105"
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                  <p className="text-gray-400 text-sm">{category.description}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-white font-semibold">{category.thread_count}</p>
                    <p className="text-gray-400 text-xs">Threads</p>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{category.post_count}</p>
                    <p className="text-gray-400 text-xs">Posts</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Last post</p>
                    <p className="text-white text-xs">{formatTimeAgo(category.last_post_at!)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Threads View */}
      {currentView === 'threads' && (
        <div className="space-y-4">
          {threads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => openThread(thread)}
              className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6 shadow-xl shadow-orange-500/10 hover:border-orange-500/40 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {thread.is_pinned && <Pin className="w-4 h-4 text-orange-400" />}
                    <h3 className="text-lg font-bold text-white">{thread.title}</h3>
                    {thread.is_locked && <span className="text-red-400 text-xs">🔒 Locked</span>}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>by {thread.username}</span>
                    <span>{formatTimeAgo(thread.created_at)}</span>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">{thread.view_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">{thread.post_count}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Last: {formatTimeAgo(thread.last_post_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Posts View */}
      {currentView === 'posts' && (
        <div className="space-y-6">
          {posts.map((post, index) => (
            <div
              key={post.id}
              className={`bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border rounded-2xl p-6 shadow-xl ${
                post.is_original_post 
                  ? 'border-orange-500/40 shadow-orange-500/20' 
                  : 'border-orange-500/20 shadow-orange-500/10'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/50">
                  <span className="text-white font-bold">
                    {post.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-white font-semibold">{post.username}</h4>
                      {post.is_original_post && <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">OP</span>}
                      <span className="text-gray-400 text-sm">{formatTimeAgo(post.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-sm">#{index + 1}</span>
                      <button className="text-gray-400 hover:text-white">
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-4 leading-relaxed">{post.content}</p>
                  
                  {post.image_url && (
                    <img 
                      src={post.image_url} 
                      alt="Post image" 
                      className="w-full max-w-md rounded-lg mb-4"
                    />
                  )}
                  
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikePost(post.id);
                      }}
                      className={`flex items-center space-x-2 transition-colors ${
                        post.user_liked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${post.user_liked ? 'fill-current' : ''}`} />
                      <span>{post.like_count}</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors">
                      <Reply className="w-5 h-5" />
                      <span>Reply</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors">
                      <Share2 className="w-5 h-5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Reply */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6 shadow-xl shadow-orange-500/10">
            <div className="flex space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/50">
                <span className="text-white font-bold">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500/50 resize-none"
                  rows={4}
                />
                
                {imagePreview && (
                  <div className="relative mt-3 inline-block">
                    <img src={imagePreview} alt="Preview" className="max-w-xs rounded-lg" />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 text-gray-400 hover:text-orange-400 transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-sm">Add Image</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || loading}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-400/20 touch-manipulation"
                  >
                    {loading ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Thread Modal */}
      {showNewThread && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-8 max-w-2xl w-full shadow-2xl shadow-orange-500/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Create New Thread</h3>
              <button
                onClick={() => setShowNewThread(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Thread Title</label>
                <input
                  type="text"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="Enter thread title..."
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Content</label>
                <textarea
                  value={newThreadContent}
                  onChange={(e) => setNewThreadContent(e.target.value)}
                  placeholder="Write your post content..."
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500/50 resize-none"
                  rows={6}
                />
              </div>

              {imagePreview && (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="max-w-xs rounded-lg" />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 text-gray-400 hover:text-orange-400 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-sm">Add Image</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowNewThread(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateThread}
                    disabled={!newThreadTitle.trim() || !newThreadContent.trim() || loading}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-400/20"
                  >
                    {loading ? 'Creating...' : 'Create Thread'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}