/**
 * Job Controller
 */

const Job = require("../models/Job");
const User = require("../models/User");
const Application = require("../models/Application");
const Payment = require("../models/Payment");

// ===============================
// CREATE JOB
// ===============================

exports.createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      budget,
      deadline,
      location,
      work_type,
      commitment,
      experience_level,
      payment_type,
      skills,
    } = req.body;

    const posterId = req.userId;

    // Validate required fields
    if (!title || !description || !budget) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and budget are required",
      });
    }

    // Validate user role (must be poster)
    if (req.user.role !== "poster") {
      return res.status(403).json({
        success: false,
        message: "Only posters can create jobs",
      });
    }

    // Validate budget
    if (budget <= 0) {
      return res.status(400).json({
        success: false,
        message: "Budget must be greater than 0",
      });
    }

    // Create job
    const jobData = {
      poster_id: posterId,
      title,
      description,
      category_id: category_id || null,
      budget,
      deadline: deadline || null,
      location: location || null,
      status: "open", // Explicitly set status to "open"
      work_type: work_type || null,
      commitment: commitment || null,
      experience_level: experience_level || null,
      payment_type: payment_type || null,
      skills: skills || null,
    };

    const jobId = await Job.create(jobData);

    // Fetch the created job with full details
    const createdJob = await Job.findById(jobId);

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      job: createdJob,
    });
  } catch (error) {
    console.error("createJob error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create job",
      error: error.message,
    });
  }
};

// ===============================
// GET ALL JOBS (with filters)
// ===============================

exports.getAllJobs = async (req, res) => {
  try {
    const {
      category,
      status,
      location,
      minBudget,
      maxBudget,
      search,
      saved,
      work_type,
      commitment,
      experience_level,
      payment_type,
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const filters = {};
    if (category) filters.category_id = category;
    if (status) filters.status = status;
    if (location) filters.location = location;
    if (minBudget) filters.minBudget = parseFloat(minBudget);
    if (maxBudget) filters.maxBudget = parseFloat(maxBudget);
    if (search) filters.search = search;

    if (work_type) filters.work_type = work_type;
    if (commitment) filters.commitment = commitment;
    if (experience_level) filters.experience_level = experience_level;
    if (payment_type) filters.payment_type = payment_type;

    // ✅ Handle saved jobs filter
    // If saved=true is requested, return user's saved jobs instead
    if (saved === "true" || saved === true) {
      // Require authentication for saved jobs
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required to view saved jobs",
        });
      }

      try {
        const SavedJob = require("../models/SavedJob");
        const savedJobs = await SavedJob.findByUserId(req.userId);

        // Apply pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        const paginatedJobs = savedJobs.slice(offset, offset + limitNum);

        return res.json({
          success: true,
          jobs: paginatedJobs,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(savedJobs.length / limitNum),
            totalJobs: savedJobs.length,
            hasNext: pageNum * limitNum < savedJobs.length,
            hasPrev: pageNum > 1,
          },
        });
      } catch (error) {
        console.error("Error fetching saved jobs:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch saved jobs",
          error: error.message,
        });
      }
    }

    // Build filter object for regular jobs listing
    if (category) filters.category_id = category;
    if (status) filters.status = status;
    if (location) filters.location = location;
    if (minBudget) filters.minBudget = parseFloat(minBudget);
    if (maxBudget) filters.maxBudget = parseFloat(maxBudget);
    if (search) filters.search = search;
    if (saved) filters.saved = saved;

    // Build sort object
    const sort = {
      field: sortBy,
      order: sortOrder.toUpperCase(),
    };

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await Job.findAllWithFilters(filters, {
      limit: parseInt(limit),
      offset,
      sort,
    });

    res.json({
      success: true,
      jobs: result.jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.total / parseInt(limit)),
        totalJobs: result.total,
        hasNext: parseInt(page) * parseInt(limit) < result.total,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("getAllJobs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
};

// ===============================
// GET JOB BY ID
// ===============================

exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("getJobById error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE JOB
// ===============================

exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category_id,
      budget,
      status,
      deadline,
      location,
    } = req.body;
    const posterId = req.userId;

    // Check if job exists and belongs to user
    const existingJob = await Job.findById(id);
    if (!existingJob) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (existingJob.poster_id !== posterId) {
      return res.status(403).json({
        success: false,
        message: "You can only update jobs you created",
      });
    }

    // Validate user role (must be poster)
    if (req.user.role !== "poster") {
      return res.status(403).json({
        success: false,
        message: "Only posters can update jobs",
      });
    }

    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (budget) updateData.budget = budget;
    if (status) updateData.status = status;
    if (deadline) updateData.deadline = deadline;
    if (location) updateData.location = location;

    // Update job
    await Job.update(id, updateData);

    // Fetch updated job
    const updatedJob = await Job.findById(id);

    res.json({
      success: true,
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    console.error("updateJob error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update job",
      error: error.message,
    });
  }
};

