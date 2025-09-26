import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Edit, Trash2 } from 'lucide-react';

// A simple component to display non-interactive stars
const DisplayStars = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <span key={index} className={`text-xl ${index < rating ? 'text-yellow-400' : 'text-gray-600'}`}>
          &#9733;
        </span>
      ))}
    </div>
  );
};


const ReviewCard = ({ review, onEdit, onDelete }) => {
  const { user } = useContext(AuthContext);
  // Compare IDs as strings to avoid type mismatches (ObjectId vs string)
  const isAuthor = !!user && (
    String(user.id) === String(review.user._id) ||
    String(user._id) === String(review.user._id)
  );

  // Show modify controls if the logged-in user is the author and at least one handler is provided.
  const canModify = isAuthor && (typeof onEdit === 'function' || typeof onDelete === 'function');

  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w200';

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex gap-5 items-start">
      <Link to={`/movie/${review.movieId}`}>
        <img
          src={`${IMG_BASE_URL}${review.moviePoster}`}
          alt={review.movieTitle}
          className="w-24 rounded-md hidden sm:block hover:opacity-80 transition-opacity"
        />
      </Link>
      <div className="flex-1">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold">
                <Link to={`/movie/${review.movieId}`} className="hover:text-green-400">{review.movieTitle}</Link>
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    {review.rating > 0 && <DisplayStars rating={review.rating} />}
                    <span className="mt-1">
                        Reviewed by <Link to={`/profile/${review.user.username}`} className="font-semibold hover:underline">{review.user.username}</Link>
                    </span>
                </div>
            </div>
            {/* If user can modify, show edit/delete buttons */}
            {canModify && (
                <div className="flex items-center gap-3 flex-shrink-0">
        <button onClick={() => onEdit ? onEdit(review) : null} className="text-gray-400 hover:text-white transition-colors" title="Edit review">
                    <Edit size={18} />
                </button>
        <button onClick={() => onDelete ? onDelete(review._id) : null} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete review">
                    <Trash2 size={18} />
                </button>
                </div>
            )}
        </div>

        <p className="text-gray-300 italic">"{review.text}"</p>
      </div>
    </div>
  );
};

export default ReviewCard;

