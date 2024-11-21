import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTimeline, createPost, replyToPost, searchPosts } from '../services/bluesky';
import { Link } from 'react-router-dom';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    // Check for post parameter in URL
    const params = new URLSearchParams(window.location.search);
    const postParam = params.get('post');
    if (postParam) {
      setNewPost(decodeURIComponent(postParam));
      // Clear the URL parameter without refreshing the page
      window.history.replaceState({}, '', '/');
    }
    fetchPosts();
    const refreshInterval = setInterval(fetchPosts, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await getTimeline();
      if (response.success) {
        setPosts(response.data);
        setSearchResults(null);
      } else {
        setError('Failed to load posts');
      }
    } catch (error) {
      console.error('Feed error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const response = await createPost(newPost);
      if (response.success) {
        setNewPost('');
        fetchPosts();
      } else {
        setError('Failed to create post');
      }
    } catch (error) {
      console.error('Post creation error:', error);
      setError('An unexpected error occurred');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingTo) return;

    try {
      const response = await replyToPost(replyText, replyingTo);
      if (response.success) {
        setReplyText('');
        setReplyingTo(null);
        fetchPosts();
      } else {
        setError('Failed to send reply');
      }
    } catch (error) {
      console.error('Reply error:', error);
      setError('An unexpected error occurred');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchPosts();
      return;
    }

    setLoading(true);
    try {
      const response = await searchPosts(searchQuery);
      if (response.success) {
        setSearchResults(response.data);
      } else {
        setError('Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const getProxyUrl = (url) => {
    if (!url) return '';
    const baseUrl = url.split('?')[0];
    return `https://images.weserv.nl/?url=${encodeURIComponent(baseUrl)}&default=404`;
  };

  const renderPost = (post) => (
    <div key={post.uri} className="post">
      <div className="post-header">
        <div className="post-author-info">
          <Link 
            to={`/profile/${post.author.handle}`}
            className="post-author"
          >
            {post.author.displayName || `@${post.author.handle}`}
          </Link>
          <span className="post-time">
            {new Date(post.record.createdAt).toLocaleString()}
          </span>
        </div>
      </div>
      <p className="post-content">{post.record.text}</p>
      {post.embed?.images && (
        <div className="post-images">
          {post.embed.images.map((image, index) => (
            <img
              key={index}
              src={getProxyUrl(image.thumb)}
              alt={image.alt || 'Post image'}
              className="post-image"
              loading="lazy"
              onClick={() => window.open(getProxyUrl(image.fullsize), '_blank')}
            />
          ))}
        </div>
      )}
      <div className="post-actions">
        <button 
          className="btn-action"
          onClick={() => setReplyingTo(post)}
          title="Reply to this post"
        >
          💬 {post.replyCount || 0}
        </button>
        <span>🔄 {post.repostCount || 0}</span>
        <span>❤️ {post.likeCount || 0}</span>
      </div>
      
      {replyingTo?.uri === post.uri && (
        <form onSubmit={handleReply} className="reply-form">
          <div className="reply-header">
            Replying to @{post.author.handle}
            <button 
              type="button" 
              className="btn-close"
              onClick={() => setReplyingTo(null)}
            >
              ×
            </button>
          </div>
          <div className="form-group">
            <textarea
              className="input"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              autoFocus
            />
          </div>
          <div className="reply-actions">
            <button type="submit" className="btn btn-primary">
              Reply
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
        Loading your feed...
      </div>
    );
  }

  return (
    <div className="container">
      <div className="search-container">
        {!showSearch ? (
          <button 
            className="btn-icon"
            onClick={() => setShowSearch(true)}
            title="Search"
          >
            🔍
          </button>
        ) : (
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                className="input search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts and users..."
                autoFocus
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
              {searchResults ? (
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults(null);
                    setShowSearch(false);
                    fetchPosts();
                  }}
                >
                  Clear
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearch(false);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <form onSubmit={handleCreatePost} style={{ marginBottom: '2rem' }}>
        <div className="form-group">
          <textarea
            className="input"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's happening?"
            style={{ minHeight: '100px', resize: 'vertical' }}
            autoFocus={newPost !== ''}
          />
        </div>
        <button type="submit" className="btn btn-primary">Post</button>
      </form>

      {error && (
        <div className="error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="feed">
        {searchResults ? (
          <>
            {searchResults.actors.length > 0 && (
              <div className="search-section">
                <h3>Users</h3>
                {searchResults.actors.map((actor) => (
                  <Link
                    key={actor.did}
                    to={`/profile/${actor.handle}`}
                    className="user-result"
                  >
                    <span className="user-name">
                      {actor.displayName || `@${actor.handle}`}
                    </span>
                    <span className="user-handle">@{actor.handle}</span>
                  </Link>
                ))}
              </div>
            )}
            {searchResults.posts.length > 0 ? (
              searchResults.posts.map(renderPost)
            ) : (
              <div className="no-results">No posts found matching your search.</div>
            )}
          </>
        ) : (
          posts.map(renderPost)
        )}
      </div>
    </div>
  );
}
