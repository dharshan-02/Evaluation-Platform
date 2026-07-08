import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { HiOutlineStar, HiOutlineFire } from 'react-icons/hi';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/gamification/leaderboard');
        setLeaderboard(res.data.leaderboard);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch leaderboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankColor = (index) => {
    switch (index) {
      case 0: return 'bg-amber-400 text-amber-900 shadow-amber-500/50';
      case 1: return 'bg-slate-300 text-slate-800 shadow-slate-400/50';
      case 2: return 'bg-amber-700 text-amber-100 shadow-amber-900/50';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
    }
  };

  const getRankIcon = (index) => {
    if (index < 3) {
      return <HiOutlineStar className="w-5 h-5" />;
    }
    return <span className="font-bold">{index + 1}</span>;
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (error) return <div className="text-rose-500 text-center py-10">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center space-y-3 mb-10">
        <div className="p-4 bg-indigo-500/10 rounded-full">
          <HiOutlineStar className="w-12 h-12 text-indigo-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Global Leaderboard</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg">
          Compete with your peers by solving coding challenges, keeping up your streak, and earning badges.
        </p>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-4">
        {leaderboard.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            No players ranked yet. Solve challenges to be the first!
          </div>
        ) : (
          leaderboard.map((student, index) => (
            <motion.div
              key={student._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass p-4 rounded-2xl flex items-center justify-between transition-transform hover:scale-[1.01]"
            >
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${getRankColor(index)}`}>
                  {getRankIcon(index)}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {student.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                      {student.department || 'Student'}
                    </span>
                    {student.currentStreak > 0 && (
                      <span className="text-xs font-medium text-orange-500 flex items-center gap-1">
                        <HiOutlineFire className="w-3 h-3" /> {student.currentStreak} day streak
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <div className="text-2xl font-extrabold text-indigo-500">
                  {student.points}
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Points
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
