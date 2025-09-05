const prisma = require('../utils/prisma');

const ensureDefaultUser = async () => {
  // Try to find existing user or create a default one
  let user = await prisma.user.findFirst();
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        apiKey: 'demo-api-key-123',
        companyName: 'Demo Company Ltd.',
        companyAddress: '123 Demo Street, Demo City, Demo Province',
        companyPhone: '+92-300-1234567'
      }
    });
  }
  
  return user;
};

const createProfile = async (profileData) => {
  const { userId, name, ntncnic, businessName, province, address, registrationType, isDefault } = profileData;
  
  // If this is being set as default, unset all other default profiles for this user
  if (isDefault) {
    await prisma.profile.updateMany({
      where: { userId },
      data: { isDefault: false }
    });
  }
  
  const profile = await prisma.profile.create({
    data: {
      userId,
      name,
      ntncnic,
      businessName,
      province,
      address,
      registrationType,
      isDefault: isDefault || false
    }
  });
  
  return profile;
};

const getProfilesByUserId = async (userId) => {
  const profiles = await prisma.profile.findMany({
    where: { userId },
    orderBy: [
      { isDefault: 'desc' }, // Default profiles first
      { createdAt: 'desc' }
    ]
  });
  
  return profiles;
};

const getProfileById = async (id, userId) => {
  const profile = await prisma.profile.findFirst({
    where: { 
      id,
      userId // Ensure user can only access their own profiles
    }
  });
  
  return profile;
};

const updateProfile = async (id, userId, updateData) => {
  const { isDefault, ...otherData } = updateData;
  
  // Check if profile exists and belongs to user
  const existingProfile = await getProfileById(id, userId);
  if (!existingProfile) {
    return null;
  }
  
  // If setting as default, unset all other default profiles for this user
  if (isDefault) {
    await prisma.profile.updateMany({
      where: { 
        userId,
        id: { not: id }
      },
      data: { isDefault: false }
    });
  }
  
  const profile = await prisma.profile.update({
    where: { id },
    data: {
      ...otherData,
      ...(isDefault !== undefined && { isDefault })
    }
  });
  
  return profile;
};

const deleteProfile = async (id, userId) => {
  // Check if profile exists and belongs to user
  const existingProfile = await getProfileById(id, userId);
  if (!existingProfile) {
    throw new Error('Profile not found');
  }
  
  await prisma.profile.delete({
    where: { id }
  });
  
  return true;
};

const setDefaultProfile = async (id, userId) => {
  // Check if profile exists and belongs to user
  const existingProfile = await getProfileById(id, userId);
  if (!existingProfile) {
    return null;
  }
  
  // Unset all other default profiles for this user
  await prisma.profile.updateMany({
    where: { 
      userId,
      id: { not: id }
    },
    data: { isDefault: false }
  });
  
  // Set this profile as default
  const profile = await prisma.profile.update({
    where: { id },
    data: { isDefault: true }
  });
  
  return profile;
};

module.exports = {
  ensureDefaultUser,
  createProfile,
  getProfilesByUserId,
  getProfileById,
  updateProfile,
  deleteProfile,
  setDefaultProfile
};
