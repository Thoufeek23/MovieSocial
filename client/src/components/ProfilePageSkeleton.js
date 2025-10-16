import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const ProfilePageSkeleton = () => {
  return (
    <div className="mt-8 mx-auto max-w-4xl">
      <Skeleton height={160} />
      <div className="flex items-center gap-4 mt-4">
        <Skeleton circle width={96} height={96} />
        <div>
          <Skeleton width={240} height={28} />
          <Skeleton width={300} />
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Skeleton width={110} />
        <Skeleton width={110} />
        <Skeleton width={140} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <Skeleton height={220} />
        <Skeleton height={220} />
      </div>
    </div>
  );
};

export default ProfilePageSkeleton;
