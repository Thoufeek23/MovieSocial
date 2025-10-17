import React, { useEffect, useState } from 'react';
import * as api from '../api';
import { Link } from 'react-router-dom';
import BookmarkButton from '../components/BookmarkButton';

const DiscussionsListPage = () => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.fetchDiscussions();
        const discs = res.data || [];
        const top = discs.slice(0, 12);
        const withPosters = await Promise.all(top.map(async d => {
          try {
            const m = await api.getMovieDetails(d.movieId);
            return { ...d, poster_path: m.data.poster_path };
          } catch (e) {
            return { ...d, poster_path: null };
          }
        }));
        setDiscussions(withPosters.concat(discs.slice(12)));
      } catch (e) {
        console.error('Failed to load discussions', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Discussions</h1>
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {discussions.length === 0 ? (
            <div className="text-gray-400">No discussions yet.</div>
          ) : (
            discussions.map(d => (
              <div key={d._id} className="relative group">
                <Link to={`/discussions/${d._id}`} className="p-4 bg-card rounded-lg hover:shadow-lg transition-shadow flex items-start gap-4">
                  <img src={d.poster_path ? `https://image.tmdb.org/t/p/w185${d.poster_path}` : '/default_dp.png'} alt="poster" className="w-20 h-28 object-cover rounded shadow-sm" />
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-100 line-clamp-2">{d.title}</div>
                    <div className="text-sm text-gray-400 mt-1">{d.movieTitle}</div>
                    <div className="mt-3 text-sm text-gray-400">{d.comments?.length || 0} comments • Started by {d.starter?.username}</div>
                  </div>
                </Link>
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <BookmarkButton id={d._id} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DiscussionsListPage;
