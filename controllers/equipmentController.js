const Equipment = require('../models/Equipment');
const { deleteFile } = require('../middleware/upload');

exports.getAllEquipment = async (req, res) => {
  try {
    // Since we're not checking user ID, we'll return all equipment
    const equipment = await Equipment.find().sort({ createdAt: -1 });
    
    if (!equipment || equipment.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Aucun équipement trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: equipment
    });
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des équipements',
      error: err.message 
    });
  }
};

exports.getEquipmentById = async (req, res) => {
  try {
    // No longer filtering by userId
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ 
        success: false,
        message: 'Équipement non trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: equipment
    });
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération de l\'équipement',
      error: err.message 
    });
  }
};

exports.createEquipment = async (req, res) => {
  try {
    const equipmentData = {
      ...req.body,
      price: Number(req.body.price),
      userId: req.user.id
    };
    
    // Handle image upload
    if (req.file) {
      equipmentData.image = `/uploads/${req.file.filename}`;
    }
    
    const newEquipment = new Equipment(equipmentData);
    const savedEquipment = await newEquipment.save();
    res.status(201).json({
      success: true,
      data: savedEquipment
    });
  } catch (err) {
    console.error('Error saving equipment:', err);
    res.status(400).json({ 
      success: false,
      message: 'Erreur lors de la création de l\'équipement',
      error: err.message 
    });
  }
};

exports.updateEquipment = async (req, res) => {
  try {
    const equipmentData = {
      ...req.body,
      price: Number(req.body.price)
    };
    
    // Only update image if a new one is uploaded
    if (req.file) {
      equipmentData.image = `/uploads/${req.file.filename}`;
      
      // Delete old image if it exists
      const oldEquipment = await Equipment.findOne({ _id: req.params.id, userId: req.user.id });
      if (!oldEquipment) {
        return res.status(404).json({ 
          success: false,
          message: 'Équipement non trouvé' 
        });
      }
      
      if (oldEquipment.image) {
        deleteFile(oldEquipment.image);
      }
    }
    
    const updatedEquipment = await Equipment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      equipmentData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedEquipment) {
      return res.status(404).json({ 
        success: false,
        message: 'Équipement non trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: updatedEquipment
    });
  } catch (err) {
    console.error('Error updating equipment:', err);
    res.status(400).json({ 
      success: false,
      message: 'Erreur lors de la mise à jour de l\'équipement',
      error: err.message 
    });
  }
};

exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!equipment) {
      return res.status(404).json({ 
        success: false,
        message: 'Équipement non trouvé' 
      });
    }
    
    // Delete associated image
    if (equipment.image) {
      deleteFile(equipment.image);
    }
    
    await Equipment.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ 
      success: true,
      message: 'Équipement supprimé avec succès' 
    });
  } catch (err) {
    console.error('Error deleting equipment:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la suppression de l\'équipement',
      error: err.message 
    });
  }
};