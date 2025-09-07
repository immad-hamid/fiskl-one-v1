const profileService = require('../services/profileService');

const createProfile = async (req, res, next) => {
  try {
    // Ensure default user exists
    const user = await profileService.ensureDefaultUser();
    const userId = user.id;
    
    const profileData = { ...req.body, userId };
    
    const profile = await profileService.createProfile(profileData);
    
    res.status(201).json({
      success: true,
      data: profile,
      message: 'Profile created successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getProfiles = async (req, res, next) => {
  try {
    // Ensure default user exists
    const user = await profileService.ensureDefaultUser();
    const userId = user.id;
    
    const profiles = await profileService.getProfilesByUserId(userId);
    
    res.status(200).json({
      success: true,
      data: profiles,
      message: 'Profiles retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getProfileById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Ensure default user exists
    const user = await profileService.ensureDefaultUser();
    const userId = user.id;
    
    const profile = await profileService.getProfileById(parseInt(id), userId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: profile,
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Ensure default user exists
    const user = await profileService.ensureDefaultUser();
    const userId = user.id;
    
    const profile = await profileService.updateProfile(parseInt(id), userId, req.body);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Ensure default user exists
    const user = await profileService.ensureDefaultUser();
    const userId = user.id;
    
    await profileService.deleteProfile(parseInt(id), userId);
    
    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const setDefaultProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Ensure default user exists
    const user = await profileService.ensureDefaultUser();
    const userId = user.id;
    
    const profile = await profileService.setDefaultProfile(parseInt(id), userId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: profile,
      message: 'Default profile set successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProfile,
  getProfiles,
  getProfileById,
  updateProfile,
  deleteProfile,
  setDefaultProfile
};
