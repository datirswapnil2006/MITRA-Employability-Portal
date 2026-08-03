import StudyMaterial from "../models/StudyMaterial.js";

// @route GET /api/materials   (admin)
export const getAllMaterials = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: "i" };
    }

    const materials = await StudyMaterial.find(filter)
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });
    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch materials", error: err.message });
  }
};

// @route GET /api/materials/categories   (admin)
export const getMaterialCategories = async (req, res) => {
  try {
    const categories = await StudyMaterial.distinct("category");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories", error: err.message });
  }
};

// @route POST /api/materials   (admin)
export const createMaterial = async (req, res) => {
  try {
    const { title, description, category, type, fileUrl, content } = req.body;
    if (!title || !category || !type) {
      return res.status(400).json({ message: "title, category, and type are required" });
    }

    let finalFileUrl = fileUrl;
    if (type === "pdf" && req.file) {
      finalFileUrl = `/uploads/materials/${req.file.filename}`;
    }

    const material = await StudyMaterial.create({
      title,
      description,
      category,
      type,
      fileUrl: finalFileUrl,
      content,
      uploadedBy: req.user._id,
    });
    res.status(201).json(material);
  } catch (err) {
    res.status(500).json({ message: "Failed to create material", error: err.message });
  }
};

// @route PUT /api/materials/:id   (admin)
export const updateMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!material) return res.status(404).json({ message: "Material not found" });
    res.json(material);
  } catch (err) {
    res.status(500).json({ message: "Failed to update material", error: err.message });
  }
};

// @route PATCH /api/materials/:id/toggle   (admin)
export const toggleMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found" });
    material.isVisible = !material.isVisible;
    await material.save();
    res.json(material);
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle material visibility", error: err.message });
  }
};

// @route DELETE /api/materials/:id   (admin)
export const deleteMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found" });
    res.json({ message: "Material deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete material", error: err.message });
  }
};