// ===============================
// DELETE JOB
// ===============================

exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const posterId = req.userId;

    // Check if job exists and belongs to user
    const existingJob = await Job.findById(id);
    if (!existingJob) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (existingJob.poster_id !== posterId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete jobs you created",
      });
    }

    // Validate user role (must be poster)
    if (req.user.role !== "poster") {
      return res.status(403).json({
        success: false,
        message: "Only posters can delete jobs",
      });
    }

    // Delete job
    await Job.delete(id);

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("deleteJob error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete job",
      error: error.message,
    });
  }
};

// ===============================
// GET JOBS BY CURRENT USER
// ===============================

exports.getMyJobs = async (req, res) => {
  try {
    const posterId = req.userId;

    // Validate user role (must be poster)
    if (req.user.role !== "poster") {
      return res.status(403).json({
        success: false,
        message: "Only posters can view their jobs",
      });
    }

    const jobs = await Job.findByPosterId(posterId);

    res.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("getMyJobs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your jobs",
      error: error.message,
    });
  }
};

// ===============================
// GET SAVED JOBS
// ===============================

exports.getSavedJobs = async (req, res) => {
  try {
    const userId = req.userId;

    // Import SavedJob model
    const SavedJob = require("../models/SavedJob");

    // Get saved jobs with job and poster details for the user
    const savedJobs = await SavedJob.findByUserId(userId);

    // Format the response
    const jobDetails = savedJobs.map((savedJob) => ({
      id: savedJob.job_id,
      poster_id: savedJob.poster_id,
      title: savedJob.title,
      description: savedJob.description,
      category_id: savedJob.category_id,
      budget: savedJob.budget,
      status: savedJob.status,
      deadline: savedJob.deadline,
      location: savedJob.location,
      created_at: savedJob.created_at,
      updated_at: savedJob.updated_at,
      poster: {
        id: savedJob.poster_id,
        name: savedJob.poster_name,
        email: savedJob.poster_email,
        avatar: savedJob.poster_avatar,
      },
    }));

    res.json({
      success: true,
      savedJobs: jobDetails,
      count: jobDetails.length,
    });
  } catch (error) {
    console.error("getSavedJobs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch saved jobs",
      error: error.message,
    });
  }
};

// ===============================
// SAVE JOB
// ===============================

exports.saveJob = async (req, res) => {
  try {
    const { id } = req.params; // job id
    const userId = req.userId;

    // Check if job exists
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Import SavedJob model
    const SavedJob = require("../models/SavedJob");

    // Check if job is already saved by this user
    const existingSavedJob = await SavedJob.findByUserIdAndJobId(userId, id);
    if (existingSavedJob.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Job is already saved",
      });
    }

    // Save the job
    const savedJobId = await SavedJob.create({
      user_id: userId,
      job_id: id,
    });

    res.status(201).json({
      success: true,
      message: "Job saved successfully",
      savedJobId,
    });
  } catch (error) {
    console.error("saveJob error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save job",
      error: error.message,
    });
  }
};

// ===============================
// UNSAVE JOB
// ===============================

exports.unsaveJob = async (req, res) => {
  try {
    const { id } = req.params; // job id
    const userId = req.userId;

    // Import SavedJob model
    const SavedJob = require("../models/SavedJob");

    // Check if job is saved by this user
    const existingSavedJob = await SavedJob.findByUserIdAndJobId(userId, id);
    if (existingSavedJob.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job is not saved",
      });
    }

    // Remove the saved job
    await SavedJob.deleteByUserIdAndJobId(userId, id);

    res.json({
      success: true,
      message: "Job removed from saved successfully",
    });
  } catch (error) {
    console.error("unsaveJob error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove job from saved",
      error: error.message,
    });
  }
};

// ===============================
// COMPLETE JOB (with payment processing)
// ===============================

