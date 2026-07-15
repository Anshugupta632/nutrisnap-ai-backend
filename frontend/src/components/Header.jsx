function Header({ userName = 'Anshu' }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="flex items-center justify-between w-full">
      <div>
        <p className="text-cream/60 text-sm font-body">{greeting},</p>
        <h1 className="text-2xl font-display font-bold text-cream">{userName} 👋</h1>
      </div>

      {/* Avatar placeholder - baad mein RPG avatar se replace karenge */}
      <div className="w-12 h-12 rounded-full bg-dabba border-2 border-haldi flex items-center justify-center">
        <span className="text-lg">💪</span>
      </div>
    </div>
  );
}

export default Header;