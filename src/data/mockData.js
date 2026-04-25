// ─── Mock Data (replace with real instagrapi calls later) ────────────────────

export const mockProfile = {
  username: 'astronaut.vibes',
  fullName: 'Alex Nova',
  profilePic: 'https://i.pravatar.cc/150?img=12',
  followers: 1_240,
  following: 380,
  posts: 94,
  ghostScore: 72, // 0-100, higher = more engagement
  visibilityScore: 85,
};

export const mockStalkers = [
  { id: '1', username: 'silent_watcher_99', profilePic: 'https://i.pravatar.cc/80?img=1', viewedStories: 42, isFollowing: false },
  { id: '2', username: 'night.observer',    profilePic: 'https://i.pravatar.cc/80?img=2', viewedStories: 38, isFollowing: false },
  { id: '3', username: 'shadow_lurker',     profilePic: 'https://i.pravatar.cc/80?img=3', viewedStories: 31, isFollowing: false },
  { id: '4', username: 'x.unknown.x',       profilePic: 'https://i.pravatar.cc/80?img=4', viewedStories: 27, isFollowing: false },
  { id: '5', username: 'quiet_scroll',      profilePic: 'https://i.pravatar.cc/80?img=5', viewedStories: 19, isFollowing: false },
];

export const mockMuted = [
  { id: '6',  username: 'bestie_forever',  profilePic: 'https://i.pravatar.cc/80?img=6',  rankDelta: -18, lastSeen: '3 days ago' },
  { id: '7',  username: 'college.era',     profilePic: 'https://i.pravatar.cc/80?img=7',  rankDelta: -24, lastSeen: '5 days ago' },
  { id: '8',  username: 'old_coworker_21', profilePic: 'https://i.pravatar.cc/80?img=8',  rankDelta: -31, lastSeen: '1 week ago' },
  { id: '9',  username: 'ex.friend.era',   profilePic: 'https://i.pravatar.cc/80?img=9',  rankDelta: -45, lastSeen: '2 weeks ago' },
];

export const mockUnfollowers = [
  { id: '10', username: 'drift_away_99',    profilePic: 'https://i.pravatar.cc/80?img=10', unfollowedAt: '2 hours ago',  wasFollowedBack: true },
  { id: '11', username: 'temporary.follow', profilePic: 'https://i.pravatar.cc/80?img=11', unfollowedAt: '1 day ago',    wasFollowedBack: false },
  { id: '12', username: 'ghost.accounts',   profilePic: 'https://i.pravatar.cc/80?img=12', unfollowedAt: '3 days ago',   wasFollowedBack: true },
  { id: '13', username: 'the.cleanser',     profilePic: 'https://i.pravatar.cc/80?img=13', unfollowedAt: '1 week ago',   wasFollowedBack: false },
  { id: '14', username: 'social.pruner',    profilePic: 'https://i.pravatar.cc/80?img=14', unfollowedAt: '2 weeks ago',  wasFollowedBack: true },
  { id: '15', username: 'ratio.hunter',     profilePic: 'https://i.pravatar.cc/80?img=15', unfollowedAt: '3 weeks ago',  wasFollowedBack: false },
];

// Simulate async fetch with delay
export const fetchMockData = () =>
  new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          profile: mockProfile,
          stalkers: mockStalkers,
          muted: mockMuted,
          unfollowers: mockUnfollowers,
        }),
      2000,
    ),
  );