exports.completeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const posterId = req.userId;

    // Check if job exists and belongs to user
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.poster_id !== posterId) {
      return res.status(403).json({
        success: false,
        message: "You can only complete jobs you posted",
      });
    }

    // Check if job is ready for payment (after tasker submitted work)
    if (job.status !== "ready_for_payment") {
      return res.status(400).json({
        success: false,
        message: "Job must be ready for payment to complete. Tasker needs to submit work first.",
      });
    }

    // Find the accepted application for this job to identify the tasker
    const applications = await Application.findByJobId(id);
    const acceptedApplication = applications.find(
      (app) => app.status === "accepted"
    );

    if (!acceptedApplication) {
      return res.status(400).json({
        success: false,
        message: "No accepted application found for this job",
      });
    }

    // Process payment to the tasker
    const payment = await Payment.processPayment(
      id,
      posterId,
      acceptedApplication.tasker_id,
      job.budget
    );

    // Update job status to completed
    await Job.update(id, { status: "completed" });

    // Create conversation between poster and tasker for future communication
    const Chat = require("../models/Chat");
    await Chat.createConversation(
      id, // job_id
      posterId, // participant1_id
      acceptedApplication.tasker_id // participant2_id
    );

    // Create notifications for both parties to leave reviews
    const Notification = require("../models/Notification");

    // Notify poster to review tasker
    await Notification.create({
      user_id: posterId,
      type: "request_review",
      title: "Review Tasker",
      message: `Please review the tasker for job: ${job.title}`,
    });

    // Notify tasker to review poster
    await Notification.create({
      user_id: acceptedApplication.tasker_id,
      type: "request_review",
      title: "Review Poster",
      message: `Please review the poster for job: ${job.title}`,
    });

    res.json({
      success: true,
      message: "Job completed successfully and payment processed",
      payment,
      job: { ...job, status: "completed" },
    });
  } catch (error) {
    console.error("completeJob error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete job",
      error: error.message,
    });
  }
};

/**
 * Save/Bookmark a job
 * POST /api/jobs/:id/save
 */
exports.saveJob = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const jobId = req.params.id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if already saved
    const SavedJob = require("../models/SavedJob");
    const alreadySaved = await SavedJob.isJobSavedByUser(req.userId, jobId);

    if (alreadySaved) {
      return res.status(400).json({
        success: false,
        message: "Job is already saved",
      });
    }

    // Save the job
    await SavedJob.create({
      user_id: req.userId,
      job_id: jobId,
    });

    res.status(201).json({
      success: true,
      message: "Job saved successfully",
    });
  } catch (error) {
    console.error("saveJob error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save job",
      error: error.message,
    });
  }
};

/**
 * Unsave/Remove bookmark from a job
 * DELETE /api/jobs/:id/save
 */
exports.unsaveJob = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const jobId = req.params.id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Remove the saved job
    const SavedJob = require("../models/SavedJob");
    const removedRows = await SavedJob.deleteByUserIdAndJobId(
      req.userId,
      jobId
    );

    if (removedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "This job is not in your saved list",
      });
    }

    res.json({
      success: true,
      message: "Job removed from saved list",
    });
  } catch (error) {
    console.error("unsaveJob error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove saved job",
      error: error.message,
    });
  }
};

// ===============================
// SUBMIT WORK (Tasker - Mark job ready for payment)
// ===============================

/**
 * Submit work - Tasker marks job as completed and ready for payment
 * PUT /api/jobs/:id/submit-work (protected, tasker only)
 */
exports.submitWork = async (req, res) => {
  try {
    const { id } = req.params;
    const taskerId = req.userId;

    // Check if job exists
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if job is in progress
    if (job.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Job must be in progress to submit work",
      });
    }

    // Find accepted application to verify tasker is assigned to this job
    const Application = require("../models/Application");
    const applications = await Application.findByJobId(id);
    const acceptedApplication = applications.find(
      (app) => app.status === "accepted"
    );

    if (!acceptedApplication) {
      return res.status(404).json({
        success: false,
        message: "No accepted application found for this job",
      });
    }

    if (acceptedApplication.tasker_id !== taskerId) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned tasker for this job",
      });
    }

    // Update job status to "ready_for_payment" (waiting for poster to complete and pay)
    await Job.update(id, { status: "ready_for_payment" });

    // Create notification for poster to complete and pay
    const Notification = require("../models/Notification");
    await Notification.create({
      user_id: job.poster_id,
      type: "work_submitted",
      title: "Work Submitted",
      message: `Tasker has submitted work for job: ${job.title}. Please review and complete payment.`,
    });

    res.json({
      success: true,
      message: "Work submitted successfully. Waiting for poster to complete and pay.",
      job: { ...job, status: "ready_for_payment" },
    });
  } catch (error) {
    console.error("submitWork error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit work",
      error: error.message,
    });
  }
};
