function adminOnly(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}

module.exports = adminOnly;
