const checkPlanAccess = async (req, res, next) => {
    try {
      const userId = req.user.userId; // Assuming you have user information in req.user
      const user = await userModel.findById(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      if (!user.selectedPlan) {
        return res.status(403).json({ error: 'You have not purchased a plan. Access denied.' });
      }
  
      // Check if the selected plan exists
      const selectedPlan = await PlanModel.findById(user.selectedPlan);
      if (!selectedPlan) {
        return res.status(404).json({ error: 'Selected plan not found. Access denied.' });
      }
  
      // Allow access if the user has purchased a plan
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
  