// Session-persistent unlock state — module singleton, lives until app process restarts
const unlockState = {
  stalkers: false,
  ghostFollowers: false,
  unfollowers: false,
};

export default unlockState;
