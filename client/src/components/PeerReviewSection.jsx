import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const PeerReviewSection = ({ submission }) => {
  const { user } = useAuth();
  const [rubric, setRubric] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // My Review State
  const [myReview, setMyReview] = useState(null);
  const [scores, setScores] = useState({});
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch rubric
        const rubRes = await api.get(`/assignments/${submission.assignment._id || submission.assignment}/rubric`);
        setRubric(rubRes.data.rubric);

        // Fetch reviews
        const revRes = await api.get(`/submissions/${submission._id}/reviews`);
        setReviews(revRes.data.reviews);

        // Check if I have already reviewed
        const existingReview = revRes.data.reviews.find(r => r.reviewer._id === user.id);
        if (existingReview) {
          setMyReview(existingReview);
          const initialScores = {};
          existingReview.rubricScores.forEach(score => {
            initialScores[score.rubricItem] = score.pointsAwarded;
          });
          setScores(initialScores);
          setGeneralFeedback(existingReview.generalFeedback || '');
        } else if (rubRes.data.rubric) {
          // Initialize scores
          const initialScores = {};
          rubRes.data.rubric.items.forEach(item => {
            initialScores[item._id] = 0;
          });
          setScores(initialScores);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          toast.error('Failed to load peer review data');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (submission) {
      fetchData();
    }
  }, [submission, user.id]);

  const handleSubmitReview = async (status = 'draft') => {
    try {
      setSubmitting(true);
      const rubricScores = Object.entries(scores).map(([rubricItem, pointsAwarded]) => ({
        rubricItem,
        pointsAwarded: Number(pointsAwarded)
      }));

      const payload = {
        rubricScores,
        generalFeedback,
        status
      };

      const res = await api.post(`/submissions/${submission._id}/reviews`, payload);
      setMyReview(res.data.review);
      toast.success(`Review ${status === 'submitted' ? 'submitted' : 'saved as draft'} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading rubric and reviews...</div>;
  }

  if (!rubric) {
    return (
      <div className="p-8 text-center glass rounded-xl">
        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">No Rubric Available</h3>
        <p className="text-slate-500 text-sm mt-2">The instructor has not configured a grading rubric for this assignment yet.</p>
      </div>
    );
  }

  const isOwner = submission.student._id === user.id || submission.student === user.id;

  return (
    <div className="space-y-6">
      {!isOwner && (!myReview || myReview.status === 'draft') && (
        <div className="glass rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Write Peer Review</h3>
          <div className="space-y-6">
            {rubric.items.map((item) => (
              <div key={item._id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{item.criteria}</h4>
                    {item.description && <p className="text-xs text-slate-500 mt-1">{item.description}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400">Score</span>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="0"
                        max={item.maxPoints}
                        value={scores[item._id] || 0}
                        onChange={(e) => setScores({ ...scores, [item._id]: e.target.value })}
                        className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-center text-sm font-bold"
                      />
                      <span className="text-sm font-bold text-slate-500">/ {item.maxPoints}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">General Feedback</label>
              <textarea
                value={generalFeedback}
                onChange={(e) => setGeneralFeedback(e.target.value)}
                rows={4}
                placeholder="Provide constructive feedback for your peer..."
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleSubmitReview('draft')}
                disabled={submitting}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-sm transition-colors"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSubmitReview('submitted')}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold text-sm transition-colors"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display Existing Reviews */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Peer Reviews ({reviews.filter(r => r.status === 'submitted').length})</h3>
        {reviews.filter(r => r.status === 'submitted').map((review, idx) => (
          <div key={idx} className="glass rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Review by {review.reviewer?.name || 'Anonymous'}</h4>
                <span className="text-xs text-slate-500">{new Date(review.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-indigo-500">{review.totalScore}</span>
                <span className="text-xs text-slate-500 block">Total Score</span>
              </div>
            </div>
            {review.generalFeedback && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-600 dark:text-slate-300 italic mb-4 border-l-4 border-indigo-500">
                "{review.generalFeedback}"
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {review.rubricScores.map((score, sIdx) => {
                const rubricItem = rubric.items.find(i => i._id === score.rubricItem);
                return (
                  <div key={sIdx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate mr-2">{rubricItem?.criteria || 'Unknown Criteria'}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{score.pointsAwarded} / {rubricItem?.maxPoints || '?'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeerReviewSection;
