import React from 'react';
import { useParams, Link } from 'react-router-dom';
import BADGE_MAP from '../data/badges';

const BadgeDetail = () => {
  const { badgeId } = useParams();
  const badge = BADGE_MAP[badgeId] || { id: badgeId, title: badgeId, description: 'No description available.' };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Summary panel */}
        <aside className="lg:col-span-1 bg-card p-6 rounded-md shadow-sm">
          <div className="flex flex-col items-center text-center gap-4">
            <div className={`rounded-full w-20 h-20 flex items-center justify-center text-3xl ${badge.color || 'bg-gray-700'} text-white`}>{badge.icon || '🏅'}</div>
            <div>
              <h1 className="text-2xl font-bold">{badge.title}</h1>
              <div className="text-sm text-gray-400 mt-1">Badge · {badge.id}</div>
            </div>
            <p className="text-gray-300 text-sm mt-2">{badge.description}</p>
            <div className="mt-4 w-full">
              <Link to="/leaderboard" className="w-full inline-flex justify-center btn btn-ghost">View leaderboards</Link>
            </div>
          </div>
        </aside>

        {/* Rules panel */}
        <section className="lg:col-span-2">
          <div className="bg-card p-6 rounded-md shadow-sm">
            <h3 className="text-xl font-semibold mb-3">How the monthly tier is calculated</h3>
            <p className="text-gray-300 mb-4">Each calendar month we compute two metrics for every contributing user: their review count for the month and the community agreement percentage on those reviews. We select a contribution level from I (highest) to IV, then select a medal (Diamond, Gold, Silver, Bronze) based on agreement.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-gray-400 border-b border-gray-700">
                    <th className="py-3 pr-6">Level</th>
                    <th className="py-3 pr-6">Reviews (month)</th>
                    <th className="py-3 pr-6">Diamond</th>
                    <th className="py-3 pr-6">Gold</th>
                    <th className="py-3 pr-6">Silver</th>
                    <th className="py-3">Bronze</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-800">
                    <td className="py-4">Level I</td>
                    <td className="py-4">&gt; 15</td>
                    <td className="py-4">agreement &gt; 85%</td>
                    <td className="py-4">75% – 85%</td>
                    <td className="py-4">65% – 75%</td>
                    <td className="py-4">&lt; 65%</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-4">Level II</td>
                    <td className="py-4">&gt; 12</td>
                    <td className="py-4">agreement &gt; 85%</td>
                    <td className="py-4">75% – 85%</td>
                    <td className="py-4">65% – 75%</td>
                    <td className="py-4">&lt; 65%</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-4">Level III</td>
                    <td className="py-4">&gt; 10</td>
                    <td className="py-4">agreement &gt; 85%</td>
                    <td className="py-4">75% – 85%</td>
                    <td className="py-4">65% – 75%</td>
                    <td className="py-4">&lt; 65%</td>
                  </tr>
                  <tr>
                    <td className="py-4">Level IV</td>
                    <td className="py-4">≤ 10</td>
                    <td className="py-4">agreement &gt; 85%</td>
                    <td className="py-4">75% – 85%</td>
                    <td className="py-4">65% – 75%</td>
                    <td className="py-4">&lt; 65%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-sm text-gray-400 mt-4">
              <strong>Notes:</strong> Agreement is the average of agreement vote values on a user’s reviews for the month (values 0.0–1.0, converted to percent). The system first determines the level from review count, then selects the medal using agreement. Monthly-tier badges replace previous monthly-tier badges so users keep only the most recent monthly badge.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BadgeDetail;
