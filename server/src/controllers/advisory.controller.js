import { getPrisma } from '../config/db.js';

export const getAdvisories = async (req, res) => {
  try {
    const prisma = getPrisma();
    const advisories = await prisma.advisory.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, advisories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const { rating, comments, category } = req.body;
    const prisma = getPrisma();

    const record = await prisma.feedback.create({
      data: {
        rating: Number(rating) || 5,
        comments: comments || '',
        category: category || 'General Feedback'
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback recorded. Thank you for helping improve citizen transparency!',
      feedbackId: record.id
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

