const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { validateProfile } = require('../middlewares/validation');

// GET /api/profiles - Get all profiles for user
router.get('/', profileController.getProfiles);

// GET /api/profiles/:id - Get specific profile
router.get('/:id', profileController.getProfileById);

// POST /api/profiles - Create new profile
router.post('/', validateProfile, profileController.createProfile);

// PUT /api/profiles/:id - Update profile
router.put('/:id', validateProfile, profileController.updateProfile);

// DELETE /api/profiles/:id - Delete profile
router.delete('/:id', profileController.deleteProfile);

// PATCH /api/profiles/:id/set-default - Set profile as default
router.patch('/:id/set-default', profileController.setDefaultProfile);

module.exports = router;
